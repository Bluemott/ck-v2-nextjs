import { restAPIClient, type WPRestPost, type WPRestCategory, type WPRestTag } from './rest-api';
import { z } from 'zod';

// Blog Post Schema for validation
const blogPostSchema = z.object({
  id: z.number(),
  date: z.string(),
  modified: z.string(),
  slug: z.string(),
  status: z.string(),
  title: z.object({ rendered: z.string() }),
  content: z.object({ rendered: z.string() }),
  excerpt: z.object({ rendered: z.string() }),
  author: z.number(),
  featured_media: z.number(),
  _embedded: z.object({
    author: z.array(z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      avatar_urls: z.record(z.string())
    })).optional(),
    'wp:featuredmedia': z.array(z.object({
      id: z.number(),
      source_url: z.string(),
      alt_text: z.string().optional(),
      media_details: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
        sizes: z.record(z.object({
          source_url: z.string(),
          width: z.number(),
          height: z.number()
        })).optional()
      }).optional()
    })).optional(),
    'wp:term': z.array(z.array(z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      taxonomy: z.string()
    }))).optional()
  }).optional()
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
  order: z.enum(['asc', 'desc']).optional()
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// Transform WordPress REST API response to our BlogPost format
function transformWPRestPost(wpPost: WPRestPost): BlogPost {
  return {
    id: wpPost.id,
    date: wpPost.date,
    modified: wpPost.modified,
    slug: wpPost.slug,
    status: wpPost.status,
    title: wpPost.title,
    content: wpPost.content,
    excerpt: wpPost.excerpt,
    author: wpPost.author,
    featured_media: wpPost.featured_media,
    _embedded: wpPost._embedded
  };
}

/**
 * Fetch posts with validation using REST API
 */
export async function fetchPosts(params: SearchParams = {}): Promise<BlogPost[]> {
  try {
    // Validate search parameters
    const validatedParams = searchParamsSchema.parse(params);
    
    const result = await restAPIClient.getPosts({
      page: validatedParams.page,
      per_page: validatedParams.per_page || 12,
      search: validatedParams.search,
      categories: validatedParams.categories,
      tags: validatedParams.tags,
      orderby: validatedParams.orderby || 'date',
      order: validatedParams.order || 'desc',
      _embed: true
    });

    // Transform and validate each post
    const validatedPosts = result.posts.map((post: WPRestPost) => {
      try {
        const transformed = transformWPRestPost(post);
        return blogPostSchema.parse(transformed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Post validation error:', error.issues);
        }
        return null;
      }
    }).filter(Boolean) as BlogPost[];

    return validatedPosts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch posts with pagination
 */
export async function fetchPostsWithPagination(params: SearchParams = {}): Promise<{
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
    
    const result = await restAPIClient.getPosts({
      page: validatedParams.page,
      per_page: validatedParams.per_page || 12,
      search: validatedParams.search,
      categories: validatedParams.categories,
      tags: validatedParams.tags,
      orderby: validatedParams.orderby || 'date',
      order: validatedParams.order || 'desc',
      _embed: true
    });

    const validatedPosts = result.posts.map((post: WPRestPost) => {
      try {
        const transformed = transformWPRestPost(post);
        return blogPostSchema.parse(transformed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Post validation error:', error.issues);
        }
        return null;
      }
    }).filter(Boolean) as BlogPost[];

    return {
      posts: validatedPosts,
      pageInfo: {
        hasNextPage: result.totalPages > (validatedParams.page || 1),
        hasPreviousPage: (validatedParams.page || 1) > 1,
        startCursor: validatedPosts.length > 0 ? validatedPosts[0].id.toString() : null,
        endCursor: validatedPosts.length > 0 ? validatedPosts[validatedPosts.length - 1].id.toString() : null,
      },
      totalCount: result.totalPosts,
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
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (!slug) {
      throw new Error('Slug is required');
    }

    const wpPost = await restAPIClient.getPostBySlug(slug);
    
    if (!wpPost) {
      return null;
    }

    const transformed = transformWPRestPost(wpPost);
    return blogPostSchema.parse(transformed);
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * Fetch categories
 */
export async function fetchCategories(): Promise<WPRestCategory[]> {
  try {
    return await restAPIClient.getCategories({
      per_page: 100,
      orderby: 'name',
      order: 'asc'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch tags
 */
export async function fetchTags(): Promise<WPRestTag[]> {
  try {
    return await restAPIClient.getTags({
      per_page: 100,
      orderby: 'name',
      order: 'asc'
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Fetch related posts
 */
export async function fetchRelatedPosts(postId: number, limit: number = 3): Promise<BlogPost[]> {
  try {
    const wpPosts = await restAPIClient.getRelatedPosts(postId, limit);
    
    return wpPosts.map((wpPost: WPRestPost) => {
      try {
        const transformed = transformWPRestPost(wpPost);
        return blogPostSchema.parse(transformed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Related post validation error:', error.issues);
        }
        return null;
      }
    }).filter(Boolean) as BlogPost[];
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

/**
 * Search posts
 */
export async function searchPosts(query: string, params: {
  page?: number;
  per_page?: number;
} = {}): Promise<{
  posts: BlogPost[];
  totalPages: number;
  totalPosts: number;
}> {
  try {
    const result = await restAPIClient.searchPosts(query, {
      page: params.page,
      per_page: params.per_page || 50
    });

    const validatedPosts = result.posts.map((post: WPRestPost) => {
      try {
        const transformed = transformWPRestPost(post);
        return blogPostSchema.parse(transformed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Search post validation error:', error.issues);
        }
        return null;
      }
    }).filter(Boolean) as BlogPost[];

    return {
      posts: validatedPosts,
      totalPages: result.totalPages,
      totalPosts: result.totalPosts
    };
  } catch (error) {
    console.error('Error searching posts:', error);
    return {
      posts: [],
      totalPages: 0,
      totalPosts: 0
    };
  }
}

/**
 * Decode HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') return '';
  
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
 * Get featured image URL from WordPress REST API response
 */
export function getFeaturedImageUrl(post: BlogPost): string | null {
  if (!post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    return null;
  }
  return post._embedded['wp:featuredmedia'][0].source_url;
}

/**
 * Get featured image alt text
 */
export function getFeaturedImageAlt(post: BlogPost): string {
  if (!post._embedded?.['wp:featuredmedia']?.[0]?.alt_text) {
    return '';
  }
  return post._embedded['wp:featuredmedia'][0].alt_text;
}

/**
 * Get categories from WordPress REST API response
 */
export function getPostCategories(post: BlogPost): Array<{
  id: number;
  name: string;
  slug: string;
}> {
  if (!post._embedded?.['wp:term']) {
    return [];
  }
  
  // Categories are typically the first term array (taxonomy: category)
  const categories = post._embedded['wp:term'][0] || [];
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug
  }));
}

/**
 * Get tags from WordPress REST API response
 */
export function getPostTags(post: BlogPost): Array<{
  id: number;
  name: string;
  slug: string;
}> {
  if (!post._embedded?.['wp:term']) {
    return [];
  }
  
  // Tags are typically the second term array (taxonomy: post_tag)
  const tags = post._embedded['wp:term'][1] || [];
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug
  }));
}

/**
 * Get author information from WordPress REST API response
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
    avatar: author.avatar_urls?.['96'] || author.avatar_urls?.['48'] || undefined
  };
}

/**
 * Get API configuration for debugging
 */
export function getApiConfig() {
  return {
    restAPIClient: restAPIClient.getConfig(),
  };
} 