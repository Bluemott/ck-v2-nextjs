import { NextRequest, NextResponse } from 'next/server';
import { fetchPosts, fetchPostsWithPagination } from '../../lib/api-rest';
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
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = querySchema.parse(queryParams);
    
    // Determine if we want pagination info
    const withPagination = validatedParams.with_pagination || false;
    
    let result;
    
    if (withPagination) {
      result = await fetchPostsWithPagination({
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
      
      result = {
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

    // Return successful response with proper headers
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/posts',
        method: 'GET'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // 5 min cache, 10 min stale
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    // Handle other errors
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
} 