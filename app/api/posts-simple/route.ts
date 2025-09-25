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
      console.error('WordPress URL not configured in environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'WordPress URL not configured',
          debug: {
            envVars: Object.keys(process.env).filter((key) =>
              key.includes('WORDPRESS')
            ),
            nodeEnv: process.env.NODE_ENV,
          },
        },
        { status: 500 }
      );
    }

    const apiUrl = `${wpUrl}/wp-json/wp/v2/posts?page=${page}&per_page=${perPage}&_embed=1`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log response status for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.warn('WordPress API response status:', response.status);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error response:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: `WordPress API error: ${response.status} ${response.statusText}`,
          debug: {
            url: apiUrl,
            status: response.status,
            statusText: response.statusText,
            responseBody: errorText,
          },
        },
        { status: response.status }
      );
    }

    const posts = await response.json();
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(
      response.headers.get('X-WP-TotalPages') || '1',
      10
    );

    return NextResponse.json({
      success: true,
      data: {
        posts,
        totalPosts,
        totalPages,
        currentPage: page,
        perPage,
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/posts-simple',
      },
    });
  } catch (error) {
    console.error('Posts API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
