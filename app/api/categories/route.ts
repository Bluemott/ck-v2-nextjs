import { NextRequest, NextResponse } from 'next/server';
import { fetchCategories } from '../../lib/api-rest';
import { z } from 'zod';

// Query parameter schema for validation
const querySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  per_page: z.string().transform(val => parseInt(val, 10)).optional(),
  orderby: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = querySchema.parse(queryParams);
    
    // Fetch categories
    const categories = await fetchCategories({
      page: validatedParams.page,
      per_page: validatedParams.per_page || 100,
      orderby: validatedParams.orderby || 'name',
      order: validatedParams.order || 'asc'
    });
    
    // Return successful response with proper headers
    return NextResponse.json({
      success: true,
      data: {
        categories,
        count: categories.length,
        meta: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/categories',
          method: 'GET'
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' // 30 min cache, 1 hour stale
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