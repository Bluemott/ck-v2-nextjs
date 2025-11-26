import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { invalidateDownloadsCache, invalidatePostCache } from '../../lib/cache';
import type {
  WebhookResponse,
  WebhookValidationError,
  WordPressWebhookPayload,
} from '../../lib/types/api';
import { validateWordPressWebhook } from '../../lib/validation';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the webhook data structure with proper error handling
    let validatedWebhook: WordPressWebhookPayload;
    try {
      validatedWebhook = validateWordPressWebhook(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors: WebhookValidationError[] = validationError.issues.map(
          (err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })
        );

        const errorResponse: WebhookResponse = {
          success: false,
          message: 'Invalid webhook data',
          errors,
        };

        return NextResponse.json(errorResponse, { status: 400 });
      }

      // Handle non-Zod validation errors
      const errorResponse: WebhookResponse = {
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'unknown',
            message:
              validationError instanceof Error
                ? validationError.message
                : 'Unknown validation error',
            code: 'VALIDATION_ERROR',
          },
        ],
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Extract validated data
    const {
      post_id,
      post_title,
      post_name,
      post_status,
      post_type,
      old_slug,
      new_slug,
      timestamp,
      user_id,
      user_login,
      user_email,
    } = validatedWebhook;

    // Log the webhook event for debugging
    console.warn('WordPress webhook received:', {
      post_id,
      post_title,
      post_name,
      post_status,
      post_type,
      old_slug,
      new_slug,
      timestamp: timestamp || new Date().toISOString(),
      user_id,
      user_login,
      user_email,
    });

    // Handle different post statuses and clear appropriate cache + trigger ISR revalidation
    switch (post_status) {
      case 'publish':
        // Handle published post - clear relevant cache and trigger ISR
        console.warn(`Post ${post_id} published: ${post_title}`);
        if (post_type === 'post') {
          invalidatePostCache(new_slug || post_name);
          // Trigger ISR revalidation for the specific blog post and index
          revalidatePath(`/blog/${new_slug || post_name}`);
          revalidatePath('/blog');
          revalidateTag('posts');
          console.warn(`ISR revalidation triggered for /blog/${new_slug || post_name}`);
        } else if (post_type === 'downloads') {
          invalidateDownloadsCache();
          // Trigger ISR revalidation for downloads
          revalidatePath('/downloads');
          revalidateTag('downloads');
          console.warn(`ISR revalidation triggered for /downloads`);
        }
        break;

      case 'draft':
        // Handle draft post
        console.warn(`Post ${post_id} saved as draft: ${post_title}`);
        break;

      case 'private':
        // Handle private post - clear cache and trigger ISR since it's no longer public
        console.warn(`Post ${post_id} made private: ${post_title}`);
        if (post_type === 'post') {
          invalidatePostCache(post_name);
          revalidatePath(`/blog/${post_name}`);
          revalidatePath('/blog');
          revalidateTag('posts');
        } else if (post_type === 'downloads') {
          invalidateDownloadsCache();
          revalidatePath('/downloads');
          revalidateTag('downloads');
        }
        break;

      case 'trash':
        // Handle deleted post - clear cache and trigger ISR since it's deleted
        console.warn(`Post ${post_id} moved to trash: ${post_title}`);
        if (post_type === 'post') {
          invalidatePostCache(post_name);
          revalidatePath(`/blog/${post_name}`);
          revalidatePath('/blog');
          revalidateTag('posts');
        } else if (post_type === 'downloads') {
          invalidateDownloadsCache();
          revalidatePath('/downloads');
          revalidateTag('downloads');
        }
        break;

      default:
        console.warn(
          `Post ${post_id} status changed to ${post_status}: ${post_title}`
        );
        // For any other status changes, clear cache and trigger ISR to be safe
        if (post_type === 'post') {
          invalidatePostCache(post_name);
          revalidatePath(`/blog/${post_name}`);
          revalidatePath('/blog');
          revalidateTag('posts');
        } else if (post_type === 'downloads') {
          invalidateDownloadsCache();
          revalidatePath('/downloads');
          revalidateTag('downloads');
        }
    }

    // Handle slug changes if both old and new slugs are provided
    const slugChanged = Boolean(old_slug && new_slug && old_slug !== new_slug);
    if (slugChanged) {
      console.warn(
        `Slug change detected for post ${post_id}: ${old_slug} -> ${new_slug}`
      );

      // Here you could implement redirect creation logic
      // For example, create a redirect from old slug to new slug
      try {
        // This is where you would create a redirect
        // await createRedirect(old_slug, new_slug);
        console.warn(`Redirect created: /${old_slug} -> /${new_slug}`);
      } catch (redirectError) {
        console.error('Failed to create redirect:', redirectError);
      }
    }

    // Return success response with proper typing
    const successResponse: WebhookResponse = {
      success: true,
      message: 'Webhook processed successfully',
      data: {
        post_id,
        post_title,
        post_name,
        post_status,
        post_type,
        slug_changed: slugChanged,
        timestamp: timestamp || new Date().toISOString(),
      },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('WordPress webhook error:', error);

    // Handle different types of errors
    let errorResponse: WebhookResponse;

    if (error instanceof z.ZodError) {
      const errors: WebhookValidationError[] = error.issues.map(
        (err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })
      );

      errorResponse = {
        success: false,
        message: 'Invalid webhook data',
        errors,
      };
    } else if (error instanceof SyntaxError) {
      errorResponse = {
        success: false,
        message: 'Invalid JSON payload',
        errors: [
          {
            field: 'body',
            message: 'Request body must be valid JSON',
            code: 'INVALID_JSON',
          },
        ],
      };
    } else {
      errorResponse = {
        success: false,
        message: 'Internal server error',
        errors: [
          {
            field: 'unknown',
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'INTERNAL_ERROR',
          },
        ],
      };
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    message: 'WordPress webhook endpoint',
    description:
      'Receives webhook notifications from WordPress for post changes',
    supportedEvents: [
      'post_publish',
      'post_update',
      'post_delete',
      'slug_change',
    ],
    requiredFields: [
      'post_id',
      'post_title',
      'post_name',
      'post_status',
      'post_type',
    ],
    optionalFields: [
      'old_slug',
      'new_slug',
      'timestamp',
      'user_id',
      'user_login',
      'user_email',
    ],
    example: {
      post_id: 123,
      post_title: 'Example Post',
      post_name: 'example-post',
      post_status: 'publish',
      post_type: 'post',
      old_slug: 'old-example-post',
      new_slug: 'new-example-post',
      timestamp: '2024-01-01T00:00:00Z',
      user_id: 1,
      user_login: 'admin',
      user_email: 'admin@example.com',
    },
  });
}
