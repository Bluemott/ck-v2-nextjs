import { NextRequest, NextResponse } from 'next/server';
import { validateWordPressWebhook } from '../../lib/validation';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the webhook data structure
    const validatedWebhook = validateWordPressWebhook(body);
    
    // Extract validated data
    const {
      post_id,
      post_title,
      post_name,
      post_status,
      post_type,
      old_slug,
      new_slug
    } = validatedWebhook;

    // Log the webhook event for debugging
    console.log('WordPress webhook received:', {
      post_id,
      post_title,
      post_name,
      post_status,
      post_type,
      old_slug,
      new_slug,
      timestamp: new Date().toISOString()
    });

    // Handle different post statuses
    switch (post_status) {
      case 'publish':
        // Handle published post
        console.log(`Post ${post_id} published: ${post_title}`);
        break;
        
      case 'draft':
        // Handle draft post
        console.log(`Post ${post_id} saved as draft: ${post_title}`);
        break;
        
      case 'private':
        // Handle private post
        console.log(`Post ${post_id} made private: ${post_title}`);
        break;
        
      case 'trash':
        // Handle deleted post
        console.log(`Post ${post_id} moved to trash: ${post_title}`);
        break;
        
      default:
        console.log(`Post ${post_id} status changed to ${post_status}: ${post_title}`);
    }

    // Handle slug changes if both old and new slugs are provided
    if (old_slug && new_slug && old_slug !== new_slug) {
      console.log(`Slug change detected for post ${post_id}: ${old_slug} -> ${new_slug}`);
      
      // Here you could implement redirect creation logic
      // For example, create a redirect from old slug to new slug
      try {
        // This is where you would create a redirect
        // await createRedirect(old_slug, new_slug);
        console.log(`Redirect created: /${old_slug} -> /${new_slug}`);
      } catch (redirectError) {
        console.error('Failed to create redirect:', redirectError);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        post_id,
        post_title,
        post_name,
        post_status,
        post_type,
        slug_changed: old_slug && new_slug && old_slug !== new_slug,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('WordPress webhook error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid webhook data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'WordPress webhook endpoint',
    description: 'Receives webhook notifications from WordPress for post changes',
    supportedEvents: [
      'post_publish',
      'post_update', 
      'post_delete',
      'slug_change'
    ],
    requiredFields: [
      'post_id',
      'post_title', 
      'post_name',
      'post_status',
      'post_type'
    ],
    optionalFields: [
      'old_slug',
      'new_slug'
    ]
  });
} 