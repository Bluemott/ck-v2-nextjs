import { NextRequest, NextResponse } from 'next/server';
import { fetchPosts, fetchPostsWithPagination } from '../../lib/api';
import { monitoring } from '../../lib/monitoring';
import { WordPressCache } from '../../lib/cache';
import { z } from 'zod';

// Query parameter schema for validation
const querySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  per_page: z.string().transform(val => parseInt(val, 10)).optional(),
  search: z.string().optional(),
  categories: z.string().transform(val => val.split(',').map(id => parseInt(id, 10))).optional(),
  tags: z.string().transform(val => val.split(',').map(id => parseInt(id, 10))).optional(),
  orderby: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  with_pagination: z.string().transform(val => val === 'true').optional()
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('X-Request-ID') || 'unknown';

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = querySchema.parse(queryParams);
    
    // Log request details
    await monitoring.info('Posts API request', {
      requestId,
      params: validatedParams,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for'),
    });

    // Determine if we want pagination info
    const withPagination = validatedParams.with_pagination || false;
    
    let result;
    
    // Use cache for non-search requests
    if (!validatedParams.search) {
      result = await monitoring.measurePerformance('posts-cache-lookup', async () => {
        return WordPressCache.getPosts(
          validatedParams.page || 1,
          validatedParams.per_page || 12
        );
      });
    } else {
      // For search requests, always fetch fresh data
      result = await monitoring.measurePerformance('posts-api-fetch', async () => {
        if (withPagination) {
          return await fetchPostsWithPagination({
            page: validatedParams.page,
            per_page: validatedParams.per_page || 12,
            search: validatedParams.search,
            categories: validatedParams.categories,
            tags: validatedParams.tags,
            orderby: validatedParams.orderby || 'date',
            order: validatedParams.order || 'desc'
          });
        } else {
          const posts = await fetchPosts({
            page: validatedParams.page,
            per_page: validatedParams.per_page || 12,
            search: validatedParams.search,
            categories: validatedParams.categories,
            tags: validatedParams.tags,
            orderby: validatedParams.orderby || 'date',
            order: validatedParams.order || 'desc'
          });
          
          return {
            posts,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null
            },
            totalCount: posts.length
          };
        }
      });
    }

    const responseTime = Date.now() - startTime;

    // Record API call metrics
    await monitoring.recordAPICall('/api/posts', responseTime, 200);

    // Log successful response
    await monitoring.info('Posts API response', {
      requestId,
      responseTime,
      resultCount: result.posts?.length || 0,
      withPagination,
    });

    // Return successful response with proper headers
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/posts',
        method: 'GET',
        requestId,
        responseTime,
        cacheStatus: validatedParams.search ? 'miss' : 'hit'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
        'X-Request-ID': requestId,
        'X-Response-Time': responseTime.toString(),
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Record error metrics
    await monitoring.recordAPICall('/api/posts', responseTime, error instanceof z.ZodError ? 400 : 500);
    
    // Log error details
    await monitoring.error('Posts API error', {
      requestId,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('API Error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        meta: {
          requestId,
          responseTime,
          timestamp: new Date().toISOString(),
        }
      }, { 
        status: 400,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': responseTime.toString(),
        }
      });
    }
    
    // Handle other errors
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      meta: {
        requestId,
        responseTime,
        timestamp: new Date().toISOString(),
      }
    }, { 
      status: 500,
      headers: {
        'X-Request-ID': requestId,
        'X-Response-Time': responseTime.toString(),
      }
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  await monitoring.warn('Posts API method not allowed', {
    requestId,
    method: 'POST',
    endpoint: '/api/posts',
  });

  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests',
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    }
  }, { 
    status: 405,
    headers: {
      'X-Request-ID': requestId,
    }
  });
} 