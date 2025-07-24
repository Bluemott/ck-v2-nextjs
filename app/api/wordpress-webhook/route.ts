import { NextRequest, NextResponse } from 'next/server';
import { 
  submitWordPressPostToIndexNow,
  submitWordPressCategoryToIndexNow,
  submitWordPressTagToIndexNow,
  submitToIndexNow
} from '../../lib/indexnow';

/**
 * POST /api/wordpress-webhook
 * WordPress webhook endpoint for automatic IndexNow submissions
 * 
 * This endpoint can be called by WordPress when content is published/updated
 * to automatically submit URLs to IndexNow for faster indexing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,           // 'publish', 'update', 'delete'
      post_type,        // 'post', 'category', 'tag'
      post_id,          // WordPress post ID
      post_slug,        // WordPress post slug
      post_status,      // 'publish', 'draft', etc.
      categories,       // Array of category slugs
      tags,            // Array of tag slugs
      urls             // Array of URLs to submit
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
    const successCount = results.filter(r => r.result.success).length;
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