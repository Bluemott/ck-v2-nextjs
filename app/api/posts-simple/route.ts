import { NextRequest, NextResponse } from 'next/server';

// Disable Edge Runtime to avoid module issues
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '9', 10);
    const search = searchParams.get('search') || '';
    const categories = searchParams.get('categories') || '';
    const tags = searchParams.get('tags') || '';
    const orderby = searchParams.get('orderby') || 'date';
    const order = searchParams.get('order') || 'desc';

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

    // Build WordPress API URL with all parameters
    const wpParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      _embed: '1',
      orderby,
      order,
    });

    if (search) wpParams.append('search', search);
    if (categories) wpParams.append('categories', categories);
    if (tags) wpParams.append('tags', tags);

    const apiUrl = `${wpUrl}/wp-json/wp/v2/posts?${wpParams.toString()}`;

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
