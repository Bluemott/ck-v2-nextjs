import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { graphql, buildSchema } from 'graphql';
import { Pool } from 'pg';
import { promisify } from 'util';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10, // Cost optimization: limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// GraphQL Schema for WordPress blog
const schema = buildSchema(`
  type Author {
    id: ID!
    name: String!
    slug: String!
    avatar: String
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    count: Int!
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    count: Int!
  }

  type FeaturedImage {
    id: ID!
    sourceUrl: String!
    altText: String
    width: Int
    height: Int
  }

  type SEO {
    title: String
    metaDesc: String
    canonical: String
    opengraphTitle: String
    opengraphDescription: String
    opengraphImage: String
    twitterTitle: String
    twitterDescription: String
    twitterImage: String
    focuskw: String
    metaKeywords: String
    metaRobotsNoindex: String
    metaRobotsNofollow: String
    opengraphType: String
    opengraphUrl: String
    opengraphSiteName: String
    opengraphAuthor: String
    opengraphPublishedTime: String
    opengraphModifiedTime: String
    schema: String
  }

  type Post {
    id: ID!
    databaseId: Int!
    date: String!
    modified: String!
    slug: String!
    status: String!
    title: String!
    content: String!
    excerpt: String!
    author: Author!
    featuredImage: FeaturedImage
    categories: [Category!]!
    tags: [Tag!]!
    seo: SEO
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type PostsConnection {
    nodes: [Post!]!
    pageInfo: PageInfo!
  }

  type Query {
    posts(
      first: Int = 10
      after: String
      categoryName: String
      tagName: String
      search: String
    ): PostsConnection!
    
    post(slug: String!): Post
    
    categories(first: Int = 100): [Category!]!
    category(slug: String!): Category
    
    tags(first: Int = 100): [Tag!]!
    tag(slug: String!): Tag
  }
`);

