const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

exports.handler = async (event) => {
  try {
    const { postId, limit = 3 } = JSON.parse(event.body || '{}');
    
    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'postId is required'
        })
      };
    }

    const client = await pool.connect();
    
    try {
      // Get the current post to extract categories and tags
      const currentPostQuery = `
        SELECT 
          p.id,
          p.wordpress_data
        FROM wp_posts p
        WHERE p.wordpress_id = $1
      `;
      
      const currentPostResult = await client.query(currentPostQuery, [postId]);
      
      if (currentPostResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({
            error: 'Post not found'
          })
        };
      }

      const currentPost = currentPostResult.rows[0];
      const wpData = currentPost.wordpress_data ? JSON.parse(currentPost.wordpress_data) : {};
      
      const categories = wpData.categories || [];
      const tags = wpData.tags || [];

      // Get posts with similar categories or tags
      let recommendationsQuery = `
        SELECT 
          p.id,
          p.wordpress_id,
          p.post_date,
          p.slug,
          p.post_title,
          p.post_excerpt,
          p.wordpress_data
        FROM wp_posts p
        WHERE p.wordpress_id != $1
        AND p.post_status = 'publish'
      `;

      const queryParams = [postId];
      let paramIndex = 2;

      if (categories.length > 0) {
        recommendationsQuery += `
          AND p.wordpress_id IN (
            SELECT DISTINCT p2.wordpress_id 
            FROM wp_posts p2
            WHERE p2.wordpress_data::jsonb ? 'categories'
            AND p2.wordpress_data->'categories' ?| $${paramIndex}
          )
        `;
        queryParams.push(categories.map(cat => cat.toString()));
        paramIndex++;
      }

      if (tags.length > 0) {
        recommendationsQuery += `
          OR p.wordpress_id IN (
            SELECT DISTINCT p2.wordpress_id 
            FROM wp_posts p2
            WHERE p2.wordpress_data::jsonb ? 'tags'
            AND p2.wordpress_data->'tags' ?| $${paramIndex}
          )
        `;
        queryParams.push(tags.map(tag => tag.toString()));
        paramIndex++;
      }

      recommendationsQuery += `
        ORDER BY p.post_date DESC
        LIMIT $${paramIndex}
      `;
      queryParams.push(limit * 2); // Get more to allow for filtering

      const recommendationsResult = await client.query(recommendationsQuery, queryParams);
      
      // Transform and score recommendations
      const recommendations = recommendationsResult.rows.map(row => {
        const wpData = row.wordpress_data ? JSON.parse(row.wordpress_data) : {};
        const postCategories = wpData.categories || [];
        const postTags = wpData.tags || [];
        
        // Calculate similarity score
        const categoryOverlap = categories.filter(cat => postCategories.includes(cat)).length;
        const tagOverlap = tags.filter(tag => postTags.includes(tag)).length;
        const score = (categoryOverlap * 2) + tagOverlap; // Categories weighted more heavily
        
        return {
          id: row.wordpress_id,
          title: row.post_title,
          excerpt: row.post_excerpt,
          slug: row.slug,
          date: row.post_date,
          score,
          categoryOverlap,
          tagOverlap
        };
      });

      // Sort by score and take top results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          recommendations: sortedRecommendations,
          total: sortedRecommendations.length
        })
      };

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Recommendations error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
}; 