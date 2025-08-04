import { env } from './env';
import { restAPIClient, type WPRestPost, type WPRestCategory, type WPRestTag } from './rest-api';
import { z } from 'zod';

// API Configuration with validated environment variables
const API_CONFIG = {
  WORDPRESS_REST_URL: env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com',
  WORDPRESS_ADMIN_URL: env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com',
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
  excerpt: z.object({ 
    rendered: z.string().default(''),
    protected: z.boolean().optional()
  }).or(z.string().transform(str => ({ rendered: str, protected: false }))),
  author: z.number(),
  featured_media: z.number(),
  _embedded: z.any().optional()
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
  // Ensure excerpt has the correct structure
  let safeExcerpt = wpPost.excerpt;
  if (!safeExcerpt || typeof safeExcerpt !== 'object') {
    console.warn('transformWPRestPost: Invalid excerpt format, creating safe excerpt object:', safeExcerpt);
    safeExcerpt = { rendered: String(safeExcerpt || ''), protected: false };
  } else if (!safeExcerpt.rendered) {
    console.warn('transformWPRestPost: Missing excerpt.rendered, setting to empty string');
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

    // Transform and validate posts
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

    const currentPage = validatedParams.page || 1;
    const hasNextPage = currentPage < result.totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      posts: validatedPosts,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: hasPreviousPage ? String((currentPage - 1) * (validatedParams.per_page || 12)) : null,
        endCursor: hasNextPage ? String(currentPage * (validatedParams.per_page || 12)) : null,
      },
      totalCount: result.totalPosts
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
      totalCount: 0
    };
  }
}

/**
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const post = await restAPIClient.getPostBySlug(slug);
    if (!post) return null;

    const transformed = transformWPRestPost(post);
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
    return await restAPIClient.getCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<WPRestCategory | null> {
  try {
    const categories = await restAPIClient.getCategories();
    return categories.find(cat => cat.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

/**
 * Fetch tags
 */
export async function fetchTags(): Promise<WPRestTag[]> {
  try {
    return await restAPIClient.getTags();
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
    const tags = await restAPIClient.getTags();
    return tags.find(tag => tag.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching tag by slug:', error);
    return null;
  }
}

/**
 * Fetch related posts
 */
export async function fetchRelatedPosts(postId: number, limit: number = 3): Promise<BlogPost[]> {
  try {
    const relatedPosts = await restAPIClient.getRelatedPosts(postId, limit);
    
    return relatedPosts.map((post: WPRestPost) => {
      try {
        const transformed = transformWPRestPost(post);
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
      per_page: params.per_page || 12,
      subtype: 'post'
    });

    // Transform and validate posts
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
export function processExcerpt(excerpt: any, maxLength: number = 150): string {
  if (!excerpt) return '';
  
  let excerptText = '';
  
  try {
    // Debug logging
    console.log('processExcerpt input:', { excerpt, type: typeof excerpt, isObject: typeof excerpt === 'object' });
    
    // Handle WordPress REST API excerpt object format
    if (typeof excerpt === 'object' && excerpt !== null && 'rendered' in excerpt) {
      excerptText = excerpt.rendered || '';
      console.log('processExcerpt: extracted from object.rendered:', excerptText);
    } else if (typeof excerpt === 'string') {
      excerptText = excerpt;
      console.log('processExcerpt: using string directly:', excerptText);
    } else {
      excerptText = String(excerpt || '');
      console.log('processExcerpt: converted to string:', excerptText);
    }
    
    // Ensure excerptText is a string
    if (typeof excerptText !== 'string') {
      console.warn('processExcerpt: excerptText is not a string, converting:', typeof excerptText, excerptText);
      excerptText = String(excerptText || '');
    }
    
    // Additional safety check: ensure we have a valid string before processing
    if (!excerptText || typeof excerptText !== 'string') {
      console.warn('processExcerpt: invalid excerptText after conversion, returning empty string');
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
      console.warn('processExcerpt: cleanExcerpt is not a valid string:', typeof cleanExcerpt, cleanExcerpt);
      return '';
    }
    
    // Truncate if needed
    if (cleanExcerpt.length > maxLength) {
      try {
        return `${cleanExcerpt.substring(0, maxLength)}...`;
      } catch (substringError) {
        console.error('processExcerpt: error calling substring:', substringError, 'cleanExcerpt:', cleanExcerpt);
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
 * Get featured image URL from post
 */
export function getFeaturedImageUrl(post: BlogPost): string | null {
  if (!post._embedded?.['wp:featuredmedia']?.[0]) {
    return null;
  }

  const media = post._embedded['wp:featuredmedia'][0];
  return media.source_url || null;
}

/**
 * Get featured image alt text from post
 */
export function getFeaturedImageAlt(post: BlogPost): string {
  if (!post._embedded?.['wp:featuredmedia']?.[0]) {
    return '';
  }

  const media = post._embedded['wp:featuredmedia'][0];
  return media.alt_text || '';
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
  const categories = terms.find((termArray: any[]) => 
    termArray.length > 0 && termArray[0].taxonomy === 'category'
  );

  if (!categories) {
    return [];
  }

  return categories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug
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
  const tags = terms.find((termArray: any[]) => 
    termArray.length > 0 && termArray[0].taxonomy === 'post_tag'
  );

  if (!tags) {
    return [];
  }

  return tags.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug
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
    avatar: author.avatar_urls?.['96'] || author.avatar_urls?.['48'] || undefined
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