// Root resolver
const root = {
  posts: async ({ first = 10, after, categoryName, tagName, search }: any) => {
    try {
      console.log('🔍 Starting posts query...');
      const client = await pool.connect();
      console.log('✅ Connected to database');
      
      try {
        // First, let's test a simple query to see if we can connect
        console.log('🧪 Testing basic database connection...');
        const testResult = await client.query('SELECT COUNT(*) as total FROM wp_posts');
        console.log(`📊 Total posts in database: ${testResult.rows[0].total}`);
        
        // If we have posts, let's see what the first one looks like
        if (parseInt(testResult.rows[0].total) > 0) {
          console.log('📋 Checking first post...');
          const firstPostResult = await client.query('SELECT * FROM wp_posts LIMIT 1');
          console.log('First post data:', JSON.stringify(firstPostResult.rows[0], null, 2));
        }
        
        let query = `
          SELECT 
            p.id,
            p.wordpress_id as database_id,
            p.post_date,
            p.post_modified,
            p.slug,
            p.post_status,
            p.post_title,
            p.post_content,
            p.post_excerpt,
            p.wordpress_data
          FROM wp_posts p
        `;
        
        console.log('📝 Executing query:', query);
        
        const params: any[] = [];
        let paramIndex = 1;
        
        if (categoryName) {
          query += `
            AND p.wordpress_id IN (
              SELECT DISTINCT p2.wordpress_id 
              FROM wp_posts p2
              JOIN wp_categories c ON c.cat_ID = ANY(
                SELECT jsonb_array_elements_text(p2.wordpress_data->'categories')
              )
              WHERE c.category_nicename = $${paramIndex}
            )
          `;
          params.push(categoryName);
          paramIndex++;
        }
        
        if (tagName) {
          query += `
            AND p.wordpress_id IN (
              SELECT DISTINCT p2.wordpress_id 
              FROM wp_posts p2
              JOIN wp_tags t ON t.tag_ID = ANY(
                SELECT jsonb_array_elements_text(p2.wordpress_data->'tags')
              )
              WHERE t.tag_slug = $${paramIndex}
            )
          `;
          params.push(tagName);
          paramIndex++;
        }
        
        if (search) {
          query += `
            AND (
              p.post_title ILIKE $${paramIndex} 
              OR p.post_content ILIKE $${paramIndex}
              OR p.post_excerpt ILIKE $${paramIndex}
            )
          `;
          params.push(`%${search}%`);
          paramIndex++;
        }
        
        query += ` ORDER BY p.post_date DESC LIMIT $${paramIndex}`;
        params.push(first);
        
        console.log('📊 Query parameters:', params);
        
        const result = await client.query(query, params);
        console.log(`📈 Query returned ${result.rows.length} rows`);
        
        if (result.rows.length > 0) {
          console.log('📋 First row sample:', JSON.stringify(result.rows[0], null, 2));
        }
        
        // Transform to GraphQL format
        const posts = await Promise.all(result.rows.map(async (row: any) => {
          // Parse WordPress data
          const wpData = row.wordpress_data ? JSON.parse(row.wordpress_data) : {};
          
          // Get categories from WordPress data
          const categories = wpData.categories || [];
          const categoryObjects = categories.map((catId: number) => ({
            id: `category-${catId}`,
            name: `Category ${catId}`, // We'll need to look this up
            slug: `category-${catId}`,
            description: null,
            count: 1
          }));
          
          // Get tags from WordPress data
          const tags = wpData.tags || [];
          const tagObjects = tags.map((tagId: number) => ({
            id: `tag-${tagId}`,
            name: `Tag ${tagId}`, // We'll need to look this up
            slug: `tag-${tagId}`,
            description: null,
            count: 1
          }));
          
          // Extract author info from WordPress data
          const author = {
            id: `author-${wpData.author || 1}`,
            name: wpData.author_info?.display_name || 'Unknown Author',
            slug: wpData.author_info?.user_nicename || 'unknown-author',
            avatar: wpData.author_info?.avatar_url || null
          };
          
          // Extract featured image from WordPress data
          const featuredImage = wpData.featured_media ? {
            id: `image-${wpData.featured_media}`,
            sourceUrl: wpData.featured_media_url || '',
            altText: wpData.featured_media_alt || null,
            width: wpData.featured_media_width || null,
            height: wpData.featured_media_height || null
          } : null;
          
          return {
            id: `post-${row.database_id}`,
            databaseId: row.database_id,
            date: row.post_date,
            modified: row.post_modified,
            slug: row.slug,
            status: row.post_status,
            title: row.post_title,
            content: row.post_content,
            excerpt: row.post_excerpt,
            author,
            featuredImage,
            categories: categoryObjects,
            tags: tagObjects,
            seo: null // We'll add SEO later if needed
          };
        }));
        
        console.log(`🎯 Transformed ${posts.length} posts`);
        
        // Simple pagination for now
        const pageInfo = {
          hasNextPage: posts.length === first,
          hasPreviousPage: false,
          startCursor: posts.length > 0 ? `post-${posts[0].databaseId}` : null,
          endCursor: posts.length > 0 ? `post-${posts[posts.length - 1].databaseId}` : null
        };
        
        return {
          nodes: posts,
          pageInfo
        };
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      return {
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null
        }
      };
    }
  },

  post: async ({ slug }: any) => {
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT 
            p.id,
            p.wordpress_id as database_id,
            p.post_date,
            p.post_modified,
            p.slug,
            p.post_status,
            p.post_title,
            p.post_content,
            p.post_excerpt,
            p.wordpress_data
          FROM wp_posts p
          WHERE p.slug = $1
        `;
        
        const result = await client.query(query, [slug]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        const wpData = row.wordpress_data ? JSON.parse(row.wordpress_data) : {};
        
        // Get categories from WordPress data
        const categories = wpData.categories || [];
        const categoryObjects = categories.map((catId: number) => ({
          id: `category-${catId}`,
          name: `Category ${catId}`,
          slug: `category-${catId}`,
          description: null,
          count: 1
        }));
        
        // Get tags from WordPress data
        const tags = wpData.tags || [];
        const tagObjects = tags.map((tagId: number) => ({
          id: `tag-${tagId}`,
          name: `Tag ${tagId}`,
          slug: `tag-${tagId}`,
          description: null,
          count: 1
        }));
        
        // Extract author info from WordPress data
        const author = {
          id: `author-${wpData.author || 1}`,
          name: wpData.author_info?.display_name || 'Unknown Author',
          slug: wpData.author_info?.user_nicename || 'unknown-author',
          avatar: wpData.author_info?.avatar_url || null
        };
        
        // Extract featured image from WordPress data
        const featuredImage = wpData.featured_media ? {
          id: `image-${wpData.featured_media}`,
          sourceUrl: wpData.featured_media_url || '',
          altText: wpData.featured_media_alt || null,
          width: wpData.featured_media_width || null,
          height: wpData.featured_media_height || null
        } : null;
        
        return {
          id: `post-${row.database_id}`,
          databaseId: row.database_id,
          date: row.post_date,
          modified: row.post_modified,
          slug: row.slug,
          status: row.post_status,
          title: row.post_title,
          content: row.post_content,
          excerpt: row.post_excerpt,
          author,
          featuredImage,
          categories: categoryObjects,
          tags: tagObjects,
          seo: null
        };
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  },

  categories: async ({ first = 100 }: any) => {
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT 
            cat_ID as id,
            cat_name as name,
            category_nicename as slug,
            category_description as description
          FROM wp_categories
          ORDER BY cat_name
          LIMIT $1
        `;
        
        const result = await client.query(query, [first]);
        
        return result.rows.map((row: any) => ({
          id: `category-${row.id}`,
          name: row.name,
          slug: row.slug,
          description: row.description,
          count: 1 // We'll calculate this later if needed
        }));
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  category: async ({ slug }: any) => {
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT 
            cat_ID as id,
            cat_name as name,
            category_nicename as slug,
            category_description as description
          FROM wp_categories
          WHERE category_nicename = $1
        `;
        
        const result = await client.query(query, [slug]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        
        return {
          id: `category-${row.id}`,
          name: row.name,
          slug: row.slug,
          description: row.description,
          count: 1
        };
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  },

  tags: async ({ first = 100 }: any) => {
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT 
            tag_ID as id,
            tag_name as name,
            tag_slug as slug,
            tag_description as description
          FROM wp_tags
          ORDER BY tag_name
          LIMIT $1
        `;
        
        const result = await client.query(query, [first]);
        
        return result.rows.map((row: any) => ({
          id: `tag-${row.id}`,
          name: row.name,
          slug: row.slug,
          description: row.description,
          count: 1
        }));
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  },

  tag: async ({ slug }: any) => {
    try {
      const client = await pool.connect();
      
      try {
        const query = `
          SELECT 
            tag_ID as id,
            tag_name as name,
            tag_slug as slug,
            tag_description as description
          FROM wp_tags
          WHERE tag_slug = $1
        `;
        
        const result = await client.query(query, [slug]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        
        return {
          id: `tag-${row.id}`,
          name: row.name,
          slug: row.slug,
          description: row.description,
          count: 1
        };
        
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching tag:', error);
      return null;
    }
  }
};

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the GraphQL query from the request
    const body = JSON.parse(event.body || '{}');
    const { query, variables } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          errors: [{ message: 'No GraphQL query provided' }]
        })
      };
    }

    // Execute the GraphQL query
    const result = await graphql({
      schema,
      source: query,
      rootValue: root,
      variableValues: variables
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('GraphQL handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        errors: [{ message: 'Internal server error' }]
      })
    };
  }
}; 