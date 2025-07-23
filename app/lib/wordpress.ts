// WordPress Headless CMS Integration
// Clean implementation for Cowboy Kimono v2

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: Record<string, unknown>[];
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: WordPressMedia[];
    author?: WordPressAuthor[];
  };
}

export interface WordPressMedia {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    filesize?: number;
    sizes: {
      thumbnail?: {
        file: string;
        width: number;
        height: number;
        filesize?: number;
        mime_type?: string;
        source_url: string;
      };
      medium?: {
        file: string;
        width: number;
        height: number;
        filesize?: number;
        mime_type?: string;
        source_url: string;
      };
      large?: {
        file: string;
        width: number;
        height: number;
        filesize?: number;
        mime_type?: string;
        source_url: string;
      };
      medium_large?: {
        file: string;
        width: number;
        height: number;
        filesize?: number;
        mime_type?: string;
        source_url: string;
      };
      full?: {
        file: string;
        width: number;
        height: number;
        mime_type?: string;
        source_url: string;
      };
    };
    image_meta?: {
      aperture: string;
      credit: string;
      camera: string;
      caption: string;
      created_timestamp: string;
      copyright: string;
      focal_length: string;
      iso: string;
      shutter_speed: string;
      title: string;
      orientation: string;
      keywords: string[];
    };
  };
  source_url: string;
}

export interface WordPressAuthor {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: {
    '24': string;
    '48': string;
    '96': string;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: Record<string, unknown>[];
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: Record<string, unknown>[];
}

export interface WordPressError {
  code: string;
  message: string;
  status?: number;
  data: {
    status: number;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.cowboykimono.com/wp-json/wp/v2';
const WORDPRESS_ADMIN_URL = process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decode HTML entities in WordPress content
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof document === 'undefined') {
    // Server-side fallback
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Get WordPress admin URL
 */
export function getWordPressAdminUrl(): string {
  return WORDPRESS_ADMIN_URL;
}

/**
 * Get media URL for a WordPress post
 * Updated to handle WordPress media structure properly
 */
export function getMediaUrl(mediaId: number): string | null {
  if (!mediaId || mediaId === 0) {
    return '/images/placeholder.svg'; // Fallback image
  }
  
  // WordPress media URLs follow this pattern:
  // https://api.cowboykimono.com/wp-content/uploads/YYYY/MM/filename.jpg
  // Since we can't construct the exact path without the media data,
  // we'll return null and let the calling function handle the fallback
  return null;
}

/**
 * Get featured image URL from WordPress post
 * This function properly extracts the featured image URL from the _embedded data
 */
export function getFeaturedImageUrl(post: WordPressPost, size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'): string | null {
  if (!post.featured_media || post.featured_media === 0) {
    return null;
  }

  // Check if we have embedded media data
  if (post._embedded?.['wp:featuredmedia']?.[0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    
    // Check if the media object is an error response
    const mediaError = media as unknown as WordPressError;
    if (mediaError.code === 'rest_forbidden' || mediaError.status === 401) {
      return null;
    }
    
    // Return the appropriate size URL
    if (media.media_details?.sizes?.[size]?.source_url) {
      return media.media_details.sizes[size].source_url;
    }
    
    // Try other sizes if the requested size is not available
    const availableSizes: Array<'thumbnail' | 'medium' | 'large' | 'full'> = ['medium', 'large', 'thumbnail', 'full'];
    for (const availableSize of availableSizes) {
      if (availableSize !== size && media.media_details?.sizes?.[availableSize]?.source_url) {
        return media.media_details.sizes[availableSize]!.source_url;
      }
    }
    
    // Fallback to full size
    if (media.source_url) {
      return media.source_url;
    }
  }

  // If no embedded data or no valid URL, return null
  // This will trigger the fallback image in the component
  return null;
}

/**
 * Get featured image alt text from WordPress post
 */
export function getFeaturedImageAlt(post: WordPressPost): string {
  if (!post.featured_media || post.featured_media === 0) {
    return 'Blog post image';
  }

  // Check if we have embedded media data
  if (post._embedded?.['wp:featuredmedia']?.[0]) {
    const media = post._embedded['wp:featuredmedia'][0];
    return media.alt_text || decodeHtmlEntities(post.title.rendered);
  }

  return decodeHtmlEntities(post.title.rendered);
}

/**
 * Check if an image URL is valid and accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || url === '/images/placeholder.svg') {
    return false;
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image validation failed for:', url, error);
    return false;
  }
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch posts from WordPress API
 */
export async function fetchPosts(params?: {
  per_page?: number;
  page?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  _embed?: boolean;
}): Promise<WordPressPost[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?._embed) searchParams.append('_embed', '1');
    
    if (params?.categories?.length) {
      params.categories.forEach(catId => {
        searchParams.append('categories', catId.toString());
      });
    }
    
    if (params?.tags?.length) {
      params.tags.forEach(tagId => {
        searchParams.append('tags', tagId.toString());
      });
    }

    const response = await fetch(`${WORDPRESS_API_URL}/posts?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();
    return posts;
  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    throw error;
  }
}

/**
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug: string): Promise<WordPressPost | null> {
  try {
    const searchParams = new URLSearchParams({
      slug: slug,
      _embed: '1'
    });

    const response = await fetch(`${WORDPRESS_API_URL}/posts?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Error fetching WordPress post by slug:', error);
    throw error;
  }
}

/**
 * Fetch categories from WordPress API
 */
export async function fetchCategories(): Promise<WordPressCategory[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL.replace('/posts', '')}/categories`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const categories: WordPressCategory[] = await response.json();
    return categories;
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    throw error;
  }
}

/**
 * Fetch tags from WordPress API
 */
export async function fetchTags(): Promise<WordPressTag[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL.replace('/posts', '')}/tags`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const tags: WordPressTag[] = await response.json();
    return tags;
  } catch (error) {
    console.error('Error fetching WordPress tags:', error);
    throw error;
  }
}

/**
 * Fetch media by ID
 */
export async function fetchMedia(mediaId: number): Promise<WordPressMedia | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL.replace('/posts', '')}/media/${mediaId}`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const media: WordPressMedia = await response.json();
    return media;
  } catch (error) {
    console.error('Error fetching WordPress media:', error);
    throw error;
  }
}

/**
 * Fetch author by ID
 */
export async function fetchAuthor(authorId: number): Promise<WordPressAuthor | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL.replace('/posts', '')}/users/${authorId}`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const author: WordPressAuthor = await response.json();
    return author;
  } catch (error) {
    console.error('Error fetching WordPress author:', error);
    throw error;
  }
} 

