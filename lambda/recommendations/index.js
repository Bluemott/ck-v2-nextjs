const axios = require('axios');

// WordPress REST API configuration
const WORDPRESS_API_URL =
  process.env.WORDPRESS_API_URL || 'https://api.cowboykimono.com';

// Cache configuration
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300000; // 5 minutes
const cache = new Map();

// Simple in-memory cache for Lambda
function getCachedRecommendations(postId) {
  const cached = cache.get(postId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedRecommendations(postId, data) {
  cache.set(postId, {
    data,
    timestamp: Date.now(),
  });
}

// Security configuration
const SECURITY_CONFIG = {
  MAX_POST_ID: 1000000, // Reasonable upper limit
  MAX_LIMIT: 10, // Maximum recommendations to return
  TIMEOUT: 10000, // 10 second timeout
  ALLOWED_ORIGINS: [
    'https://cowboykimono.com',
    'https://www.cowboykimono.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
};

// Input validation function
function validateInput(postId, limit) {
  if (
    !postId ||
    typeof postId !== 'number' ||
    postId <= 0 ||
    postId > SECURITY_CONFIG.MAX_POST_ID
  ) {
    throw new Error(
      'Invalid postId: Must be a positive number within reasonable range'
    );
  }

  if (
    limit &&
    (typeof limit !== 'number' ||
      limit <= 0 ||
      limit > SECURITY_CONFIG.MAX_LIMIT)
  ) {
    throw new Error(
      `Invalid limit: Must be between 1 and ${SECURITY_CONFIG.MAX_LIMIT}`
    );
  }

  return {
    postId: Math.floor(postId),
    limit: limit ? Math.min(Math.floor(limit), SECURITY_CONFIG.MAX_LIMIT) : 3,
  };
}

// Security headers for all responses
function getSecurityHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type, user-agent, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

exports.handler = async (event) => {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getSecurityHeaders(),
      body: JSON.stringify({}),
    };
  }

  try {
    // Parse and validate input
    const requestBody = JSON.parse(event.body || '{}');
    const { postId, limit } = validateInput(
      requestBody.postId,
      requestBody.limit
    );

    if (!postId) {
      return {
        statusCode: 400,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'postId is required',
          details: 'Please provide a valid post ID',
        }),
      };
    }

    // Check cache first
    const cached = getCachedRecommendations(postId);
    if (cached) {
      return {
        statusCode: 200,
        headers: {
          ...getSecurityHeaders(),
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`,
        },
        body: JSON.stringify(cached),
      };
    }

    // Get all posts to find the current post (since individual post requests return 401)
    const allPostsResponse = await axios.get(
      `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?per_page=100&_embed=1&status=publish`,
      {
        timeout: SECURITY_CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'CowboyKimono-Lambda/1.0',
        },
      }
    );

    const allPosts = allPostsResponse.data;
    const currentPost = allPosts.find((post) => post.id === parseInt(postId));

    if (!currentPost) {
      return {
        statusCode: 404,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'Post not found',
          details: `Post with ID ${postId} could not be found`,
        }),
      };
    }

    const categories = currentPost._embedded?.['wp:term']?.[0] || [];
    const tags = currentPost._embedded?.['wp:term']?.[1] || [];

    // Get related posts using WordPress REST API
    const categoryIds = categories.map((cat) => cat.id);
    const tagIds = tags.map((tag) => tag.id);

    const [categoryPosts, tagPosts] = await Promise.all([
      categoryIds.length > 0
        ? axios.get(
            `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?categories=${categoryIds.join(',')}&per_page=${limit * 2}&_embed=1&status=publish`,
            {
              timeout: SECURITY_CONFIG.TIMEOUT,
              headers: {
                'User-Agent': 'CowboyKimono-Lambda/1.0',
              },
            }
          )
        : Promise.resolve({ data: [] }),
      tagIds.length > 0
        ? axios.get(
            `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?tags=${tagIds.join(',')}&per_page=${limit * 2}&_embed=1&status=publish`,
            {
              timeout: SECURITY_CONFIG.TIMEOUT,
              headers: {
                'User-Agent': 'CowboyKimono-Lambda/1.0',
              },
            }
          )
        : Promise.resolve({ data: [] }),
    ]);

    // Process and return recommendations
    const allRelatedPosts = [...categoryPosts.data, ...tagPosts.data];
    const uniquePosts = allRelatedPosts.filter(
      (post) => post.id !== parseInt(postId)
    );

    // Remove duplicates based on post ID
    const seen = new Set();
    const deduplicatedPosts = uniquePosts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });

    // Calculate similarity scores
    const scoredPosts = deduplicatedPosts.map((post) => {
      const postCategories = post._embedded?.['wp:term']?.[0] || [];
      const postTags = post._embedded?.['wp:term']?.[1] || [];

      const categoryOverlap = categories.filter((cat) =>
        postCategories.some((pc) => pc.id === cat.id)
      ).length;

      const tagOverlap = tags.filter((tag) =>
        postTags.some((pt) => pt.id === tag.id)
      ).length;

      const score = categoryOverlap * 2 + tagOverlap; // Categories weighted more heavily

      return {
        ...post,
        score,
        categoryOverlap,
        tagOverlap,
      };
    });

    // Sort by score and take top results
    const sortedRecommendations = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((post) => ({
        id: post.id,
        title: post.title.rendered,
        excerpt: post.excerpt.rendered,
        slug: post.slug,
        date: post.date,
        featured_media: post.featured_media,
        _embedded: post._embedded,
        score: post.score,
        categoryOverlap: post.categoryOverlap,
        tagOverlap: post.tagOverlap,
      }));

    // Cache the result
    setCachedRecommendations(postId, {
      recommendations: sortedRecommendations,
      total: sortedRecommendations.length,
      metadata: {
        sourcePostId: postId,
        categoriesFound: categories.length,
        tagsFound: tags.length,
        totalPostsProcessed: allRelatedPosts.length,
        uniquePostsFound: deduplicatedPosts.length,
      },
    });

    return {
      statusCode: 200,
      headers: {
        ...getSecurityHeaders(),
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${CACHE_TTL / 1000}`,
      },
      body: JSON.stringify({
        recommendations: sortedRecommendations,
        total: sortedRecommendations.length,
        metadata: {
          sourcePostId: postId,
          categoriesFound: categories.length,
          tagsFound: tags.length,
          totalPostsProcessed: allRelatedPosts.length,
          uniquePostsFound: deduplicatedPosts.length,
        },
      }),
    };
  } catch (error) {
    console.error('Recommendations error:', error);

    // Handle specific WordPress API errors
    if (error.response) {
      const statusCode = error.response.status;
      const message =
        statusCode === 404
          ? 'Post not found'
          : statusCode === 403
            ? 'Access forbidden'
            : 'WordPress API error';

      return {
        statusCode: statusCode,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: message,
          details: error.response.data || 'No additional details',
        }),
      };
    }

    // Handle validation errors
    if (error.message && error.message.includes('Invalid')) {
      return {
        statusCode: 400,
        headers: getSecurityHeaders(),
        body: JSON.stringify({
          error: 'Invalid input',
          details: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: getSecurityHeaders(),
      body: JSON.stringify({
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing your request',
      }),
    };
  }
};
