'use client';

import useSWR, { SWRConfiguration } from 'swr';
import type { WPRestCategory } from '../types/wordpress';

// Fetcher function for categories
const categoriesFetcher = async (url: string): Promise<WPRestCategory[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }
  const data = await response.json();
  return data.data?.data || data.data || [];
};

// SWR config - categories change infrequently
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Categories rarely change
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute deduplication
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  keepPreviousData: true,
  // Cache for longer since categories are stable
  refreshInterval: 0, // Don't auto-refresh
};

/**
 * Hook for fetching blog categories with SWR
 */
export function useCategories(config: SWRConfiguration = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<WPRestCategory[]>(
    '/api/categories',
    categoriesFetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  // Filter out uncategorized and empty categories
  const categories = (data || []).filter(
    (cat) => cat.slug !== 'uncategorized' && cat.count > 0
  );

  return {
    categories,
    allCategories: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
    isEmpty: !isLoading && categories.length === 0,
  };
}

/**
 * Hook for fetching a single category by slug
 */
export function useCategoryBySlug(slug: string | null, config: SWRConfiguration = {}) {
  const { categories, isLoading, error, mutate } = useCategories(config);
  
  const category = slug 
    ? categories.find((cat) => cat.slug === slug) || null
    : null;

  return {
    category,
    isLoading,
    error,
    mutate,
    notFound: !isLoading && slug && !category,
  };
}

/**
 * Hook for fetching categories with post counts
 * Sorted by post count (most popular first)
 */
export function usePopularCategories(limit: number = 10, config: SWRConfiguration = {}) {
  const { categories, isLoading, error, mutate } = useCategories(config);
  
  const popularCategories = [...categories]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return {
    categories: popularCategories,
    isLoading,
    error,
    mutate,
  };
}

