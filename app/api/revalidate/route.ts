import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { invalidateAllCache, invalidatePostCache } from '../../lib/cache';

/**
 * Manual revalidation endpoint for clearing cached content
 * 
 * Usage:
 * - POST /api/revalidate?secret=YOUR_SECRET&path=/blog/your-slug
 * - POST /api/revalidate?secret=YOUR_SECRET&tag=posts
 * - POST /api/revalidate?secret=YOUR_SECRET&all=true
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');
  const all = searchParams.get('all');

  // Validate secret token
  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Invalid secret token' },
      { status: 401 }
    );
  }

  try {
    const revalidated: string[] = [];

    // Revalidate all caches
    if (all === 'true') {
      invalidateAllCache();
      revalidatePath('/', 'layout');
      revalidatePath('/blog');
      revalidatePath('/downloads');
      revalidateTag('posts');
      revalidateTag('downloads');
      revalidated.push('all');
    }

    // Revalidate specific path
    if (path) {
      // Extract slug from path for cache invalidation
      const slugMatch = path.match(/\/blog\/([^/]+)/);
      if (slugMatch && slugMatch[1]) {
        invalidatePostCache(slugMatch[1]);
      }
      revalidatePath(path);
      revalidated.push(`path: ${path}`);
    }

    // Revalidate by tag
    if (tag) {
      revalidateTag(tag);
      revalidated.push(`tag: ${tag}`);
    }

    // If nothing specified, revalidate blog
    if (!path && !tag && all !== 'true') {
      invalidateAllCache();
      revalidatePath('/blog');
      revalidateTag('posts');
      revalidated.push('blog (default)');
    }

    return NextResponse.json({
      success: true,
      revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      {
        error: 'Revalidation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Manual revalidation endpoint',
    usage: {
      method: 'POST',
      params: {
        secret: 'Required - REVALIDATION_SECRET env var',
        path: 'Optional - specific path to revalidate (e.g., /blog/my-post)',
        tag: 'Optional - cache tag to revalidate (posts, downloads)',
        all: 'Optional - set to "true" to revalidate everything',
      },
    },
    examples: [
      'POST /api/revalidate?secret=xxx&path=/blog/jackalope-garden-display-diy',
      'POST /api/revalidate?secret=xxx&tag=posts',
      'POST /api/revalidate?secret=xxx&all=true',
    ],
  });
}

