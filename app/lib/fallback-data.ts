/**
 * Fallback Data for when WordPress API is unavailable
 * 
 * This module provides static fallback content that can be served
 * when the WordPress API is down or the circuit breaker is open.
 */

import type { BlogPost } from './api';
import type { WPRestCategory, WPRestTag, WPRestDownload, WPRestPagination } from './types/wordpress';

// Fallback blog posts (static content) - using BlogPost type which is simpler
const FALLBACK_BLOG_POSTS: BlogPost[] = [
  {
    id: 0,
    date: new Date().toISOString(),
    modified: new Date().toISOString(),
    slug: 'content-temporarily-unavailable',
    status: 'publish',
    title: { rendered: 'Content Temporarily Unavailable' },
    content: {
      rendered: `
        <p>We're currently experiencing technical difficulties with our blog content.</p>
        <p>Please check back shortly - our team is working to resolve this issue.</p>
        <p>In the meantime, you can:</p>
        <ul>
          <li>Visit our <a href="/shop">Shop</a> to browse our products</li>
          <li>Learn more <a href="/about">About Us</a></li>
          <li>Contact us at <a href="mailto:info@cowboykimono.com">info@cowboykimono.com</a></li>
        </ul>
      `,
    },
    excerpt: {
      rendered: 'We\'re currently experiencing technical difficulties. Please check back shortly.',
      protected: false,
    },
    author: 1,
    featured_media: 0,
    _embedded: undefined,
  },
];

// Fallback categories - partial type for fallback
const FALLBACK_CATEGORY_DATA: Partial<WPRestCategory>[] = [
  {
    id: 1,
    count: 0,
    description: 'General blog posts',
    link: '/blog/category/uncategorized',
    name: 'Blog',
    slug: 'blog',
    taxonomy: 'category',
    parent: 0,
  },
];

// Fallback tags
const FALLBACK_TAG_DATA: WPRestTag[] = [];

// Fallback downloads - partial type for fallback
const FALLBACK_DOWNLOAD_DATA: Partial<WPRestDownload>[] = [
  {
    id: 0,
    date: new Date().toISOString(),
    modified: new Date().toISOString(),
    slug: 'downloads-unavailable',
    status: 'publish',
    title: { rendered: 'Downloads Temporarily Unavailable' },
    content: { rendered: '<p>Our downloads are temporarily unavailable. Please check back soon.</p>', protected: false },
    excerpt: { rendered: 'Downloads temporarily unavailable.', protected: false },
    author: 1,
    featured_media: 0,
    acf: {
      download_category: 'general',
      download_description: 'Our downloads are temporarily unavailable. Please check back soon.',
    },
  },
];

// Export as const for external use
export const FALLBACK_POSTS = FALLBACK_BLOG_POSTS;
export const FALLBACK_CATEGORIES = FALLBACK_CATEGORY_DATA as WPRestCategory[];
export const FALLBACK_TAGS = FALLBACK_TAG_DATA;
export const FALLBACK_DOWNLOADS = FALLBACK_DOWNLOAD_DATA as WPRestDownload[];

// Fallback pagination
export const FALLBACK_PAGINATION: WPRestPagination = {
  totalPosts: 0,
  totalPages: 1,
  currentPage: 1,
  perPage: 10,
  hasNextPage: false,
  hasPreviousPage: false,
};

/**
 * Get fallback posts response
 * Returns empty array to trigger graceful degradation in UI
 */
export function getFallbackPosts(): {
  posts: never[];
  pagination: WPRestPagination;
} {
  // Return empty posts - the UI will show "no posts found" message
  // This is safer than returning fake data that might confuse users
  return {
    posts: [],
    pagination: { ...FALLBACK_PAGINATION },
  };
}

/**
 * Get fallback post by slug
 */
export function getFallbackPost(_slug: string): BlogPost {
  return FALLBACK_POSTS[0]!;
}

/**
 * Get fallback categories
 */
export function getFallbackCategories(): WPRestCategory[] {
  return FALLBACK_CATEGORIES;
}

/**
 * Get fallback tags
 */
export function getFallbackTags(): WPRestTag[] {
  return FALLBACK_TAGS;
}

/**
 * Get fallback downloads
 * Returns empty array to trigger graceful degradation in UI
 */
export function getFallbackDownloads(): {
  downloads: never[];
  pagination: WPRestPagination;
} {
  return {
    downloads: [],
    pagination: { ...FALLBACK_PAGINATION },
  };
}

/**
 * Check if data is fallback data
 */
export function isFallbackData(data: unknown): boolean {
  if (Array.isArray(data)) {
    return data.some((item) => item?.id === 0);
  }
  if (typeof data === 'object' && data !== null) {
    return (data as { id?: number }).id === 0;
  }
  return false;
}

/**
 * Create a maintenance message component data
 */
export function getMaintenanceMessage(): {
  title: string;
  message: string;
  suggestions: string[];
} {
  return {
    title: 'Content Temporarily Unavailable',
    message: 'We\'re experiencing technical difficulties with our content server. Our team has been notified and is working to resolve this issue.',
    suggestions: [
      'Try refreshing the page in a few minutes',
      'Visit our Shop to browse products',
      'Contact us at info@cowboykimono.com for assistance',
    ],
  };
}

/**
 * Get cached data from localStorage (client-side fallback)
 */
export function getCachedDataFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`ck_cache_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`ck_cache_${key}`);
      return null;
    }
    
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Save data to localStorage for offline fallback
 */
export function saveCacheToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`ck_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Clear all cached fallback data
 */
export function clearCachedStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('ck_cache_'));
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}

