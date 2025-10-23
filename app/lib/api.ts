import { z } from 'zod';
import { env } from './env';
import { lambdaAPIClient } from './lambda-api';
import {
  restAPIClient,
  type WPRestCategory,
  type WPRestPost,
  type WPRestSearchResult,
  type WPRestTag,
} from './rest-api';

// Conditional cache import to avoid client-side bundling issues
let cacheManager: typeof import('./cache').cacheManager | null = null;
if (typeof window === 'undefined') {
  try {
    // Dynamic import to avoid bundling issues
    import('./cache')
      .then((cacheModule) => {
        cacheManager = cacheModule.cacheManager;
      })
      .catch((error) => {
        console.warn('Cache not available in current environment:', error);
      });
  } catch (error) {
    console.warn('Cache not available in current environment:', error);
  }
}

// Re-export types for use in other components
export type { WPRestCategory, WPRestTag };

// API Configuration with validated environment variables
const API_CONFIG = {
  WORDPRESS_REST_URL:
    env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com',
  WORDPRESS_ADMIN_URL:
    env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com',
};

// Blog Post Schema for validation with more flexible excerpt handling
const blogPostSchema = z.object({
  id: z.number(),
  date: z.string(),
  modified: z.string(),
  slug: z.string(),
  status: z.string(),
  title: z.object({ rendered: z.string() }),
  content: z.object({ rendered: z.string() }),
  excerpt: z
    .object({
      rendered: z.string().default(''),
      protected: z.boolean().optional(),
    })
    .or(z.string().transform((str) => ({ rendered: str, protected: false }))),
  author: z.number(),
  featured_media: z.number(),
  _embedded: z.any().optional(),
  // Yoast SEO fields
  yoast_head: z.string().optional(),
  yoast_head_json: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      robots: z
        .object({
          index: z.string().optional(),
          follow: z.string().optional(),
          'max-snippet': z.string().optional(),
          'max-image-preview': z.string().optional(),
          'max-video-preview': z.string().optional(),
        })
        .optional(),
      canonical: z.string().optional(),
      og_locale: z.string().optional(),
      og_type: z.string().optional(),
      og_title: z.string().optional(),
      og_description: z.string().optional(),
      og_url: z.string().optional(),
      og_site_name: z.string().optional(),
      article_published_time: z.string().optional(),
      article_modified_time: z.string().optional(),
      og_image: z
        .array(
          z.object({
            url: z.string(),
            type: z.string().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
          })
        )
        .optional(),
      author: z.string().optional(),
      twitter_card: z.string().optional(),
      twitter_title: z.string().optional(),
      twitter_description: z.string().optional(),
      twitter_image: z.string().optional(),
      twitter_misc: z.record(z.string(), z.string()).optional(),
      schema: z
        .object({
          '@context': z.string(),
          '@graph': z.array(z.record(z.string(), z.unknown())),
        })
        .optional(),
    })
    .optional(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Search Parameters Schema
const searchParamsSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  search: z.string().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  orderby: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  _embed: z.boolean().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// Transform WordPress REST API response to our BlogPost format
function transformWPRestPost(wpPost: WPRestPost): BlogPost {
  // Ensure excerpt has the correct structure
  let safeExcerpt = wpPost.excerpt;
  if (!safeExcerpt || typeof safeExcerpt !== 'object') {
    console.warn(
      'transformWPRestPost: Invalid excerpt format, creating safe excerpt object:',
      safeExcerpt
    );
    safeExcerpt = { rendered: String(safeExcerpt || ''), protected: false };
  } else if (!safeExcerpt.rendered) {
    console.warn(
      'transformWPRestPost: Missing excerpt.rendered, setting to empty string'
    );
    safeExcerpt.rendered = '';
  }

  return {
    id: wpPost.id,
    date: wpPost.date,
    modified: wpPost.modified,
    slug: wpPost.slug,
    status: wpPost.status,
    title: wpPost.title,
    content: wpPost.content,
    excerpt: safeExcerpt,
    author: wpPost.author,
    featured_media: wpPost.featured_media,
    _embedded: wpPost._embedded,
    // Include Yoast SEO fields
    yoast_head: wpPost.yoast_head,
    yoast_head_json: wpPost.yoast_head_json,
  };
}

/**
 * Fetch posts with validation using REST API and caching
 */
export async function fetchPosts(
  params: SearchParams = {}
): Promise<BlogPost[]> {
  try {
    // Validate search parameters
    const validatedParams = searchParamsSchema.parse(params);

    let result: {
      posts: WPRestPost[];
      pagination?: {
        totalPosts: number;
        totalPages: number;
        currentPage: number;
        perPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };

    // Use cached posts if available (server-side only)
    if (cacheManager) {
      result = await cacheManager.getCachedPosts({
        page: validatedParams.page,
        per_page: validatedParams.per_page || 12,
        search: validatedParams.search,
        categories: validatedParams.categories,
        tags: validatedParams.tags,
        orderby: validatedParams.orderby || 'date',
        order: validatedParams.order || 'desc',
        _embed: true,
      });
    } else {
      // For client-side, use Next.js API routes to avoid CORS issues
      const isClient = typeof window !== 'undefined';

      if (isClient) {
        // Use Next.js API route for client-side requests
        const searchParams = new URLSearchParams();
        if (validatedParams.page)
          searchParams.append('page', validatedParams.page.toString());
        if (validatedParams.per_page)
          searchParams.append('per_page', validatedParams.per_page.toString());
        if (validatedParams.search)
          searchParams.append('search', validatedParams.search);
        if (validatedParams.categories)
          searchParams.append(
            'categories',
            validatedParams.categories.join(',')
          );
        if (validatedParams.tags)
          searchParams.append('tags', validatedParams.tags.join(','));
        if (validatedParams.orderby)
          searchParams.append('orderby', validatedParams.orderby);
        if (validatedParams.order)
          searchParams.append('order', validatedParams.order);

        const response = await fetch(
          `/api/posts-simple?${searchParams.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const apiResult = await response.json();
        result = {
          posts: apiResult.data.posts,
          pagination: {
            totalPosts: apiResult.data.totalPosts,
            totalPages: apiResult.data.totalPages,
            currentPage: apiResult.data.currentPage,
            perPage: apiResult.data.perPage,
            hasNextPage: apiResult.data.currentPage < apiResult.data.totalPages,
            hasPreviousPage: apiResult.data.currentPage > 1,
          },
        };
      } else {
        // Server-side: use direct API call
        const posts = await restAPIClient.getPosts({
          page: validatedParams.page,
          per_page: validatedParams.per_page || 12,
          search: validatedParams.search,
          categories: validatedParams.categories,
          tags: validatedParams.tags,
          orderby: validatedParams.orderby || 'date',
          order: validatedParams.order || 'desc',
          _embed: true,
        });
        result = posts;
      }
    }

    // Transform and validate each post
    const validatedPosts = result.posts
      .map((post: WPRestPost) => {
        try {
          const transformed = transformWPRestPost(post);
          return blogPostSchema.parse(transformed);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Post validation error:', error.issues);
          }
          return null;
        }
      })
      .filter(Boolean) as BlogPost[];

    return validatedPosts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch posts with pagination and caching
 */
export async function fetchPostsWithPagination(
  params: SearchParams = {}
): Promise<{
  posts: BlogPost[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}> {
  try {
    const validatedParams = searchParamsSchema.parse(params);

    let result: {
      posts: WPRestPost[];
      pagination: { totalPages: number; totalPosts: number };
    };

    // Use cached posts if available (server-side only)
    if (cacheManager) {
      result = await cacheManager.getCachedPosts({
        page: validatedParams.page,
        per_page: validatedParams.per_page || 12,
        search: validatedParams.search,
        categories: validatedParams.categories,
        tags: validatedParams.tags,
        orderby: validatedParams.orderby || 'date',
        order: validatedParams.order || 'desc',
        _embed: true,
      });
    } else {
      // For client-side, use Next.js API routes to avoid CORS issues
      const isClient = typeof window !== 'undefined';

      if (isClient) {
        // Use Next.js API route for client-side requests
        const searchParams = new URLSearchParams();
        if (validatedParams.page)
          searchParams.append('page', validatedParams.page.toString());
        if (validatedParams.per_page)
          searchParams.append('per_page', validatedParams.per_page.toString());
        if (validatedParams.search)
          searchParams.append('search', validatedParams.search);
        if (validatedParams.categories)
          searchParams.append(
            'categories',
            validatedParams.categories.join(',')
          );
        if (validatedParams.tags)
          searchParams.append('tags', validatedParams.tags.join(','));
        if (validatedParams.orderby)
          searchParams.append('orderby', validatedParams.orderby);
        if (validatedParams.order)
          searchParams.append('order', validatedParams.order);

        const response = await fetch(
          `/api/posts-simple?${searchParams.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const apiResult = await response.json();
        result = {
          posts: apiResult.data.posts,
          pagination: {
            totalPosts: apiResult.data.totalPosts,
            totalPages: apiResult.data.totalPages,
          },
        };
      } else {
        // Server-side: use direct API call
        const posts = await restAPIClient.getPosts({
          page: validatedParams.page,
          per_page: validatedParams.per_page || 12,
          search: validatedParams.search,
          categories: validatedParams.categories,
          tags: validatedParams.tags,
          orderby: validatedParams.orderby || 'date',
          order: validatedParams.order || 'desc',
          _embed: true,
        });
        result = posts;
      }
    }

    // Transform and validate posts
    const validatedPosts = result.posts
      .map((post: WPRestPost) => {
        try {
          const transformed = transformWPRestPost(post);
          return blogPostSchema.parse(transformed);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Post validation error:', error.issues);
          }
          return null;
        }
      })
      .filter(Boolean) as BlogPost[];

    const currentPage = validatedParams.page || 1;
    const hasNextPage = currentPage < result.pagination.totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      posts: validatedPosts,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: hasPreviousPage
          ? String((currentPage - 1) * (validatedParams.per_page || 12))
          : null,
        endCursor: hasNextPage
          ? String(currentPage * (validatedParams.per_page || 12))
          : null,
      },
      totalCount: result.pagination.totalPosts,
    };
  } catch (error) {
    console.error('Error fetching posts with pagination:', error);
    return {
      posts: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    };
  }
}

/**
 * Fetch a single post by slug with caching
 */
export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // Use cached post if available
    if (cacheManager) {
      const post = await cacheManager.getCachedPost(slug);
      if (!post) return null;

      const transformed = transformWPRestPost(post);
      return blogPostSchema.parse(transformed);
    } else {
      // Fallback to direct API call
      const posts = await restAPIClient.getPosts({ slug });
      if (!posts.posts || posts.posts.length === 0) return null;

      const post = posts.posts[0];
      if (!post) return null;

      const transformed = transformWPRestPost(post);
      return blogPostSchema.parse(transformed);
    }
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * Fetch categories with caching
 */
export async function fetchCategories(): Promise<WPRestCategory[]> {
  try {
    if (cacheManager) {
      return await cacheManager.getCachedCategories();
    } else {
      // For client-side, use Next.js API routes to avoid CORS issues
      const isClient = typeof window !== 'undefined';

      if (isClient) {
        // Use Next.js API route for client-side requests
        const response = await fetch('/api/categories', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const apiResult = await response.json();
        return apiResult.data?.data || [];
      } else {
        // Server-side: use direct API call
        return await restAPIClient.getCategories();
      }
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch category by slug
 */
export async function fetchCategoryBySlug(
  slug: string
): Promise<WPRestCategory | null> {
  try {
    if (cacheManager) {
      const categories = await cacheManager.getCachedCategories();
      return (
        categories.find((cat: WPRestCategory) => cat.slug === slug) || null
      );
    } else {
      // Fallback to direct API call
      const categories = await restAPIClient.getCategories();
      return (
        categories.find((cat: WPRestCategory) => cat.slug === slug) || null
      );
    }
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

/**
 * Fetch tags with caching
 */
export async function fetchTags(): Promise<WPRestTag[]> {
  try {
    if (cacheManager) {
      return await cacheManager.getCachedTags();
    } else {
      // For client-side, use Next.js API routes to avoid CORS issues
      const isClient = typeof window !== 'undefined';

      if (isClient) {
        // Use Next.js API route for client-side requests
        const response = await fetch('/api/tags', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const apiResult = await response.json();
        return apiResult.data?.data || [];
      } else {
        // Server-side: use direct API call
        return await restAPIClient.getTags();
      }
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Fetch tag by slug
 */
export async function fetchTagBySlug(slug: string): Promise<WPRestTag | null> {
  try {
    if (cacheManager) {
      const tags = await cacheManager.getCachedTags();
      return tags.find((tag: WPRestTag) => tag.slug === slug) || null;
    } else {
      // For client-side, use Next.js API routes to avoid CORS issues
      const isClient = typeof window !== 'undefined';

      if (isClient) {
        // Use Next.js API route for client-side requests
        const response = await fetch(`/api/tags?slug=${slug}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const apiResult = await response.json();
        const tags = apiResult.data?.data || [];
        return tags.length > 0 ? tags[0] : null;
      } else {
        // Server-side: use direct API call
        const tags = await restAPIClient.getTags();
        return tags.find((tag: WPRestTag) => tag.slug === slug) || null;
      }
    }
  } catch (error) {
    console.error('Error fetching tag by slug:', error);
    return null;
  }
}

/**
 * Fetch related posts with caching
 */
export async function fetchRelatedPosts(
  postId: number,
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    // Try Lambda API first for better performance and advanced recommendations
    const lambdaResult = await lambdaAPIClient.getRecommendations(
      postId,
      limit
    );

    if (lambdaResult.recommendations.length > 0) {
      // Log successful Lambda API usage for monitoring
      console.warn(
        `Lambda API recommendations found: ${lambdaResult.recommendations.length} posts`
      );
      return lambdaResult.recommendations;
    }

    // Fallback to WordPress REST API if Lambda returns no results
    console.warn(
      'Lambda API returned no results, falling back to WordPress REST API'
    );
    const relatedPosts = await restAPIClient.getRelatedPosts(postId, limit);

    return relatedPosts
      .map((post: WPRestPost) => {
        try {
          const transformed = transformWPRestPost(post);
          return blogPostSchema.parse(transformed);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Related post validation error:', error.issues);
          }
          return null;
        }
      })
      .filter(Boolean) as BlogPost[];
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

/**
 * Get recommendations with metadata using Lambda API
 * Returns enhanced information about the recommendation process
 */
export async function fetchRecommendationsWithMetadata(
  postId: number,
  limit: number = 3
): Promise<{
  recommendations: BlogPost[];
  total: number;
  metadata?: {
    sourcePostId: number;
    categoriesFound: number;
    tagsFound: number;
    totalPostsProcessed: number;
    uniquePostsFound: number;
  };
  source: 'lambda' | 'wordpress';
}> {
  try {
    // Try Lambda API first
    const lambdaResult = await lambdaAPIClient.getRecommendations(
      postId,
      limit
    );

    if (lambdaResult.recommendations.length > 0) {
      return {
        ...lambdaResult,
        source: 'lambda' as const,
      };
    }

    // Fallback to WordPress REST API
    const relatedPosts = await restAPIClient.getRelatedPosts(postId, limit);
    const transformedPosts = relatedPosts
      .map((post: WPRestPost) => {
        try {
          const transformed = transformWPRestPost(post);
          return blogPostSchema.parse(transformed);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Related post validation error:', error.issues);
          }
          return null;
        }
      })
      .filter(Boolean) as BlogPost[];

    return {
      recommendations: transformedPosts,
      total: transformedPosts.length,
      source: 'wordpress' as const,
    };
  } catch (error) {
    console.error('Error fetching recommendations with metadata:', error);
    return {
      recommendations: [],
      total: 0,
      source: 'wordpress' as const,
    };
  }
}

/**
 * Search posts with caching
 */
export async function searchPosts(
  query: string,
  params: {
    page?: number;
    per_page?: number;
  } = {}
): Promise<{
  posts: BlogPost[];
  totalPages: number;
  totalPosts: number;
}> {
  try {
    const result = await restAPIClient.searchPosts(query, {
      page: params.page,
      per_page: params.per_page || 12,
      subtype: 'post',
    });

    // Transform and validate posts
    const validatedPosts = result.results
      .map((result: WPRestSearchResult) => {
        try {
          // Convert search result to blog post format
          const post: BlogPost = {
            id: result.id,
            title: { rendered: result.title },
            slug: result.url.split('/').pop() || '',
            excerpt: { rendered: result.title, protected: false },
            content: { rendered: result.title },
            date: new Date().toISOString(),
            modified: new Date().toISOString(),
            author: 0,
            featured_media: 0,
            status: 'publish',
            _embedded: undefined,
          };
          return post;
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error(
              'Search post validation error:',
              (error as z.ZodError).issues
            );
          }
          return null;
        }
      })
      .filter(Boolean) as BlogPost[];

    return {
      posts: validatedPosts,
      totalPages: result.totalPages,
      totalPosts: result.total,
    };
  } catch (error) {
    console.error('Error searching posts:', error);
    return {
      posts: [],
      totalPages: 0,
      totalPosts: 0,
    };
  }
}

/**
 * Convert WordPress image URLs to use the correct domain for CORS
 * Remove any CloudFront remnants and ensure direct WordPress API access
 */
export function convertImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  // Convert wp-origin URLs to api URLs for proper CORS handling
  if (url.includes('wp-origin.cowboykimono.com')) {
    return url.replace('wp-origin.cowboykimono.com', 'api.cowboykimono.com');
  }

  // Remove any CloudFront URLs and use direct WordPress API
  if (url.includes('cloudfront.net')) {
    // Extract the WordPress path and use direct API URL
    const pathMatch = url.match(/\/wp-content\/uploads\/.*$/);
    if (pathMatch) {
      return `https://api.cowboykimono.com${pathMatch[0]}`;
    }
  }

  // Ensure all WordPress images use direct API access
  if (
    url.includes('/wp-content/uploads/') &&
    !url.includes('api.cowboykimono.com')
  ) {
    const pathMatch = url.match(/\/wp-content\/uploads\/.*$/);
    if (pathMatch) {
      return `https://api.cowboykimono.com${pathMatch[0]}`;
    }
  }

  return url;
}

/**
 * Decode HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Check if we're in a browser environment
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Server-side fallback: basic HTML entity decoding
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Safely process WordPress excerpt data
 * Handles both string and object formats from WordPress REST API
 */
export function processExcerpt(
  excerpt: unknown,
  maxLength: number = 150
): string {
  if (!excerpt) return '';

  let excerptText = '';

  try {
    // Handle WordPress REST API excerpt object format
    if (
      typeof excerpt === 'object' &&
      excerpt !== null &&
      'rendered' in excerpt
    ) {
      excerptText = (excerpt as { rendered: string }).rendered || '';
    } else if (typeof excerpt === 'string') {
      excerptText = excerpt;
    } else {
      excerptText = String(excerpt || '');
    }

    // Ensure excerptText is a string
    if (typeof excerptText !== 'string') {
      excerptText = String(excerptText || '');
    }

    // Additional safety check: ensure we have a valid string before processing
    if (!excerptText || typeof excerptText !== 'string') {
      return '';
    }

    // Clean HTML tags and decode entities
    let cleanExcerpt = '';
    try {
      cleanExcerpt = excerptText
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .trim();
    } catch (cleanError) {
      console.error('processExcerpt: error cleaning excerpt:', cleanError);
      cleanExcerpt = String(excerptText || '').trim();
    }

    // Final safety check before calling substring
    if (!cleanExcerpt || typeof cleanExcerpt !== 'string') {
      return '';
    }

    // Truncate if needed
    if (cleanExcerpt.length > maxLength) {
      try {
        return `${cleanExcerpt.substring(0, maxLength)}...`;
      } catch (substringError) {
        console.error(
          'processExcerpt: error calling substring:',
          substringError,
          'cleanExcerpt:',
          cleanExcerpt
        );
        return `${cleanExcerpt.slice(0, maxLength)}...`; // Fallback to slice
      }
    }

    return cleanExcerpt;
  } catch (error) {
    console.error('Error processing excerpt:', error, 'excerpt:', excerpt);
    return '';
  }
}

/**
 * Fetch media data by ID when embedded data is missing
 */
export async function fetchMediaById(mediaId: number): Promise<{
  source_url: string;
  alt_text: string;
} | null> {
  try {
    const wpRestUrl =
      env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com';
    const response = await fetch(`${wpRestUrl}/wp-json/wp/v2/media/${mediaId}`);

    if (!response.ok) {
      console.warn(`Failed to fetch media ${mediaId}: ${response.status}`);
      return null;
    }

    const media = await response.json();
    return {
      source_url: convertImageUrl(media.source_url),
      alt_text: media.alt_text || '',
    };
  } catch (error) {
    console.error(`Error fetching media ${mediaId}:`, error);
    return null;
  }
}

/**
 * Get featured image URL from post with enhanced fallback and debugging
 */
export function getFeaturedImageUrl(post: BlogPost): string | null {
  if (!post) {
    console.warn('getFeaturedImageUrl - No post provided');
    return null;
  }

  // Check if post has embedded featured media
  if (post._embedded?.['wp:featuredmedia']?.[0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    if (media.source_url) {
      return convertImageUrl(media.source_url);
    }
  }

  // Also check for media_details URLs (different image sizes)
  if (post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes) {
    const sizes = post._embedded['wp:featuredmedia'][0].media_details.sizes;
    // Try to get the largest available size
    const sizeOrder = ['full', 'large', 'medium_large', 'medium', 'thumbnail'];
    for (const size of sizeOrder) {
      if (sizes[size]?.source_url) {
        return convertImageUrl(sizes[size].source_url);
      }
    }
  }

  // If no embedded data but post has featured_media ID, return null
  // The WordPressImage component will handle fetching the media data
  if (post.featured_media && post.featured_media > 0) {
    if (process.env.CI !== 'true') {
      console.warn(
        'getFeaturedImageUrl - No embedded data, but featured_media ID exists:',
        {
          postId: post.id,
          postTitle: post.title?.rendered,
          featuredMediaId: post.featured_media,
        }
      );
    }
    return null;
  }

  // Enhanced debugging for missing featured images
  if (process.env.CI !== 'true') {
    console.warn('getFeaturedImageUrl - No featured image found for post:', {
      postId: post.id,
      postTitle: post.title?.rendered,
      featuredMediaId: post.featured_media,
      hasEmbedded: !!post._embedded,
      embeddedKeys: post._embedded ? Object.keys(post._embedded) : [],
      hasFeaturedMedia: !!post._embedded?.['wp:featuredmedia'],
      featuredMediaLength: post._embedded?.['wp:featuredmedia']?.length || 0,
    });
  }

  return null;
}

/**
 * Get featured image alt text from post with enhanced fallback
 */
export function getFeaturedImageAlt(post: BlogPost): string {
  if (!post) {
    return '';
  }

  if (!post._embedded?.['wp:featuredmedia']?.[0]) {
    return '';
  }

  const media = post._embedded['wp:featuredmedia'][0];
  return media.alt_text || post.title?.rendered || '';
}

/**
 * Get post categories from embedded data
 */
export function getPostCategories(post: BlogPost): Array<{
  id: number;
  name: string;
  slug: string;
}> {
  if (!post._embedded?.['wp:term']) {
    return [];
  }

  const terms = post._embedded['wp:term'];
  const categories = terms.find(
    (termArray: Record<string, unknown>[]) =>
      termArray.length > 0 &&
      (termArray[0] as Record<string, unknown>).taxonomy === 'category'
  );

  if (!categories) {
    return [];
  }

  return categories.map((cat: Record<string, unknown>) => ({
    id: cat.id as number,
    name: cat.name as string,
    slug: cat.slug as string,
  }));
}

/**
 * Get post tags from embedded data
 */
export function getPostTags(post: BlogPost): Array<{
  id: number;
  name: string;
  slug: string;
}> {
  if (!post._embedded?.['wp:term']) {
    return [];
  }

  const terms = post._embedded['wp:term'];
  const tags = terms.find(
    (termArray: Record<string, unknown>[]) =>
      termArray.length > 0 &&
      (termArray[0] as Record<string, unknown>).taxonomy === 'post_tag'
  );

  if (!tags) {
    return [];
  }

  return tags.map((tag: Record<string, unknown>) => ({
    id: tag.id as number,
    name: tag.name as string,
    slug: tag.slug as string,
  }));
}

/**
 * Get post author from embedded data
 */
export function getPostAuthor(post: BlogPost): {
  id: number;
  name: string;
  slug: string;
  avatar?: string;
} | null {
  if (!post._embedded?.author?.[0]) {
    return null;
  }

  const author = post._embedded.author[0];
  return {
    id: author.id,
    name: author.name,
    slug: author.slug,
    avatar:
      author.avatar_urls?.['96'] || author.avatar_urls?.['48'] || undefined,
  };
}

/**
 * Get WordPress admin URL
 */
export function getWordPressAdminUrl(): string {
  return API_CONFIG.WORDPRESS_ADMIN_URL;
}

/**
 * Get API configuration
 */
export function getApiConfig() {
  return API_CONFIG;
}

/**
 * Cache management functions
 */
export function invalidatePostCache(slug: string): void {
  if (cacheManager) {
    cacheManager.clearPost(slug);
  }
}

export function invalidateAllCache(): void {
  if (cacheManager) {
    cacheManager.clear();
  }
}

export function getCacheStats() {
  return (
    cacheManager?.getStats() || { hitCount: 0, missCount: 0, evictionCount: 0 }
  );
}

export async function warmCache(): Promise<void> {
  if (cacheManager) {
    await cacheManager.warmCache();
  }
}
