// WordPress REST API Type Definitions
// This file contains comprehensive type definitions for WordPress REST API responses

import { z } from 'zod';

// WordPress REST API Post Types
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
  meta: unknown[];
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
      _links: Record<string, unknown>;
    }>;
    'wp:term'?: Array<
      Array<{
        id: number;
        link: string;
        name: string;
        slug: string;
        taxonomy: string;
        _links: Record<string, unknown>;
      }>
    >;
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
  meta: unknown[];
  _links: Record<string, unknown>;
}

export interface WPRestTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: unknown[];
  _links: Record<string, unknown>;
}

export interface WPRestAuthor {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: Record<string, string>;
}

export interface WPRestMedia {
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
  author: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: unknown[];
  description: { rendered: string; protected: boolean };
  caption: { rendered: string; protected: boolean };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<
      string,
      {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      }
    >;
    image_meta: {
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
  post: number;
  source_url: string;
  _links: Record<string, unknown>;
}

// WordPress Download Custom Post Type (ACF Fields)
export interface WPRestDownload {
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
  meta: {
    download_file?: string | number;
    download_category?: string;
    download_thumbnail?: string | number;
    download_type?: string;
    download_url?: string;
    download_description?: string;
    // Enhanced fields for improved functionality
    download_slug?: string;
    download_file_size?: string;
    download_format?: string;
    download_difficulty?: string;
    download_time_estimate?: string;
    download_materials_needed?: string;
    download_seo_title?: string;
    download_seo_description?: string;
    download_featured?: boolean;
    download_order?: number;
  };
  // ACF fields might also be directly on the object
  acf?: {
    download_file?: string | number;
    download_category?: string;
    download_thumbnail?: string | number;
    download_type?: string;
    download_url?: string;
    download_description?: string;
    // Enhanced fields for improved functionality
    download_slug?: string;
    download_file_size?: string;
    download_format?: string;
    download_difficulty?: string;
    download_time_estimate?: string;
    download_materials_needed?: string;
    download_seo_title?: string;
    download_seo_description?: string;
    download_featured?: boolean;
    download_order?: number;
  };
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
      _links: Record<string, unknown>;
    }>;
    'wp:term'?: Array<
      Array<{
        id: number;
        link: string;
        name: string;
        slug: string;
        taxonomy: string;
        _links: Record<string, unknown>;
      }>
    >;
  };
}

// WordPress REST API Query Parameters
export interface WPRestQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  categories?: number[];
  tags?: number[];
  orderby?: string;
  order?: 'asc' | 'desc';
  _embed?: boolean;
  status?: 'publish' | 'draft' | 'private' | 'trash';
  author?: number;
  parent?: number;
  slug?: string;
  include?: number[];
  exclude?: number[];
  offset?: number;
  before?: string;
  after?: string;
  modified_before?: string;
  modified_after?: string;
  sticky?: boolean;
  menu_order?: number;
  featured_media?: number;
  comment_status?: 'open' | 'closed';
  ping_status?: 'open' | 'closed';
  format?: string;
  template?: string;
  meta_key?: string;
  meta_value?: string;
  meta_compare?: string;
  meta_query?: unknown[];
  meta_type?: string;
  meta_type_key?: string;
  meta_type_value?: string;
  meta_type_compare?: string;
  meta_type_query?: unknown[];
}

// WordPress REST API Response Headers
export interface WPRestResponseHeaders {
  'X-WP-Total': string;
  'X-WP-TotalPages': string;
  'X-WP-Query': string;
  Link: string;
  'Content-Type': string;
  'Cache-Control': string;
  ETag: string;
  'Last-Modified': string;
}

