import { env } from './env';
import type {
  WPRestCategory,
  WPRestDownload,
  WPRestErrorResponse,
  WPRestPagination,
  WPRestPost,
  WPRestQueryParams,
  WPRestSearchResponse,
  WPRestSearchResult,
  WPRestTag,
} from './types/wordpress';

// Build-time detection for conditional logging
const IS_BUILD = process.env.CI === 'true';

// REST API Configuration
const API_CONFIG = {
  WORDPRESS_REST_URL:
    env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com',
  WORDPRESS_ADMIN_URL:
    env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com',
};

// WordPress REST API endpoints
const WP_ENDPOINTS = {
  POSTS: '/wp-json/wp/v2/posts',
  POST: '/wp-json/wp/v2/posts',
  CATEGORIES: '/wp-json/wp/v2/categories',
  TAGS: '/wp-json/wp/v2/tags',
  SEARCH: '/wp-json/wp/v2/search',
  MEDIA: '/wp-json/wp/v2/media',
  DOWNLOADS: '/wp-json/wp/v2/downloads', // Add this endpoint
};

// REST API Client with proper type definitions
export class RestAPIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.WORDPRESS_REST_URL;
  }

  // Helper method to make HTTP requests with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.makeRequestWithRetry<T>(endpoint, options, 3);
  }

  // Enhanced method with retry logic and better error handling
  private async makeRequestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Attempt ${attempt}/${maxRetries} for ${endpoint}`
          );
        }

        // Increase timeout for downloads endpoint
        const timeout = endpoint.includes('/downloads') ? 30000 : 10000; // 30s for downloads, 10s for others

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: WPRestErrorResponse = {
            code: errorData.code || 'HTTP_ERROR',
            message: errorData.message || response.statusText,
            data: {
              status: response.status,
              params: errorData.data?.params,
              details: errorData.data?.details,
            },
          };

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`HTTP ${response.status}: ${error.message}`);
          }

          // Retry on server errors (5xx) or network issues
          throw new Error(`HTTP ${response.status}: ${error.message}`);
        }

        const data = await response.json();
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Success on attempt ${attempt} for ${endpoint}`
          );
        }
        return data as T;
      } catch (error) {
        lastError = error as Error;
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Attempt ${attempt} failed for ${endpoint}:`,
            {
              error: lastError.message,
              url,
            }
          );
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          if (!IS_BUILD) {
            console.warn(`[REST API] Retrying in ${delay}ms...`);
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error('REST API request failed after all retries:', {
      error: lastError?.message,
      url,
      attempts: maxRetries,
    });
    throw lastError;
  }

  // New method to make requests and return both data and headers with retry logic
  private async makeRequestWithHeaders<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{
    data: T;
    headers: Headers;
    status: number;
    statusText: string;
  }> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Headers attempt ${attempt}/${maxRetries} for ${endpoint}`
          );
        }

        // Increase timeout for downloads endpoint
        const timeout = endpoint.includes('/downloads') ? 30000 : 10000;

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: WPRestErrorResponse = {
            code: errorData.code || 'HTTP_ERROR',
            message: errorData.message || response.statusText,
            data: {
              status: response.status,
              params: errorData.data?.params,
              details: errorData.data?.details,
            },
          };

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`HTTP ${response.status}: ${error.message}`);
          }

          throw new Error(`HTTP ${response.status}: ${error.message}`);
        }

        const data = await response.json();
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Headers success on attempt ${attempt} for ${endpoint}`
          );
        }

        return {
          data: data as T,
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        lastError = error as Error;
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Headers attempt ${attempt} failed for ${endpoint}:`,
            {
              error: lastError.message,
              url,
            }
          );
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          if (!IS_BUILD) {
            console.warn(`[REST API] Headers retrying in ${delay}ms...`);
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error('REST API headers request failed after all retries:', {
      error: lastError?.message,
      url,
      attempts: maxRetries,
    });
    throw lastError;
  }

  // Get posts with pagination and filtering with proper typing
  async getPosts(params: WPRestQueryParams = {}): Promise<{
    posts: WPRestPost[];
    pagination: WPRestPagination;
  }> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page)
      searchParams.append('per_page', params.per_page.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.categories)
      searchParams.append('categories', params.categories.join(','));
    if (params.tags) searchParams.append('tags', params.tags.join(','));
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);
    if (params._embed) searchParams.append('_embed', '1');

    const endpoint = `${WP_ENDPOINTS.POSTS}?${searchParams.toString()}`;

    try {
      const { data: posts, headers } =
        await this.makeRequestWithHeaders<WPRestPost[]>(endpoint);

      // Extract pagination information from WordPress REST API headers
      const totalPosts = parseInt(headers.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(headers.get('X-WP-TotalPages') || '1', 10);
      const currentPage = parseInt(headers.get('X-WP-CurrentPage') || '1', 10);
      const perPage = parseInt(headers.get('X-WP-PerPage') || '10', 10);

      if (!IS_BUILD) {
        console.warn('Pagination info from headers:', {
          totalPosts,
          totalPages,
          currentPage,
          perPage,
          'X-WP-Total': headers.get('X-WP-Total'),
          'X-WP-TotalPages': headers.get('X-WP-TotalPages'),
          'X-WP-Query': headers.get('X-WP-Query'),
        });
      }

      const pagination: WPRestPagination = {
        totalPosts: totalPosts || posts.length,
        totalPages: totalPages || 1,
        currentPage: currentPage || 1,
        perPage: perPage || posts.length,
        hasNextPage: (currentPage || 1) < (totalPages || 1),
        hasPreviousPage: (currentPage || 1) > 1,
      };

      return {
        posts,
        pagination,
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        posts: [],
        pagination: {
          totalPosts: 0,
          totalPages: 1,
          currentPage: 1,
          perPage: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  }

  // Get a single post by slug with proper typing
  async getPostBySlug(slug: string): Promise<WPRestPost | null> {
    try {
      const searchParams = new URLSearchParams({
        slug,
        _embed: '1',
      });

      const endpoint = `${WP_ENDPOINTS.POSTS}?${searchParams.toString()}`;
      const posts = await this.makeRequest<WPRestPost[]>(endpoint);

      return posts.length > 0 ? posts[0] || null : null;
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  // Get a single post by ID with proper typing
  async getPostById(id: number): Promise<WPRestPost | null> {
    try {
      const endpoint = `${WP_ENDPOINTS.POSTS}/${id}?_embed=1`;
      return await this.makeRequest<WPRestPost>(endpoint);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
  }

  // Get categories with proper typing
  async getCategories(
    params: {
      page?: number;
      per_page?: number;
      orderby?: string;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<WPRestCategory[]> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page)
      searchParams.append('per_page', params.per_page.toString());
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);

    const endpoint = `${WP_ENDPOINTS.CATEGORIES}?${searchParams.toString()}`;
    return await this.makeRequest<WPRestCategory[]>(endpoint);
  }

  // Get tags with proper typing
  async getTags(
    params: {
      page?: number;
      per_page?: number;
      orderby?: string;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<WPRestTag[]> {
    const searchParams = new URLSearchParams();

    // Default to 100 tags to ensure all tags are fetched
    searchParams.append('per_page', (params.per_page || 100).toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);

    const endpoint = `${WP_ENDPOINTS.TAGS}?${searchParams.toString()}`;
    return await this.makeRequest<WPRestTag[]>(endpoint);
  }

  // Search posts with proper typing
  async searchPosts(
    query: string,
    params: {
      page?: number;
      per_page?: number;
      subtype?: 'post' | 'page';
    } = {}
  ): Promise<WPRestSearchResponse> {
    const searchParams = new URLSearchParams({
      search: query,
      ...(params.page && { page: params.page.toString() }),
      ...(params.per_page && { per_page: params.per_page.toString() }),
      ...(params.subtype && { subtype: params.subtype }),
    });

    const endpoint = `${WP_ENDPOINTS.SEARCH}?${searchParams.toString()}`;

    try {
      const results = await this.makeRequest<WPRestSearchResult[]>(endpoint);

      return {
        results,
        total: results.length,
        totalPages: 1, // WordPress search doesn't provide pagination info
      };
    } catch (error) {
      console.error('Error searching posts:', error);
      return {
        results: [],
        total: 0,
        totalPages: 1,
      };
    }
  }

  // Get related posts based on categories and tags with proper typing
  async getRelatedPosts(
    postId: number,
    limit: number = 3
  ): Promise<WPRestPost[]> {
    try {
      // First get the current post to extract categories and tags
      // We need to get the post by ID, not slug
      const currentPost = await this.getPostById(postId);
      if (!currentPost) return [];

      const categories = currentPost._embedded?.['wp:term']?.[0] || [];
      const tags = currentPost._embedded?.['wp:term']?.[1] || [];

      // Get posts with similar categories or tags
      const categoryIds = categories.map((cat) => cat.id);
      const tagIds = tags.map((tag) => tag.id);

      const [categoryPosts, tagPosts] = await Promise.all([
        categoryIds.length > 0
          ? this.getPosts({
              categories: categoryIds,
              per_page: limit * 2,
              _embed: true,
            })
          : Promise.resolve({
              posts: [],
              pagination: {
                totalPosts: 0,
                totalPages: 1,
                currentPage: 1,
                perPage: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            }),
        tagIds.length > 0
          ? this.getPosts({
              tags: tagIds,
              per_page: limit * 2,
              _embed: true,
            })
          : Promise.resolve({
              posts: [],
              pagination: {
                totalPosts: 0,
                totalPages: 1,
                currentPage: 1,
                perPage: 0,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            }),
      ]);

      // Combine and deduplicate posts, excluding the current post
      const allPosts = [...categoryPosts.posts, ...tagPosts.posts];
      const uniquePosts = allPosts.filter((post) => post.id !== postId);

      // Remove duplicates based on post ID
      const seen = new Set();
      const deduplicatedPosts = uniquePosts.filter((post) => {
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

  // Get downloads with pagination and filtering
  async getDownloads(
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      orderby?: string;
      order?: 'asc' | 'desc';
      _embed?: boolean;
      status?: 'publish' | 'draft' | 'private' | 'trash';
      meta_key?: string;
      meta_value?: string;
    } = {}
  ): Promise<{
    downloads: WPRestDownload[];
    pagination: WPRestPagination;
  }> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.per_page)
      searchParams.append('per_page', params.per_page.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.orderby) searchParams.append('orderby', params.orderby);
    if (params.order) searchParams.append('order', params.order);
    if (params._embed) searchParams.append('_embed', '1');
    if (params.status) searchParams.append('status', params.status);
    if (params.meta_key) searchParams.append('meta_key', params.meta_key);
    if (params.meta_value) searchParams.append('meta_value', params.meta_value);

    const endpoint = `${WP_ENDPOINTS.DOWNLOADS}?${searchParams.toString()}`;

    try {
      const { data: downloads, headers } =
        await this.makeRequestWithHeaders<WPRestDownload[]>(endpoint);

      // Extract pagination information from WordPress REST API headers
      const totalDownloads = parseInt(headers.get('X-WP-Total') || '0', 10);
      const totalPages = parseInt(headers.get('X-WP-TotalPages') || '1', 10);
      const currentPage = parseInt(headers.get('X-WP-CurrentPage') || '1', 10);
      const perPage = parseInt(headers.get('X-WP-PerPage') || '10', 10);

      const pagination: WPRestPagination = {
        totalPosts: totalDownloads || downloads.length,
        totalPages: totalPages || 1,
        currentPage: currentPage || 1,
        perPage: perPage || downloads.length,
        hasNextPage: (currentPage || 1) < (totalPages || 1),
        hasPreviousPage: (currentPage || 1) > 1,
      };

      return {
        downloads,
        pagination,
      };
    } catch (error) {
      console.error('Error fetching downloads:', error);
      return {
        downloads: [],
        pagination: {
          totalPosts: 0,
          totalPages: 1,
          currentPage: 1,
          perPage: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  }

  // Get downloads by category - optimized version
  async getDownloadsByCategory(category: string): Promise<WPRestDownload[]> {
    try {
      if (!IS_BUILD) {
        console.warn(`[REST API] Fetching downloads for category: ${category}`);
      }

      // Try to use WordPress meta query if supported, otherwise fall back to client-side filtering
      try {
        // Attempt to use meta query for better performance
        const searchParams = new URLSearchParams({
          per_page: '100',
          _embed: '1',
          status: 'publish',
          meta_key: 'download_category',
          meta_value: category,
        });

        const endpoint = `${WP_ENDPOINTS.DOWNLOADS}?${searchParams.toString()}`;
        if (!IS_BUILD) {
          console.warn(`[REST API] Trying meta query for category ${category}`);
        }

        const downloads = await this.makeRequest<WPRestDownload[]>(endpoint);

        if (downloads && downloads.length > 0) {
          if (!IS_BUILD) {
            console.warn(
              `[REST API] Meta query successful: found ${downloads.length} downloads`
            );
          }
          return downloads;
        }
      } catch (metaError) {
        if (!IS_BUILD) {
          console.warn(
            `[REST API] Meta query failed for category ${category}, falling back to client-side filtering:`,
            metaError
          );
        }
      }

      // Fallback: fetch all downloads and filter client-side
      if (!IS_BUILD) {
        console.warn(
          `[REST API] Using client-side filtering for category ${category}`
        );
      }
      const { downloads } = await this.getDownloads({
        per_page: 100,
        _embed: true,
      });

      // Filter by category client-side
      const filteredDownloads = downloads.filter((download) => {
        const acfData = download.acf || download.meta || {};
        return acfData.download_category === category;
      });

      if (!IS_BUILD) {
        console.warn(
          `[REST API] Client-side filtering found ${filteredDownloads.length} downloads for category ${category}`
        );
      }
      return filteredDownloads;
    } catch (error) {
      console.error(
        `[REST API] Error fetching downloads by category ${category}:`,
        error
      );
      return [];
    }
  }

  // Get single download by category and slug
  async getDownloadBySlug(
    category: string,
    slug: string
  ): Promise<WPRestDownload | null> {
    try {
      if (!IS_BUILD) {
        console.warn(`[REST API] Fetching download: ${category}/${slug}`);
      }

      // First try to get downloads by category
      const downloads = await this.getDownloadsByCategory(category);
      console.warn(
        `[REST API] Found ${downloads.length} downloads in category ${category}`
      );

      // Debug: log all download slugs for debugging
      downloads.forEach((d, index) => {
        const acfData = d.acf || d.meta || {};
        console.warn(
          `[REST API] Download ${index + 1}: id=${d.id}, title="${d.title.rendered}", post_slug="${d.slug}", download_slug="${acfData.download_slug}"`
        );
      });

      // Find the download with matching slug
      const download = downloads.find((d) => {
        const acfData = d.acf || d.meta || {};
        const downloadSlug = acfData.download_slug;
        const postSlug = d.slug;

        console.warn(
          `[REST API] Checking download ${d.id}: download_slug="${downloadSlug}", post_slug="${postSlug}", looking for="${slug}"`
        );

        // Try both download_slug and post slug
        return downloadSlug === slug || postSlug === slug;
      });

      if (download) {
        if (!IS_BUILD) {
          console.warn(`[REST API] Found download: ${download.title.rendered}`);
        }
        return download;
      }

      if (!IS_BUILD) {
        console.warn(`[REST API] Download not found: ${category}/${slug}`);
        console.warn(
          `[REST API] Available downloads in category:`,
          downloads.map((d) => ({
            id: d.id,
            title: d.title.rendered,
            slug: (d.acf || d.meta || {}).download_slug,
          }))
        );
      }
      return null;
    } catch (error) {
      console.error(`Error fetching download ${category}/${slug}:`, error);
      return null;
    }
  }

  // Get featured downloads
  async getFeaturedDownloads(limit: number = 6): Promise<WPRestDownload[]> {
    try {
      if (!IS_BUILD) {
        console.warn(
          `[REST API] Fetching featured downloads (limit: ${limit})`
        );
      }

      // Get all downloads and filter for featured ones
      const { downloads } = await this.getDownloads({
        per_page: 100,
        _embed: true,
        status: 'publish',
      });

      const featuredDownloads = downloads
        .filter((download) => {
          const acfData = download.acf || download.meta || {};
          return acfData.download_featured === true;
        })
        .sort((a, b) => {
          const aOrder = (a.acf || a.meta || {}).download_order || 0;
          const bOrder = (b.acf || b.meta || {}).download_order || 0;
          return aOrder - bOrder;
        })
        .slice(0, limit);

      if (!IS_BUILD) {
        console.warn(
          `[REST API] Found ${featuredDownloads.length} featured downloads`
        );
      }

      return featuredDownloads;
    } catch (error) {
      console.error('Error fetching featured downloads:', error);
      return [];
    }
  }

  // Get popular downloads based on download count
  async getPopularDownloads(limit: number = 10): Promise<WPRestDownload[]> {
    try {
      if (!IS_BUILD) {
        console.warn(`[REST API] Fetching popular downloads (limit: ${limit})`);
      }

      // Get all downloads
      const { downloads } = await this.getDownloads({
        per_page: 100,
        _embed: true,
        status: 'publish',
      });

      // Sort by download count (mock data for now - in real implementation,
      // this would be based on actual analytics data)
      const popularDownloads = downloads
        .sort((a, b) => {
          // Mock popularity based on post ID for consistency
          const aPopularity = (a.id % 100) + Math.random() * 50;
          const bPopularity = (b.id % 100) + Math.random() * 50;
          return bPopularity - aPopularity;
        })
        .slice(0, limit);

      if (!IS_BUILD) {
        console.warn(
          `[REST API] Found ${popularDownloads.length} popular downloads`
        );
      }

      return popularDownloads;
    } catch (error) {
      console.error('Error fetching popular downloads:', error);
      return [];
    }
  }

  // Get related downloads based on category and tags
  async getRelatedDownloads(
    downloadId: string,
    limit: number = 4
  ): Promise<WPRestDownload[]> {
    try {
      if (!IS_BUILD) {
        console.warn(`[REST API] Fetching related downloads for ${downloadId}`);
      }

      // First get the current download to extract category
      const currentDownload = await this.getDownloadById(
        parseInt(downloadId.replace('download-', ''), 10)
      );
      if (!currentDownload) return [];

      const acfData = currentDownload.acf || currentDownload.meta || {};
      const category = acfData.download_category;

      if (!category) return [];

      // Get downloads from the same category, excluding the current one
      const categoryDownloads = await this.getDownloadsByCategory(category);
      const relatedDownloads = categoryDownloads
        .filter(
          (download) =>
            download.id !== parseInt(downloadId.replace('download-', ''), 10)
        )
        .slice(0, limit);

      if (!IS_BUILD) {
        console.warn(
          `[REST API] Found ${relatedDownloads.length} related downloads`
        );
      }

      return relatedDownloads;
    } catch (error) {
      console.error(
        `Error fetching related downloads for ${downloadId}:`,
        error
      );
      return [];
    }
  }

  // Get download by ID
  async getDownloadById(id: number): Promise<WPRestDownload | null> {
    try {
      if (!IS_BUILD) {
        console.warn(`[REST API] Fetching download by ID: ${id}`);
      }

      const endpoint = `${WP_ENDPOINTS.DOWNLOADS}/${id}?_embed=1`;
      const download = await this.makeRequest<WPRestDownload>(endpoint);

      if (!IS_BUILD) {
        console.warn(`[REST API] Found download: ${download.title.rendered}`);
      }

      return download;
    } catch (error) {
      console.error(`Error fetching download by ID ${id}:`, error);
      return null;
    }
  }

  // Get media by ID to resolve ACF file fields
  async getMediaById(id: number): Promise<{ url: string; title: string } | null> {
    try {
      if (!IS_BUILD) {
        console.warn(`[REST API] Fetching media by ID: ${id}`);
      }

      const endpoint = `${WP_ENDPOINTS.MEDIA}/${id}`;
      const media = await this.makeRequest<{
        id: number;
        source_url: string;
        title: { rendered: string };
      }>(endpoint);

      return {
        url: media.source_url,
        title: media.title.rendered,
      };
    } catch (error) {
      console.error(`Error fetching media by ID ${id}:`, error);
      return null;
    }
  }

  // Get configuration for debugging
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      endpoints: WP_ENDPOINTS,
      config: API_CONFIG,
    };
  }
}

// Export singleton instance
export const restAPIClient = new RestAPIClient();

// Export types for backward compatibility
export type {
  WPRestCategory,
  WPRestDownload,
  WPRestErrorResponse,
  WPRestPagination,
  WPRestPost,
  WPRestQueryParams,
  WPRestSearchResponse,
  WPRestSearchResult,
  WPRestTag,
} from './types/wordpress';
