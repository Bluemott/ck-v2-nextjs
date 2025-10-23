import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '../../lib/cache';
import { restAPIClient } from '../../lib/rest-api';

// Type definitions for download data
interface DownloadACF {
  download_category?: string;
  download_thumbnail?: string | number;
  download_type?: string;
  download_url?: string;
  download_file?: string | number;
  download_description?: string;
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
}

interface WordPressDownload {
  id: number;
  title: { rendered: string };
  excerpt?: { rendered: string };
  featured_media: number;
  acf?: DownloadACF;
  meta?: DownloadACF;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
    }>;
  };
}

interface TransformedDownload {
  id: string;
  title: string;
  thumbnail: string;
  downloadUrl: string;
  description: string;
  type: string;
  category?: string;
  slug?: string;
  fileSize?: string;
  format?: string;
  difficulty?: string;
  timeEstimate?: string;
  materialsNeeded?: string;
}

interface DownloadSection {
  id: string;
  title: string;
  description: string;
  image: string;
  thumbnails: TransformedDownload[];
}

interface CategoryConfig {
  title: string;
  description: string;
  image: string;
}

// Cache configuration for downloads - reduced for faster updates
// const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();

  // Parse query parameters outside try block for error logging
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '100', 10);

  try {
    // Enhanced logging for debugging
    console.warn(`[${requestId}] Downloads API Request:`, {
      category,
      featured,
      page,
      perPage,
      timestamp: new Date().toISOString(),
    });

    // Create cache key
    const cacheKey = `downloads:${category || 'all'}:${featured ? 'featured' : 'all'}:${page}:${perPage}`;

    // Check cache first
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.warn(`[${requestId}] Cache HIT for downloads:`, {
        category,
        featured,
        page,
        perPage,
      });
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=900', // 15 minutes
          'X-Cache': 'HIT',
          'X-Request-ID': requestId,
        },
      });
    }

    let downloads;
    let pagination;

    if (featured) {
      // Get featured downloads from WordPress
      console.warn(`[${requestId}] Fetching featured downloads`);
      downloads = await restAPIClient.getFeaturedDownloads(perPage);
      pagination = {
        totalPosts: downloads.length,
        totalPages: 1,
        currentPage: 1,
        perPage: downloads.length,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      console.warn(
        `[${requestId}] Found ${downloads.length} featured downloads`
      );
    } else if (category) {
      // Get downloads by category from WordPress
      console.warn(`[${requestId}] Fetching downloads for category:`, category);
      downloads = await restAPIClient.getDownloadsByCategory(category);
      pagination = {
        totalPosts: downloads.length,
        totalPages: 1,
        currentPage: 1,
        perPage: downloads.length,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      console.warn(
        `[${requestId}] Found ${downloads.length} downloads for category ${category}`
      );
    } else {
      // Get all downloads from WordPress
      console.warn(`[${requestId}] Fetching all downloads:`, { page, perPage });
      const result = await restAPIClient.getDownloads({
        page,
        per_page: perPage,
        _embed: true,
        status: 'publish',
        orderby: 'date',
        order: 'desc',
      });
      downloads = result.downloads;
      pagination = result.pagination;
      console.warn(`[${requestId}] Found ${downloads.length} total downloads`);
    }

    // Transform WordPress data to match frontend structure
    console.warn(`[${requestId}] Transforming downloads data...`);
    let responseData;

    if (featured) {
      // For featured downloads, return flat array of downloads
      const transformedFeatured = await transformFeaturedDownloadsData(
        downloads,
        requestId
      );
      responseData = {
        success: true,
        downloads: transformedFeatured,
        pagination,
        meta: {
          total: downloads.length,
          category: 'featured',
          timestamp: new Date().toISOString(),
          source: 'wordpress',
          requestId,
        },
      };
    } else {
      // For regular downloads, return grouped sections
      const transformedDownloads = await transformDownloadsData(
        downloads,
        requestId
      );
      responseData = {
        success: true,
        downloads: transformedDownloads,
        pagination,
        meta: {
          total: downloads.length,
          category: category || 'all',
          timestamp: new Date().toISOString(),
          source: 'wordpress',
          requestId,
        },
      };
    }

    console.warn(
      `[${requestId}] Transformed into ${featured ? 'featured downloads' : `${responseData.downloads.length} sections`}`
    );

    // Cache the response with longer TTL for stable content
    const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
    cacheManager.set(cacheKey, responseData, CACHE_TTL);
    console.warn(
      `[${requestId}] Cached response for ${CACHE_TTL / 1000 / 60} minutes`
    );

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=900', // 15 minutes
        'X-Cache': 'MISS',
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Downloads API Error:`, {
      error: error instanceof Error ? error.message : String(error),
      category,
      page,
      perPage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch downloads',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        downloads: [], // Empty array instead of undefined
        pagination: {
          totalPosts: 0,
          totalPages: 1,
          currentPage: 1,
          perPage: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        meta: {
          category: category || 'all',
          timestamp: new Date().toISOString(),
          source: 'error',
          requestId,
        },
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  }
}

// Helper function to get proper download URL
function getDownloadUrl(
  downloadType: string | undefined,
  downloadUrl: string | undefined,
  downloadFile: string | number | undefined
): string {
  // First, check if we have a direct download URL (for both blog posts and files)
  if (downloadUrl && typeof downloadUrl === 'string') {
    if (downloadUrl.startsWith('http')) {
      return downloadUrl;
    }
    if (downloadUrl.startsWith('/')) {
      return downloadUrl;
    }
  }

  // For blog posts, if no direct URL, return placeholder
  if (downloadType === 'blog-post') {
    return '#';
  }

  // For file downloads, handle media IDs
  if (downloadFile) {
    // If it's already a URL, use it
    if (typeof downloadFile === 'string' && downloadFile.startsWith('http')) {
      return downloadFile;
    }

    // If it's a media ID, we need to fetch media details to get the proper URL
    if (typeof downloadFile === 'number' || /^\d+$/.test(downloadFile)) {
      // For now, return empty to use fallback
      return '';
    }

    // If it's a string but not a URL, try to use it as a path
    if (typeof downloadFile === 'string') {
      return downloadFile.startsWith('/') ? downloadFile : `/${downloadFile}`;
    }
  }

  return '#';
}

// Helper function to get proper thumbnail URL
function getThumbnailUrl(
  acfThumbnail: string | number | undefined,
  embeddedMedia: { id: number; source_url: string } | undefined,
  featuredMediaId: number | undefined
): string {
  // If ACF thumbnail is a URL, use it
  if (
    acfThumbnail &&
    typeof acfThumbnail === 'string' &&
    acfThumbnail.startsWith('http')
  ) {
    return acfThumbnail;
  }

  // If ACF thumbnail is a media ID, try to resolve it
  if (
    acfThumbnail &&
    (typeof acfThumbnail === 'number' || /^\d+$/.test(acfThumbnail))
  ) {
    // Try to find the media in embedded data first
    const mediaId =
      typeof acfThumbnail === 'number'
        ? acfThumbnail
        : parseInt(acfThumbnail, 10);
    if (embeddedMedia && embeddedMedia.id === mediaId) {
      return embeddedMedia.source_url;
    }
    // If not found in embedded data, return empty to use fallback
    return '';
  }

  // If embedded media is available, use it
  if (embeddedMedia && embeddedMedia.source_url) {
    return embeddedMedia.source_url;
  }

  // If featured media ID exists, try to use embedded media
  if (featuredMediaId && featuredMediaId !== 0) {
    // Try to find the featured media in embedded data
    if (embeddedMedia && embeddedMedia.id === featuredMediaId) {
      return embeddedMedia.source_url;
    }
    // If not found in embedded data, return empty to use fallback
    return '';
  }

  // Fallback to placeholder image
  return '/images/placeholder.svg';
}

// Helper function to fetch media details from WordPress
async function fetchMediaDetails(mediaId: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.cowboykimono.com/wp-json/wp/v2/media/${mediaId}`,
      {
        signal: AbortSignal.timeout(5000), // 5 second timeout
        headers: {
          Accept: 'application/json',
        },
      }
    );
    if (response.ok) {
      const media = await response.json();
      // Return the source URL or media URL
      const url = media.source_url || media.guid?.rendered || '';
      if (url) {
        console.warn(`Media ${mediaId} resolved to: ${url}`);
        return url;
      }
    } else if (response.status === 401) {
      // For unauthorized access, don't construct fake URLs
      console.warn(`Media ${mediaId} requires authentication - skipping (401)`);
      return '';
    } else {
      console.warn(`Failed to fetch media ${mediaId}: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error fetching media details for ID ${mediaId}:`, error);
  }
  return '';
}