// WordPress REST API Pagination
export interface WPRestPagination {
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// WordPress REST API Error Response
export interface WPRestErrorResponse {
  code: string;
  message: string;
  data: {
    status: number;
    params?: Record<string, unknown>;
    details?: Record<string, unknown>;
  };
}

// WordPress REST API Search Response
export interface WPRestSearchResult {
  id: number;
  title: string;
  url: string;
  type: string;
  subtype: string;
  _links: Record<string, unknown>;
}

export interface WPRestSearchResponse {
  results: WPRestSearchResult[];
  total: number;
  totalPages: number;
}

// Validation Schemas
export const wpRestPostSchema = z.object({
  id: z.number().int().positive(),
  date: z.string(),
  date_gmt: z.string(),
  guid: z.object({ rendered: z.string() }),
  modified: z.string(),
  modified_gmt: z.string(),
  slug: z.string(),
  status: z.string(),
  type: z.string(),
  link: z.string(),
  title: z.object({ rendered: z.string() }),
  content: z.object({
    rendered: z.string(),
    protected: z.boolean(),
  }),
  excerpt: z.object({
    rendered: z.string(),
    protected: z.boolean(),
  }),
  author: z.number(),
  featured_media: z.number(),
  comment_status: z.string(),
  ping_status: z.string(),
  sticky: z.boolean(),
  template: z.string(),
  format: z.string(),
  meta: z.array(z.unknown()),
  _embedded: z
    .object({
      author: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            url: z.string(),
            description: z.string(),
            link: z.string(),
            slug: z.string(),
            avatar_urls: z.record(z.string(), z.string()),
          })
        )
        .optional(),
      'wp:featuredmedia': z
        .array(
          z.object({
            id: z.number(),
            date: z.string(),
            slug: z.string(),
            type: z.string(),
            link: z.string(),
            title: z.object({ rendered: z.string() }),
            author: z.number(),
            caption: z.object({ rendered: z.string() }),
            alt_text: z.string(),
            media_type: z.string(),
            mime_type: z.string(),
            source_url: z.string(),
            _links: z.record(z.string(), z.unknown()),
          })
        )
        .optional(),
      'wp:term': z
        .array(
          z.array(
            z.object({
              id: z.number(),
              link: z.string(),
              name: z.string(),
              slug: z.string(),
              taxonomy: z.string(),
              _links: z.record(z.string(), z.unknown()),
            })
          )
        )
        .optional(),
    })
    .optional(),
});

export const wpRestCategorySchema = z.object({
  id: z.number().int().positive(),
  count: z.number().int().nonnegative(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.string(),
  parent: z.number().int().nonnegative(),
  meta: z.array(z.unknown()),
  _links: z.record(z.string(), z.unknown()),
});

export const wpRestTagSchema = z.object({
  id: z.number().int().positive(),
  count: z.number().int().nonnegative(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.string(),
  meta: z.array(z.unknown()),
  _links: z.record(z.string(), z.unknown()),
});

// Type guards
export function isWPRestPost(obj: unknown): obj is WPRestPost {
  try {
    wpRestPostSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

export function isWPRestCategory(obj: unknown): obj is WPRestCategory {
  try {
    wpRestCategorySchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

export function isWPRestTag(obj: unknown): obj is WPRestTag {
  try {
    wpRestTagSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

// Utility functions
export function validateWPRestPost(post: unknown): WPRestPost {
  return wpRestPostSchema.parse(post);
}

export function validateWPRestCategory(category: unknown): WPRestCategory {
  return wpRestCategorySchema.parse(category);
}

export function validateWPRestTag(tag: unknown): WPRestTag {
  return wpRestTagSchema.parse(tag);
}

// WordPress REST API endpoint constants
export const WP_REST_ENDPOINTS = {
  POSTS: '/wp-json/wp/v2/posts',
  POST: '/wp-json/wp/v2/posts',
  CATEGORIES: '/wp-json/wp/v2/categories',
  TAGS: '/wp-json/wp/v2/tags',
  SEARCH: '/wp-json/wp/v2/search',
  MEDIA: '/wp-json/wp/v2/media',
  USERS: '/wp-json/wp/v2/users',
  COMMENTS: '/wp-json/wp/v2/comments',
  PAGES: '/wp-json/wp/v2/pages',
  TYPES: '/wp-json/wp/v2/types',
  STATUSES: '/wp-json/wp/v2/statuses',
  TAXONOMIES: '/wp-json/wp/v2/taxonomies',
  DOWNLOADS: '/wp-json/wp/v2/downloads', // Custom post type endpoint
} as const;

// WordPress REST API status constants
export const WP_POST_STATUSES = {
  PUBLISH: 'publish',
  DRAFT: 'draft',
  PRIVATE: 'private',
  TRASH: 'trash',
  PENDING: 'pending',
  FUTURE: 'future',
} as const;

export const WP_POST_TYPES = {
  POST: 'post',
  PAGE: 'page',
  ATTACHMENT: 'attachment',
  REVISION: 'revision',
  NAV_MENU_ITEM: 'nav_menu_item',
  CUSTOM_POST_TYPE: 'custom_post_type',
  DOWNLOADS: 'downloads', // Custom post type
} as const;

// Download Analytics Types
export interface DownloadAnalytics {
  downloadCount: number;
  lastDownloaded?: string;
  popularityScore: number;
  downloadsByDate: Record<string, number>;
  downloadsByCountry?: Record<string, number>;
  downloadsByDevice?: Record<string, number>;
}

export interface DownloadTrackingData {
  downloadId: string;
  category: string;
  slug: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ipHash: string; // Anonymized IP
  deviceType?: string;
  country?: string;
}

export interface DownloadStats {
  totalDownloads: number;
  downloadsThisMonth: number;
  mostPopular: Array<{
    id: string;
    title: string;
    downloadCount: number;
    category: string;
  }>;
  downloadsByCategory: Record<string, number>;
  recentDownloads: Array<{
    id: string;
    title: string;
    category: string;
    timestamp: string;
  }>;
}
