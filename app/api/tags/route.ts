import { createGETHandler, createMethodNotAllowedHandler, handleWordPressError, transformWordPressResponse } from '../../lib/api-handler';
import { CACHE_CONTROL } from '../../lib/api-response';
import { restAPIClient } from '../../lib/rest-api';
import { monitoring } from '../../lib/monitoring';

// Tags API Handler
const tagsHandler = async ({ query, responseBuilder }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBuilder: any;
}) => {
  try {
    const {
      page = 1,
      per_page = 100,
      orderby = 'name',
      order = 'asc'
    } = query;

    // Fetch tags from WordPress REST API
    const tags = await restAPIClient.getTags({
      page,
      per_page,
      orderby,
      order
    });

    // Transform response
    const responseData = transformWordPressResponse(tags, {
      currentPage: page,
      perPage: per_page,
      totalPages: Math.ceil(tags.length / per_page),
      totalItems: tags.length
    });

    // Log successful API call
    await monitoring.info('Tags API call successful', {
      requestId: responseBuilder.getRequestId(),
      endpoint: '/api/tags',
      resultCount: tags.length,
      currentPage: page,
      perPage: per_page,
    });

    return responseBuilder.success(responseData, 200, CACHE_CONTROL.MEDIUM);

  } catch (error) {
    // Handle WordPress API errors
    return handleWordPressError(error, responseBuilder);
  }
};

// Export GET handler
export const GET = createGETHandler(tagsHandler, {
  endpoint: '/api/tags',
  cacheControl: CACHE_CONTROL.MEDIUM,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
  },
});

// Export POST handler (method not allowed)
export const POST = createMethodNotAllowedHandler('/api/tags'); 