// Transform featured downloads data to flat array
async function transformFeaturedDownloadsData(
  wpDownloads: WordPressDownload[],
  requestId: string
): Promise<TransformedDownload[]> {
  console.warn(
    `[${requestId}] Starting transformation of ${wpDownloads.length} featured downloads`
  );

  const featuredDownloads: TransformedDownload[] = [];

  // Collect all media IDs that need to be fetched
  const mediaIdsToFetch = new Set<number>();

  for (const download of wpDownloads) {
    const acfData = download.acf || download.meta || {};
    console.warn(
      `[${requestId}] Processing featured download ${download.id}:`,
      {
        title: download.title.rendered,
        acfData: Object.keys(acfData),
        hasEmbedded: !!download._embedded,
      }
    );

    // Collect thumbnail IDs
    if (
      acfData.download_thumbnail &&
      typeof acfData.download_thumbnail === 'number'
    ) {
      mediaIdsToFetch.add(acfData.download_thumbnail);
    } else if (
      acfData.download_thumbnail &&
      typeof acfData.download_thumbnail === 'string' &&
      /^\d+$/.test(acfData.download_thumbnail)
    ) {
      mediaIdsToFetch.add(parseInt(acfData.download_thumbnail, 10));
    }

    // Collect file IDs
    if (acfData.download_file && typeof acfData.download_file === 'number') {
      mediaIdsToFetch.add(acfData.download_file);
    } else if (
      acfData.download_file &&
      typeof acfData.download_file === 'string' &&
      /^\d+$/.test(acfData.download_file)
    ) {
      mediaIdsToFetch.add(parseInt(acfData.download_file, 10));
    }
  }

  // Batch fetch all media details
  console.warn(`[${requestId}] Fetching ${mediaIdsToFetch.size} media items`);
  const mediaCache: Record<number, string> = {};
  await Promise.all(
    Array.from(mediaIdsToFetch).map(async (mediaId) => {
      const url = await fetchMediaDetails(mediaId);
      if (url) {
        mediaCache[mediaId] = url;
        console.warn(`[${requestId}] Media ${mediaId} resolved to:`, url);
      } else {
        console.warn(`[${requestId}] Media ${mediaId} could not be resolved`);
      }
    })
  );

  for (const download of wpDownloads) {
    const acfData = download.acf || download.meta || {};

    // Get thumbnail URL
    let thumbnailUrl = getThumbnailUrl(
      acfData.download_thumbnail,
      download._embedded?.['wp:featuredmedia']?.[0],
      download.featured_media
    );

    // If thumbnail is empty and we have a media ID, use cached media
    if (!thumbnailUrl && acfData.download_thumbnail) {
      const mediaId =
        typeof acfData.download_thumbnail === 'number'
          ? acfData.download_thumbnail
          : typeof acfData.download_thumbnail === 'string'
            ? parseInt(acfData.download_thumbnail, 10)
            : 0;
      if (mediaId > 0) {
        thumbnailUrl = mediaCache[mediaId] || '';
      }
    }

    // Get download URL
    let downloadUrl = getDownloadUrl(
      acfData.download_type,
      acfData.download_url,
      acfData.download_file
    );

    // If download URL is empty and we have a file media ID, use cached media
    if (!downloadUrl && acfData.download_file) {
      const mediaId =
        typeof acfData.download_file === 'number'
          ? acfData.download_file
          : typeof acfData.download_file === 'string'
            ? parseInt(acfData.download_file, 10)
            : 0;
      if (mediaId > 0) {
        downloadUrl = mediaCache[mediaId] || '';
      }
    }

    // If still no download URL, try to use the download_url field directly
    if (
      !downloadUrl &&
      acfData.download_url &&
      typeof acfData.download_url === 'string'
    ) {
      // If it's a relative path, make it absolute
      if (acfData.download_url.startsWith('/')) {
        downloadUrl = `https://api.cowboykimono.com${acfData.download_url}`;
      } else if (acfData.download_url.startsWith('http')) {
        downloadUrl = acfData.download_url;
      }
    }

    // Skip items without valid download URLs
    if (!downloadUrl || downloadUrl === '#') {
      console.warn(
        `[${requestId}] Skipping featured download ${download.id} (${download.title.rendered}): No valid download URL`,
        {
          download_type: acfData.download_type,
          download_url: acfData.download_url,
          download_file: acfData.download_file,
          category: acfData.download_category,
        }
      );
      continue;
    }

    // Transform individual download item
    const downloadItem = {
      id: `download-${download.id}`,
      title: download.title.rendered,
      thumbnail: thumbnailUrl || '/images/placeholder.svg',
      downloadUrl,
      description:
        acfData.download_description || download.excerpt?.rendered || '',
      type: acfData.download_type || 'pdf',
      // Enhanced fields
      category: acfData.download_category || 'uncategorized',
      slug: acfData.download_slug || '',
      fileSize: acfData.download_file_size || '',
      format: acfData.download_format || '',
      difficulty: acfData.download_difficulty || '',
      timeEstimate: acfData.download_time_estimate || '',
      materialsNeeded: acfData.download_materials_needed || '',
    };

    featuredDownloads.push(downloadItem);
    console.warn(`[${requestId}] Added featured download:`, downloadItem.title);
  }

  console.warn(
    `[${requestId}] Featured transformation complete: ${featuredDownloads.length} downloads created`
  );
  return featuredDownloads;
}

