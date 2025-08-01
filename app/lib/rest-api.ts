import { env } from './env';

// REST API Configuration
const API_CONFIG = {
  WORDPRESS_REST_URL: env.NEXT_PUBLIC_WPGRAPHQL_URL || 'https://api.cowboykimono.com',
  WORDPRESS_ADMIN_URL: env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com',
};

// WordPress REST API endpoints
const WP_ENDPOINTS = {
  POSTS: '/wp-json/wp/v2/posts',
  POST: '/wp-json/wp/v2/posts',
  CATEGORIES: '/wp-json/wp/v2/categories',
  TAGS: '/wp-json/wp/v2/tags',
  SEARCH: '/wp-json/wp/v2/search',
  MEDIA: '/wp-json/wp/v2/media',
};

// Types for WordPress REST API responses
export interface WPRestPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: { rendered: string };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected: boolean };
  excerpt: { rendered: string; protected: boolean };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: any[];
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url: string;
      description: string;
      link: string;
      slug: string;
      avatar_urls: Record<string, string>;
    }>;
    'wp:featuredmedia'?: Array<{
      id: number;
      date: string;
      slug: string;
      type: string;
      link: string;
      title: { rendered: string };
      author: number;
      caption: { rendered: string };
      alt_text: string;
      media_type: string;
      mime_type: string;
      source_url: string;
      _links: any;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      link: string;
      name: string;
      slug: string;
      taxonomy: string;
      _links: any;
    }>>;
  };
}

export interface WPRestCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
  _links: any;
}

export interface WPRestTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: any[];
  _links: any;
}

// REST API Client
export class RestAPIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.WORDPRESS_REST_URL;
  }

  // Helper method to make HTTP requests
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('REST API request error:', {
        error: error instanceof Error ? error.message : String(error),
        url,
        options
      });
      throw error;
    }
  }

  // Get posts with pagination and filtering
  async getPosts(params: {
    page?: number;
    per_page?: number;
    search?: string;
    categories?: number[];
    tags?: number[];
    orderby?: string;
    order?: 'asc' | 'desc';
    _embed?: boolean;
  } = {}): Promise<{
    posts: WPRestPost[];
    totalPages: number;
    totalPosts: number;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.categories?.length) searchParams.append('categories', params.categories.join(','));
    if (params.tags?.length) searchParams.append('tags', params.tags.join(','));
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);
    if (params._embed) searchParams.append('_embed', '1');

    const endpoint = `${WP_ENDPOINTS.POSTS}?${searchParams.toString()}`;
    const posts = await this.makeRequest<WPRestPost[]>(endpoint);

    // Get pagination info from headers (if available)
    const totalPages = parseInt(posts.headers?.['x-wp-totalpages'] || '1');
    const totalPosts = parseInt(posts.headers?.['x-wp-total'] || posts.length.toString());

    return {
      posts,
      totalPages,
      totalPosts
    };
  }

  // Get a single post by slug
  async getPostBySlug(slug: string): Promise<WPRestPost | null> {
    try {
      const searchParams = new URLSearchParams({
        slug,
        _embed: '1'
      });
      
      const endpoint = `${WP_ENDPOINTS.POSTS}?${searchParams.toString()}`;
      const posts = await this.makeRequest<WPRestPost[]>(endpoint);
      
      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  // Get categories
  async getCategories(params: {
    page?: number;
    per_page?: number;
    orderby?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<WPRestCategory[]> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);

    const endpoint = `${WP_ENDPOINTS.CATEGORIES}?${searchParams.toString()}`;
    return await this.makeRequest<WPRestCategory[]>(endpoint);
  }

  // Get tags
  async getTags(params: {
    page?: number;
    per_page?: number;
    orderby?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<WPRestTag[]> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);

    const endpoint = `${WP_ENDPOINTS.TAGS}?${searchParams.toString()}`;
    return await this.makeRequest<WPRestTag[]>(endpoint);
  }

  // Search posts
  async searchPosts(query: string, params: {
    page?: number;
    per_page?: number;
    subtype?: 'post' | 'page';
  } = {}): Promise<{
    posts: WPRestPost[];
    totalPages: number;
    totalPosts: number;
  }> {
    return this.getPosts({
      search: query,
      page: params.page,
      per_page: params.per_page,
      _embed: true
    });
  }

  // Get related posts based on categories and tags
  async getRelatedPosts(postId: number, limit: number = 3): Promise<WPRestPost[]> {
    try {
      // First get the current post to extract categories and tags
      const currentPost = await this.getPostBySlug(postId.toString());
      if (!currentPost) return [];

      const categories = currentPost._embedded?.['wp:term']?.[0] || [];
      const tags = currentPost._embedded?.['wp:term']?.[1] || [];

      // Get posts with similar categories or tags
      const categoryIds = categories.map(cat => cat.id);
      const tagIds = tags.map(tag => tag.id);

      const [categoryPosts, tagPosts] = await Promise.all([
        categoryIds.length > 0 ? this.getPosts({
          categories: categoryIds,
          per_page: limit * 2,
          _embed: true
        }) : Promise.resolve({ posts: [] }),
        tagIds.length > 0 ? this.getPosts({
          tags: tagIds,
          per_page: limit * 2,
          _embed: true
        }) : Promise.resolve({ posts: [] })
      ]);

      // Combine and deduplicate posts, excluding the current post
      const allPosts = [...categoryPosts.posts, ...tagPosts.posts];
      const uniquePosts = allPosts.filter(post => post.id !== postId);
      
      // Remove duplicates based on post ID
      const seen = new Set();
      const deduplicatedPosts = uniquePosts.filter(post => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      });

      return deduplicatedPosts.slice(0, limit);
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }
  }

  // Get configuration for debugging
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      endpoints: WP_ENDPOINTS,
      config: API_CONFIG
    };
  }
}

// Export singleton instance
export const restAPIClient = new RestAPIClient(); 