import { NextRequest, NextResponse } from 'next/server';
import { fetchPostBySlug, fetchRelatedPosts } from '../../../lib/api';

// Path parameter schema for validation - currently unused but kept for future validation
// const pathSchema = z.object({
//   slug: z.string().min(1, 'Slug is required')
// });

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const debug = searchParams.get('debug') === 'true';
    const relatedLimit = parseInt(searchParams.get('related_limit') || '3');

    // Fetch the main post
    const post = await fetchPostBySlug(slug);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Fetch related posts
    const relatedPosts = await fetchRelatedPosts(post.id, relatedLimit);

    // Prepare response
    const response: Record<string, unknown> = {
      post,
      relatedPosts,
      meta: {
        totalRelated: relatedPosts.length,
        requestedLimit: relatedLimit,
        postId: post.id,
        postSlug: post.slug
      }
    };

    // Add debug information if requested
    if (debug) {
      response.debug = {
        postCategories: post._embedded?.['wp:term']?.[0] || [],
        postTags: post._embedded?.['wp:term']?.[1] || [],
        apiConfig: {
          wordpressRestUrl: process.env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com',
          useRestApi: process.env.NEXT_PUBLIC_USE_REST_API || 'true'
        }
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in posts/[slug] API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  _params: { params: Promise<{ slug: string }> }
) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
} 