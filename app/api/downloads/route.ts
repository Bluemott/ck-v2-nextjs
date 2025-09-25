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

// Cache configuration for downloads
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '100', 10);

    // Create cache key
    const cacheKey = `downloads:${category || 'all'}:${page}:${perPage}`;

    // Check cache first
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=600', // 10 minutes
          'X-Cache': 'HIT',
        },
      });
    }

    let downloads;
    let pagination;

    if (category) {
      // Get downloads by category
      downloads = await restAPIClient.getDownloadsByCategory(category);
      pagination = {
        totalPosts: downloads.length,
        totalPages: 1,
        currentPage: 1,
        perPage: downloads.length,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    } else {
      // Get all downloads
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
    }

    // Transform WordPress data to match current frontend structure
    const transformedDownloads = await transformDownloadsData(downloads);

    const response = {
      downloads: transformedDownloads,
      pagination,
      meta: {
        total: downloads.length,
        category: category || 'all',
        timestamp: new Date().toISOString(),
      },
    };

    // Cache the response
    cacheManager.set(cacheKey, response, CACHE_TTL);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=600', // 10 minutes
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching downloads:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch downloads',
        message: error instanceof Error ? error.message : 'Unknown error',
        downloads: [],
        pagination: {
          totalPosts: 0,
          totalPages: 1,
          currentPage: 1,
          perPage: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to get proper download URL
function getDownloadUrl(
  downloadType: string | undefined,
  downloadUrl: string | undefined,
  downloadFile: string | number | undefined
): string {
  // For blog posts, use the URL
  if (downloadType === 'blog-post') {
    if (
      downloadUrl &&
      typeof downloadUrl === 'string' &&
      downloadUrl.startsWith('http')
    ) {
      return downloadUrl;
    }
    if (
      downloadUrl &&
      typeof downloadUrl === 'string' &&
      downloadUrl.startsWith('/')
    ) {
      return downloadUrl;
    }
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

  // Fallback to default image
  return '/images/default-download.webp';
}

// Helper function to fetch media details
async function fetchMediaDetails(mediaId: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.cowboykimono.com/wp-json/wp/v2/media/${mediaId}`
    );
    if (response.ok) {
      const media = await response.json();
      return media.source_url || '';
    }
  } catch (error) {
    console.error('Error fetching media details:', error);
  }
  return '';
}

// Transform WordPress download data to match current frontend structure
async function transformDownloadsData(
  wpDownloads: WordPressDownload[]
): Promise<DownloadSection[]> {
  // Group downloads by category
  const groupedDownloads: Record<string, TransformedDownload[]> = {};

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

    // If thumbnail is empty and we have a media ID, fetch the details
    if (
      !thumbnailUrl &&
      acfData.download_thumbnail &&
      (typeof acfData.download_thumbnail === 'number' ||
        /^\d+$/.test(acfData.download_thumbnail))
    ) {
      const mediaId =
        typeof acfData.download_thumbnail === 'number'
          ? acfData.download_thumbnail
          : parseInt(acfData.download_thumbnail, 10);
      thumbnailUrl = await fetchMediaDetails(mediaId);
    }

    // Get download URL
    let downloadUrl = getDownloadUrl(
      acfData.download_type,
      acfData.download_url,
      acfData.download_file
    );

    // If download URL is empty and we have a file media ID, fetch the details
    if (
      !downloadUrl &&
      acfData.download_file &&
      (typeof acfData.download_file === 'number' ||
        /^\d+$/.test(acfData.download_file))
    ) {
      const mediaId =
        typeof acfData.download_file === 'number'
          ? acfData.download_file
          : parseInt(acfData.download_file, 10);
      downloadUrl = await fetchMediaDetails(mediaId);
    }

    // Transform individual download item
    const downloadItem = {
      id: `download-${download.id}`,
      title: download.title.rendered,
      thumbnail: thumbnailUrl,
      downloadUrl,
      description:
        acfData.download_description || download.excerpt?.rendered || '',
      type: acfData.download_type || 'pdf',
    };

    // Add all items, even if they don't have valid URLs (they'll show as fallback)
    groupedDownloads[category].push(downloadItem);
  }

  // Transform to match current structure
  const downloadSections = Object.entries(groupedDownloads).map(
    ([category, items]) => {
      const categoryConfig = getCategoryConfig(category);

      return {
        id: category,
        title: categoryConfig.title,
        description: categoryConfig.description,
        image: categoryConfig.image,
        thumbnails: items,
      };
    }
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
      image: '/images/default-download.webp',
    },
  };

  return (
    configs[category] ||
    configs['uncategorized'] || {
      title: 'Other Downloads',
      description:
        'Additional resources and materials for your western fashion journey.',
      image: '/images/default-download.webp',
    }
  );
}
