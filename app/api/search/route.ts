import { z } from 'zod';
import { createGETHandler, createMethodNotAllowedHandler, handleWordPressError, transformWordPressResponse } from '../../lib/api-handler';
import { CACHE_CONTROL } from '../../lib/api-response';
import { restAPIClient } from '../../lib/rest-api';
import { monitoring } from '../../lib/monitoring';

// Search query validation schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  per_page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional()
});

// Search API Handler
const searchHandler = async ({ query, responseBuilder }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBuilder: any;
}) => {
  try {
    const {
      q,
      page = 1,
      per_page = 50
    } = query;

    // Perform search using WordPress REST API
    const result = await restAPIClient.searchPosts(q, {
      page,
      per_page,
      subtype: 'post'
    });

    // Transform response
    const responseData = transformWordPressResponse(result.results, {
      currentPage: page,
      perPage: per_page,
      totalPages: result.totalPages,
      totalItems: result.total
    });

    // Add search query to response
    responseData.query = q;

    // Log successful API call
    await monitoring.info('Search API call successful', {
      requestId: responseBuilder.getRequestId(),
      endpoint: '/api/search',
      query: q,
      resultCount: result.results.length,
      totalPosts: result.total,
      totalPages: result.totalPages,
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
export const GET = createGETHandler(searchHandler, {
  endpoint: '/api/search',
  cacheControl: CACHE_CONTROL.SHORT,
  validateQuery: searchQuerySchema,
  rateLimit: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
  },
});

// Export POST handler (method not allowed)
export const POST = createMethodNotAllowedHandler('/api/search'); 