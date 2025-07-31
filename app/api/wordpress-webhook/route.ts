import { NextRequest, NextResponse } from 'next/server';
import { 
  submitWordPressPostToIndexNow,
  submitWordPressCategoryToIndexNow,
  submitWordPressTagToIndexNow,
  submitToIndexNow
} from '../../lib/indexnow';
import { handleSlugChange as handleSlugChangeRedirect } from '../../lib/redirect-manager';

/**
 * POST /api/wordpress-webhook
 * WordPress webhook endpoint for automatic IndexNow submissions and redirect management
 * 
 * This endpoint can be called by WordPress when content is published/updated
 * to automatically submit URLs to IndexNow for faster indexing and handle slug changes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,           // 'publish', 'update', 'delete', 'slug_change'
      post_type,        // 'post', 'category', 'tag'
      post_slug,        // WordPress post slug
      post_status,      // 'publish', 'draft', etc.
      categories,       // Array of category slugs
      tags,            // Array of tag slugs
      urls,            // Array of URLs to submit
      // Slug change specific fields
      old_slug,        // Previous slug (for slug changes)
      new_slug,        // New slug (for slug changes)
      old_url,         // Previous URL (for slug changes)
      new_url,         // New URL (for slug changes)
      post_id,         // WordPress post ID
      post_title       // Post title (for logging)
    } = body;

    // Validate webhook secret (optional security measure)
    const webhookSecret = process.env.WORDPRESS_WEBHOOK_SECRET;
    const providedSecret = request.headers.get('x-webhook-secret');
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      return NextResponse.json(
        { error: 'Unauthorized webhook request' },
        { status: 401 }
      );
    }

    const results = [];

    // Handle slug changes
    if (action === 'slug_change' && old_slug && new_slug) {
      const redirectResult = await handleSlugChange({
        oldSlug: old_slug,
        newSlug: new_slug,
        oldUrl: old_url,
        newUrl: new_url,
        postId: post_id,
        postTitle: post_title
      });
      
      results.push({
        type: 'slug_change',
        old_slug,
        new_slug,
        result: redirectResult
      });
    }

    // Handle different content types and actions
    if (action === 'publish' || action === 'update') {
      if (post_type === 'post' && post_slug && post_status === 'publish') {
        // Submit new/updated blog post
        const result = await submitWordPressPostToIndexNow(post_slug);
        results.push({
          type: 'post',
          slug: post_slug,
          result
        });
      }

      if (categories && Array.isArray(categories)) {
        // Submit category URLs
        for (const categorySlug of categories) {
          const result = await submitWordPressCategoryToIndexNow(categorySlug);
          results.push({
            type: 'category',
            slug: categorySlug,
            result
          });
        }
      }

      if (tags && Array.isArray(tags)) {
        // Submit tag URLs
        for (const tagSlug of tags) {
          const result = await submitWordPressTagToIndexNow(tagSlug);
          results.push({
            type: 'tag',
            slug: tagSlug,
            result
          });
        }
      }

      if (urls && Array.isArray(urls)) {
        // Submit custom URLs
        const result = await submitToIndexNow(urls);
        results.push({
          type: 'custom_urls',
          urls,
          result
        });
      }
    }

    // Return results
    const successCount = results.filter(r => r.result?.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Processed ${totalCount} submissions. ${successCount} successful.`,
      results,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('WordPress webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle slug changes by creating automatic redirects
 */
async function handleSlugChange({
  oldSlug,
  newSlug,
  oldUrl,
  newUrl,
  postId,
  postTitle
}: {
  oldSlug: string;
  newSlug: string;
  oldUrl: string;
  newUrl: string;
  postId: number;
  postTitle: string;
}) {
  try {
    // Log the slug change
    console.warn(`Slug change detected: "${oldSlug}" → "${newSlug}" for post "${postTitle}" (ID: ${postId})`);
    
    // Use the redirect manager to handle the slug change
    handleSlugChangeRedirect({
      oldSlug,
      newSlug,
      postId,
      postTitle
    });
    
    // Submit the old URL to IndexNow for removal
    await submitToIndexNow([oldUrl]);
    
    // Submit the new URL to IndexNow for indexing
    await submitToIndexNow([newUrl]);
    
    return {
      success: true,
      message: `Redirect created: /blog/${oldSlug} → /blog/${newSlug}`,
      redirect_entry: {
        source: `/blog/${oldSlug}`,
        destination: `/blog/${newSlug}`,
        permanent: true,
      }
    };
    
  } catch (error) {
    console.error('Error handling slug change:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * GET /api/wordpress-webhook
 * Webhook status and configuration info
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    description: 'WordPress webhook endpoint for automatic IndexNow submissions',
    supported_actions: ['publish', 'update', 'delete'],
    supported_types: ['post', 'category', 'tag'],
    webhook_url: '/api/wordpress-webhook',
    documentation: 'Send POST requests with WordPress content data to automatically submit to IndexNow'
  }, { status: 200 });
} 