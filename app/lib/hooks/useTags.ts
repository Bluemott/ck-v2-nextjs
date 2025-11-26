'use client';

import useSWR, { SWRConfiguration } from 'swr';
import type { WPRestTag } from '../types/wordpress';

// Fetcher function for tags
const tagsFetcher = async (url: string): Promise<WPRestTag[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.status}`);
  }
  const data = await response.json();
  return data.data?.data || data.data || [];
};

// SWR config - tags change infrequently
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Tags rarely change
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute deduplication
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  keepPreviousData: true,
  refreshInterval: 0, // Don't auto-refresh
};

/**
 * Hook for fetching blog tags with SWR
 */
export function useTags(config: SWRConfiguration = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<WPRestTag[]>(
    '/api/tags',
    tagsFetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  // Filter out empty tags
  const tags = (data || []).filter((tag) => tag.count > 0);

  return {
    tags,
    allTags: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
    isEmpty: !isLoading && tags.length === 0,
  };
}

/**
 * Hook for fetching a single tag by slug
 */
export function useTagBySlug(slug: string | null, config: SWRConfiguration = {}) {
  const { allTags, isLoading, error, mutate } = useTags(config);
  
  // Search in all tags (including those with 0 count)
  const tag = slug 
    ? allTags.find((t) => t.slug === slug) || null
    : null;

  return {
    tag,
    isLoading,
    error,
    mutate,
    notFound: !isLoading && slug && !tag,
  };
}

/**
 * Hook for fetching popular tags
 * Sorted by post count (most popular first)
 */
export function usePopularTags(limit: number = 20, config: SWRConfiguration = {}) {
  const { tags, isLoading, error, mutate } = useTags(config);
  
  const popularTags = [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return {
    tags: popularTags,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook for fetching tags filtered by minimum post count
 */
export function useTagsWithMinPosts(minPosts: number = 1, config: SWRConfiguration = {}) {
  const { tags: allTags, isLoading, error, mutate } = useTags(config);
  
  const filteredTags = allTags.filter((tag) => tag.count >= minPosts);

  return {
    tags: filteredTags,
    isLoading,
    error,
    mutate,
  };
}

