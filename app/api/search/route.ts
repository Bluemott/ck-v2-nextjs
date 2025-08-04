import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '../../lib/api';
import { z } from 'zod';

// Query parameter schema for validation
const querySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  per_page: z.string().transform(val => parseInt(val, 10)).optional()
});

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = querySchema.parse(queryParams);
    
    // Perform search
    const searchResults = await searchPosts(validatedParams.q, {
      page: validatedParams.page,
      per_page: validatedParams.per_page || 50
    });
    
    // Return successful response with proper headers
    return NextResponse.json({
      success: true,
      data: {
        query: validatedParams.q,
        results: searchResults.posts,
        pagination: {
          totalPosts: searchResults.totalPosts,
          totalPages: searchResults.totalPages,
          currentPage: validatedParams.page || 1,
          perPage: validatedParams.per_page || 50
        },
        meta: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/search',
          method: 'GET'
        }
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

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
} 