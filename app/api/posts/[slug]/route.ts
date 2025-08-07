
import { createGETHandler, createMethodNotAllowedHandler, handleWordPressError } from '../../../lib/api-handler';
import { CACHE_CONTROL } from '../../../lib/api-response';
import { restAPIClient } from '../../../lib/rest-api';
import { monitoring } from '../../../lib/monitoring';

// Individual Post API Handler
const postHandler = async ({ 
  request, 
  responseBuilder 
}: {
  request: Request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBuilder: any;
}) => {
  try {
    const url = new URL(request.url);
    const slug = url.pathname.split('/').pop() || '';
    const searchParams = url.searchParams;
    const debug = searchParams.get('debug') === 'true';
    const relatedLimit = parseInt(searchParams.get('related_limit') || '3');

    if (!slug) {
      return responseBuilder.notFound('Post');
    }

    // Fetch the main post
    const post = await restAPIClient.getPostBySlug(slug);
    
    if (!post) {
      return responseBuilder.notFound('Post');
    }

    // Fetch related posts
    const relatedPosts = await restAPIClient.getRelatedPosts(post.id, relatedLimit);

    // Prepare response data
    const responseData: {
      post: typeof post;
      relatedPosts: typeof relatedPosts;
      meta: {
        totalRelated: number;
        requestedLimit: number;
        postId: number;
        postSlug: string;
      };
      debug?: {
        postCategories: unknown[];
        postTags: unknown[];
        apiConfig: {
          wordpressRestUrl: string;
          useRestApi: string;
        };
      };
    } = {
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
      responseData.debug = {
        postCategories: post._embedded?.['wp:term']?.[0] || [],
        postTags: post._embedded?.['wp:term']?.[1] || [],
        apiConfig: {
          wordpressRestUrl: process.env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com',
          useRestApi: process.env.NEXT_PUBLIC_USE_REST_API || 'true'
        }
      };
    }

    // Log successful API call
    await monitoring.info('Individual post API call successful', {
      requestId: responseBuilder.getRequestId(),
      endpoint: `/api/posts/${slug}`,
      postId: post.id,
      postSlug: post.slug,
      relatedPostsCount: relatedPosts.length,
      debug,
    });

    return responseBuilder.success(responseData, 200, CACHE_CONTROL.MEDIUM);

  } catch (error) {
    // Handle WordPress API errors
    return handleWordPressError(error, responseBuilder);
  }
};

// Export GET handler
export const GET = createGETHandler(postHandler, {
  endpoint: '/api/posts/[slug]',
  cacheControl: CACHE_CONTROL.MEDIUM,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
});

// Export POST handler (method not allowed)
export const POST = createMethodNotAllowedHandler('/api/posts/[slug]'); 