import { NextRequest, NextResponse } from 'next/server';
import { fetchPostBySlug, fetchRelatedPosts } from '../../../lib/api-rest';
import { z } from 'zod';

// Path parameter schema for validation
const pathSchema = z.object({
  slug: z.string().min(1, 'Slug is required')
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Parse and validate path parameters
    const pathParams = await params;
    const validatedParams = pathSchema.parse(pathParams);
    
    // Get query parameters for related posts
    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get('include_related') === 'true';
    const relatedLimit = parseInt(searchParams.get('related_limit') || '3', 10);
    
    // Fetch the main post
    const post = await fetchPostBySlug(validatedParams.slug);
    
    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Post not found',
        message: `No post found with slug: ${validatedParams.slug}`
      }, { status: 404 });
    }
    
    // Prepare response data
    const responseData: any = {
      post,
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: `/api/posts/${validatedParams.slug}`,
        method: 'GET'
      }
    };
    
    // Include related posts if requested
    if (includeRelated) {
      try {
        const relatedPosts = await fetchRelatedPosts(post.id, relatedLimit);
        responseData.relatedPosts = relatedPosts;
      } catch (relatedError) {
        console.error('Error fetching related posts:', relatedError);
        responseData.relatedPosts = [];
      }
    }
    
    // Return successful response with proper headers
    return NextResponse.json({
      success: true,
      data: responseData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' // 10 min cache, 20 min stale
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
} 