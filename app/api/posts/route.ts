
import { createGETHandler, createMethodNotAllowedHandler, handleWordPressError, transformWordPressResponse } from '../../lib/api-handler';
import { CACHE_CONTROL } from '../../lib/api-response';
import { restAPIClient } from '../../lib/rest-api';
import { monitoring } from '../../lib/monitoring';

// Disable Edge Runtime to avoid module issues
export const runtime = 'nodejs';

// Posts API Handler
const postsHandler = async ({ query, responseBuilder }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBuilder: any;
}) => {
  try {
    const {
      page = 1,
      per_page = 9,
      search,
      categories,
      tags,
      orderby = 'date',
      order = 'desc'
    } = query;

    // Fetch posts from WordPress REST API
    const result = await restAPIClient.getPosts({
      page,
      per_page,
      search,
      categories,
      tags,
      orderby,
      order,
      _embed: true
    });

    // Transform response
    const responseData = transformWordPressResponse(result.posts, {
      currentPage: page,
      perPage: per_page,
      totalPages: result.pagination.totalPages,
      totalItems: result.pagination.totalPosts
    });

    // Log successful API call
    await monitoring.info('Posts API call successful', {
      requestId: responseBuilder.getRequestId(),
      endpoint: '/api/posts',
      resultCount: result.posts.length,
      totalPosts: result.pagination.totalPosts,
      totalPages: result.pagination.totalPages,
      currentPage: page,
      perPage: per_page,
    });

    return responseBuilder.success(responseData, 200, CACHE_CONTROL.SHORT);

  } catch (error) {
    // Handle WordPress API errors
    return handleWordPressError(error, responseBuilder);
  }
};

// Export GET handler
export const GET = createGETHandler(postsHandler, {
  endpoint: '/api/posts',
  cacheControl: CACHE_CONTROL.SHORT,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
});

// Export POST handler (method not allowed)
export const POST = createMethodNotAllowedHandler('/api/posts'); 