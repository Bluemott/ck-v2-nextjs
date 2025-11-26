'use client';

import useSWR, { SWRConfiguration } from 'swr';
import type { WPRestDownload } from '../types/wordpress';

// Types
interface DownloadsResponse {
  downloads: WPRestDownload[];
  pagination: {
    totalPosts: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface UseDownloadsOptions {
  category?: string;
  page?: number;
  perPage?: number;
  featured?: boolean;
}

// Fetcher function for downloads
const downloadsFetcher = async (url: string): Promise<DownloadsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch downloads: ${response.status}`);
  }
  const data = await response.json();
  return {
    downloads: data.data?.downloads || data.downloads || [],
    pagination: data.data?.pagination || data.pagination || {
      totalPosts: 0,
      totalPages: 1,
      currentPage: 1,
      perPage: 100,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

// Build URL with query params
function buildDownloadsUrl(options: UseDownloadsOptions = {}): string {
  const params = new URLSearchParams();
  
  if (options.category) params.append('category', options.category);
  if (options.page) params.append('page', options.page.toString());
  if (options.perPage) params.append('per_page', options.perPage.toString());
  if (options.featured) params.append('featured', 'true');

  return `/api/downloads?${params.toString()}`;
}

// SWR config with stale-while-revalidate
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 10000, // 10 seconds deduplication (downloads change less frequently)
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  keepPreviousData: true,
};

/**
 * Hook for fetching downloads with SWR
 * Provides automatic caching, deduplication, and background revalidation
 */
export function useDownloads(options: UseDownloadsOptions = {}, config: SWRConfiguration = {}) {
  const url = buildDownloadsUrl(options);
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<DownloadsResponse>(
    url,
    downloadsFetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    downloads: data?.downloads || [],
    pagination: data?.pagination || {
      totalPosts: 0,
      totalPages: 1,
      currentPage: 1,
      perPage: 100,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    isLoading,
    isValidating,
    error,
    mutate,
    isEmpty: !isLoading && data?.downloads?.length === 0,
  };
}

/**
 * Hook for fetching downloads by category
 */
export function useDownloadsByCategory(category: string | null, config: SWRConfiguration = {}) {
  const url = category ? buildDownloadsUrl({ category }) : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<DownloadsResponse>(
    url,
    downloadsFetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    downloads: data?.downloads || [],
    isLoading,
    isValidating,
    error,
    mutate,
    isEmpty: !isLoading && data?.downloads?.length === 0,
  };
}

/**
 * Hook for fetching featured downloads
 */
export function useFeaturedDownloads(limit: number = 6, config: SWRConfiguration = {}) {
  const url = `/api/downloads?featured=true&per_page=${limit}`;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<DownloadsResponse>(
    url,
    downloadsFetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    downloads: data?.downloads || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

/**
 * Hook for fetching a single download by category and slug
 */
export function useDownload(
  category: string | null,
  slug: string | null,
  config: SWRConfiguration = {}
) {
  const shouldFetch = category && slug;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<WPRestDownload | null>(
    shouldFetch ? `/api/downloads/${category}/${slug}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch download: ${response.status}`);
      }
      const data = await response.json();
      return data.data?.download || data.download || null;
    },
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    download: data,
    isLoading,
    isValidating,
    error,
    mutate,
    notFound: !isLoading && !data,
  };
}

/**
 * Hook for getting all unique download categories
 */
export function useDownloadCategories(config: SWRConfiguration = {}) {
  const { downloads, isLoading, error } = useDownloads({ perPage: 100 }, config);
  
  // Extract unique categories from downloads
  const categories = Array.from(
    new Set(
      downloads
        .map((d) => {
          const acfData = d.acf || d.meta || {};
          return acfData.download_category as string;
        })
        .filter(Boolean)
    )
  );

  return {
    categories,
    isLoading,
    error,
  };
}

// Export types
export type { DownloadsResponse, UseDownloadsOptions };