// Transform WordPress download data to match current frontend structure
async function transformDownloadsData(
  wpDownloads: WordPressDownload[],
  requestId: string
): Promise<DownloadSection[]> {
  console.warn(
    `[${requestId}] Starting transformation of ${wpDownloads.length} downloads`
  );

  // Group downloads by category
  const groupedDownloads: Record<string, TransformedDownload[]> = {};

  // Collect all media IDs that need to be fetched
  const mediaIdsToFetch = new Set<number>();

  for (const download of wpDownloads) {
    const acfData = download.acf || download.meta || {};
    console.warn(`[${requestId}] Processing download ${download.id}:`, {
      title: download.title.rendered,
      acfData: Object.keys(acfData),
      hasEmbedded: !!download._embedded,
    });

    // Collect thumbnail IDs
    if (
      acfData.download_thumbnail &&
      typeof acfData.download_thumbnail === 'number'
    ) {
      mediaIdsToFetch.add(acfData.download_thumbnail);
    } else if (
      acfData.download_thumbnail &&
      typeof acfData.download_thumbnail === 'string' &&
      /^\d+$/.test(acfData.download_thumbnail)
    ) {
      mediaIdsToFetch.add(parseInt(acfData.download_thumbnail, 10));
    }

    // Collect file IDs
    if (acfData.download_file && typeof acfData.download_file === 'number') {
      mediaIdsToFetch.add(acfData.download_file);
    } else if (
      acfData.download_file &&
      typeof acfData.download_file === 'string' &&
      /^\d+$/.test(acfData.download_file)
    ) {
      mediaIdsToFetch.add(parseInt(acfData.download_file, 10));
    }
  }

  // Batch fetch all media details
  console.warn(`[${requestId}] Fetching ${mediaIdsToFetch.size} media items`);
  const mediaCache: Record<number, string> = {};
  await Promise.all(
    Array.from(mediaIdsToFetch).map(async (mediaId) => {
      const url = await fetchMediaDetails(mediaId);
      if (url) {
        mediaCache[mediaId] = url;
        console.warn(`[${requestId}] Media ${mediaId} resolved to:`, url);
      } else {
        console.warn(`[${requestId}] Media ${mediaId} could not be resolved`);
      }
    })
  );

  for (const download of wpDownloads) {
    // ACF fields might be in download.meta or download.acf
    const acfData = download.acf || download.meta || {};
    const category = acfData.download_category || 'uncategorized';

    if (!groupedDownloads[category]) {
      groupedDownloads[category] = [];
    }

    // Get thumbnail URL
    let thumbnailUrl = getThumbnailUrl(
      acfData.download_thumbnail,
      download._embedded?.['wp:featuredmedia']?.[0],
      download.featured_media
    );

    // If thumbnail is empty and we have a media ID, use cached media
    if (!thumbnailUrl && acfData.download_thumbnail) {
      const mediaId =
        typeof acfData.download_thumbnail === 'number'
          ? acfData.download_thumbnail
          : typeof acfData.download_thumbnail === 'string'
            ? parseInt(acfData.download_thumbnail, 10)
            : 0;
      if (mediaId > 0) {
        thumbnailUrl = mediaCache[mediaId] || '';
      }
    }

    // Get download URL
    let downloadUrl = getDownloadUrl(
      acfData.download_type,
      acfData.download_url,
      acfData.download_file
    );

    // If download URL is empty and we have a file media ID, use cached media
    if (!downloadUrl && acfData.download_file) {
      const mediaId =
        typeof acfData.download_file === 'number'
          ? acfData.download_file
          : typeof acfData.download_file === 'string'
            ? parseInt(acfData.download_file, 10)
            : 0;
      if (mediaId > 0) {
        downloadUrl = mediaCache[mediaId] || '';
      }
    }

    // If still no download URL, try to use the download_url field directly
    if (
      !downloadUrl &&
      acfData.download_url &&
      typeof acfData.download_url === 'string'
    ) {
      // If it's a relative path, make it absolute
      if (acfData.download_url.startsWith('/')) {
        downloadUrl = `https://api.cowboykimono.com${acfData.download_url}`;
      } else if (acfData.download_url.startsWith('http')) {
        downloadUrl = acfData.download_url;
      }
    }

    // Skip items without valid download URLs, but log more details for debugging
    if (!downloadUrl || downloadUrl === '#') {
      console.warn(
        `[${requestId}] Skipping download ${download.id} (${download.title.rendered}): No valid download URL`,
        {
          download_type: acfData.download_type,
          download_url: acfData.download_url,
          download_file: acfData.download_file,
          category: acfData.download_category,
        }
      );
      continue;
    }

    // Transform individual download item
    const downloadItem = {
      id: `download-${download.id}`,
      title: download.title.rendered,
      thumbnail: thumbnailUrl || '/images/placeholder.svg',
      downloadUrl,
      description:
        acfData.download_description || download.excerpt?.rendered || '',
      type: acfData.download_type || 'pdf',
      // Enhanced fields
      category: acfData.download_category || 'uncategorized',
      slug: acfData.download_slug || '',
      fileSize: acfData.download_file_size || '',
      format: acfData.download_format || '',
      difficulty: acfData.download_difficulty || '',
      timeEstimate: acfData.download_time_estimate || '',
      materialsNeeded: acfData.download_materials_needed || '',
    };

    groupedDownloads[category].push(downloadItem);
    console.warn(
      `[${requestId}] Added download to category ${category}:`,
      downloadItem.title
    );
  }

  // Transform to match current structure and sort by category
  const downloadSections = Object.entries(groupedDownloads)
    .map(([category, items]) => {
      const categoryConfig = getCategoryConfig(category);
      console.warn(
        `[${requestId}] Creating section for ${category} with ${items.length} items`
      );

      return {
        id: category,
        title: categoryConfig.title,
        description: categoryConfig.description,
        image: categoryConfig.image,
        thumbnails: items.sort((a, b) => a.title.localeCompare(b.title)), // Sort items alphabetically
      };
    })
    .sort((a, b) => {
      // Sort sections by predefined order
      const order = ['coloring-pages', 'craft-templates', 'diy-tutorials'];
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  console.warn(
    `[${requestId}] Transformation complete: ${downloadSections.length} sections created`
  );
  return downloadSections;
}

// Category configuration mapping
function getCategoryConfig(category: string): CategoryConfig {
  const configs: Record<string, CategoryConfig> = {
    'coloring-pages': {
      title: 'Coloring Pages',
      description:
        'Free printable coloring pages featuring western themes, cowboys, and desert landscapes.',
      image: '/images/Neon_Coloring_Mock.webp',
    },
    'craft-templates': {
      title: 'Craft Templates',
      description:
        'DIY craft templates and patterns for creating western-inspired decorations and gifts.',
      image: '/images/CKCraft_Template2.webp',
    },
    'diy-tutorials': {
      title: 'DIY Tutorials',
      description:
        'Comprehensive guides on caring for your handcrafted pieces and styling tips for different occasions.',
      image: '/images/Jumbo_Milagro.webp',
    },
    uncategorized: {
      title: 'Other Downloads',
      description:
        'Additional resources and materials for your western fashion journey.',
      image: '/images/placeholder.svg',
    },
  };

  return (
    configs[category] ||
    configs['uncategorized'] || {
      title: 'Other Downloads',
      description:
        'Additional resources and materials for your western fashion journey.',
      image: '/images/placeholder.svg',
    }
  );
}
