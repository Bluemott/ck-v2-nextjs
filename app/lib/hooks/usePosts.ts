'use client';

import useSWR, { SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import type { BlogPost } from '../api';

// Types
interface PostsResponse {
  posts: BlogPost[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

interface UsePostsOptions {
  page?: number;
  perPage?: number;
  search?: string;
  categories?: number[];
  tags?: number[];
  orderby?: string;
  order?: 'asc' | 'desc';
}

// Fetcher function for posts
const postsFetcher = async (url: string): Promise<PostsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }
  const data = await response.json();
  return {
    posts: data.data?.posts || [],
    totalPosts: data.data?.totalPosts || 0,
    totalPages: data.data?.totalPages || 1,
    currentPage: data.data?.currentPage || 1,
    perPage: data.data?.perPage || 9,
  };
};

// Build URL with query params
function buildPostsUrl(options: UsePostsOptions = {}): string {
  const params = new URLSearchParams();
  
  if (options.page) params.append('page', options.page.toString());
  if (options.perPage) params.append('per_page', options.perPage.toString());
  if (options.search) params.append('search', options.search);
  if (options.categories?.length) params.append('categories', options.categories.join(','));
  if (options.tags?.length) params.append('tags', options.tags.join(','));
  if (options.orderby) params.append('orderby', options.orderby);
  if (options.order) params.append('order', options.order);

  return `/api/posts-simple?${params.toString()}`;
}

// SWR config with stale-while-revalidate
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds deduplication
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  // Keep stale data while revalidating
  keepPreviousData: true,
};

/**
 * Hook for fetching paginated posts with SWR
 * Provides automatic caching, deduplication, and background revalidation
 */
export function usePosts(options: UsePostsOptions = {}, config: SWRConfiguration = {}) {
  const url = buildPostsUrl(options);
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<PostsResponse>(
    url,
    postsFetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    posts: data?.posts || [],
    totalPosts: data?.totalPosts || 0,
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    perPage: data?.perPage || 9,
    isLoading,
    isValidating, // True when revalidating in background
    error,
    mutate, // Function to manually trigger revalidation
    // Computed states
    isEmpty: !isLoading && data?.posts?.length === 0,
    hasNextPage: (data?.currentPage || 1) < (data?.totalPages || 1),
    hasPreviousPage: (data?.currentPage || 1) > 1,
  };
}

/**
 * Hook for infinite scrolling posts
 * Automatically fetches next page when needed
 */
export function useInfinitePosts(
  options: Omit<UsePostsOptions, 'page'> = {},
  config: SWRConfiguration = {}
) {
  const getKey = (pageIndex: number, previousPageData: PostsResponse | null) => {
    // Return null to stop fetching
    if (previousPageData && previousPageData.posts.length === 0) return null;
    
    return buildPostsUrl({ ...options, page: pageIndex + 1 });
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite<PostsResponse>(
    getKey,
    postsFetcher,
    {
      ...defaultConfig,
      ...config,
      revalidateFirstPage: false,
    }
  );

  // Flatten all pages into single array
  const posts = data ? data.flatMap((page) => page.posts) : [];
  const totalPosts = data?.[0]?.totalPosts || 0;
  const totalPages = data?.[0]?.totalPages || 1;

  return {
    posts,
    totalPosts,
    totalPages,
    currentPage: size,
    isLoading,
    isValidating,
    error,
    // Load more function
    loadMore: () => setSize(size + 1),
    // Check if more pages available
    hasMore: size < totalPages,
    // Manual refresh
    mutate,
  };
}

/**
 * Hook for fetching a single post by slug
 */
export function usePost(slug: string | null, config: SWRConfiguration = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<BlogPost | null>(
    slug ? `/api/posts/${slug}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch post: ${response.status}`);
      }
      const data = await response.json();
      return data.data?.post || null;
    },
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    post: data,
    isLoading,
    isValidating,
    error,
    mutate,
    notFound: !isLoading && !data,
  };
}

/**
 * Hook for searching posts with debouncing built-in
 */
export function useSearchPosts(
  searchTerm: string,
  options: Omit<UsePostsOptions, 'search'> = {},
  config: SWRConfiguration = {}
) {
  // Only search if term is at least 2 characters
  const shouldSearch = searchTerm.trim().length >= 2;
  
  const url = shouldSearch 
    ? buildPostsUrl({ ...options, search: searchTerm.trim() })
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<PostsResponse>(
    url,
    postsFetcher,
    {
      ...defaultConfig,
      ...config,
      // Longer deduping for search to prevent excessive requests
      dedupingInterval: 1000,
    }
  );

  return {
    results: data?.posts || [],
    totalResults: data?.totalPosts || 0,
    isSearching: isLoading || isValidating,
    error,
    mutate,
    isEmpty: shouldSearch && !isLoading && data?.posts?.length === 0,
  };
}

// Export types
export type { PostsResponse, UsePostsOptions };