/**
 * Fetch related posts based on categories and tags
 */
export async function fetchRelatedPosts(
  currentPostId: number,
  categories: number[],
  tags: number[],
  limit: number = 3
): Promise<WordPressPost[]> {
  try {
    // Create a set of all related IDs (categories + tags)
    const relatedIds = [...categories, ...tags];
    
    if (relatedIds.length === 0) {
      return [];
    }

    // Fetch posts that share categories or tags with the current post
    const searchParams = new URLSearchParams({
      per_page: limit.toString(),
      _embed: '1',
      exclude: currentPostId.toString(),
    });

    // Add categories
    categories.forEach(catId => {
      searchParams.append('categories', catId.toString());
    });

    // Add tags
    tags.forEach(tagId => {
      searchParams.append('tags', tagId.toString());
    });

    const response = await fetch(`${WORDPRESS_API_URL}/posts?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();
    
    // If we don't have enough related posts, fetch some recent posts as fallback
    if (posts.length < limit) {
      const remainingCount = limit - posts.length;
      const fallbackParams = new URLSearchParams({
        per_page: remainingCount.toString(),
        _embed: '1',
        exclude: [currentPostId, ...posts.map(p => p.id)].join(','),
      });

      const fallbackResponse = await fetch(`${WORDPRESS_API_URL}/posts?${fallbackParams.toString()}`);
      
      if (fallbackResponse.ok) {
        const fallbackPosts: WordPressPost[] = await fallbackResponse.json();
        posts.push(...fallbackPosts);
      }
    }

    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

/**
 * Fetch posts with total count for pagination
 */
export async function fetchPostsWithCount(params?: {
  per_page?: number;
  page?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  _embed?: boolean;
}): Promise<{ posts: WordPressPost[]; totalPosts: number; totalPages: number }> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?._embed) searchParams.append('_embed', '1');
    
    if (params?.categories?.length) {
      params.categories.forEach(catId => {
        searchParams.append('categories', catId.toString());
      });
    }
    
    if (params?.tags?.length) {
      params.tags.forEach(tagId => {
        searchParams.append('tags', tagId.toString());
      });
    }

    const response = await fetch(`${WORDPRESS_API_URL}/posts?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();
    
    // Get total count from headers
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0');
    
    return {
      posts,
      totalPosts,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching WordPress posts with count:', error);
    throw error;
  }
} 

/**
 * Fetch a single category by ID
 */
export async function fetchCategoryById(id: number): Promise<WordPressCategory | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/categories/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    return null;
  }
}

/**
 * Fetch a single tag by ID
 */
export async function fetchTagById(id: number): Promise<WordPressTag | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/tags/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tag by ID:', error);
    return null;
  }
}

/**
 * Fetch multiple categories by IDs
 */
export async function fetchCategoriesByIds(ids: number[]): Promise<WordPressCategory[]> {
  if (!ids.length) return [];
  
  try {
    const promises = ids.map(id => fetchCategoryById(id));
    const results = await Promise.all(promises);
    return results.filter((category): category is WordPressCategory => category !== null);
  } catch (error) {
    console.error('Error fetching categories by IDs:', error);
    return [];
  }
}

/**
 * Fetch multiple tags by IDs
 */
export async function fetchTagsByIds(ids: number[]): Promise<WordPressTag[]> {
  if (!ids.length) return [];
  
  try {
    const promises = ids.map(id => fetchTagById(id));
    const results = await Promise.all(promises);
    return results.filter((tag): tag is WordPressTag => tag !== null);
  } catch (error) {
    console.error('Error fetching tags by IDs:', error);
    return [];
  }
} 