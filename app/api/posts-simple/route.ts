import { NextRequest, NextResponse } from 'next/server';

// Disable Edge Runtime to avoid module issues
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '9', 10);
    
    // Simple WordPress API call
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_REST_URL;
    if (!wpUrl) {
      return NextResponse.json({
        success: false,
        error: 'WordPress URL not configured'
      }, { status: 500 });
    }
    
    const response = await fetch(`${wpUrl}/wp/v2/posts?page=${page}&per_page=${perPage}&_embed=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `WordPress API error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    const posts = await response.json();
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    
    return NextResponse.json({
      success: true,
      data: {
        posts,
        totalPosts,
        totalPages,
        currentPage: page,
        perPage
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/posts-simple',
      }
    });
    
  } catch (error) {
    console.error('Posts API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
} 