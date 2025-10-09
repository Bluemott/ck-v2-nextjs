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

// Static fallback data that matches your actual files
const FALLBACK_DOWNLOADS = {
  'coloring-pages': {
    id: 'coloring-pages',
    title: 'Coloring Pages',
    description:
      'Free downloadable coloring pages for creating your own western-inspired garments.',
    image: '/images/Neon_Coloring_Mock.webp',
    thumbnails: [
      {
        id: 'abq-neon',
        title: 'ABQ Neon Coloring Page',
        thumbnail: '/images/Neon_Coloring_Mock.webp',
        downloadUrl: '/downloads/coloring-pages/ABQ_Neon_W+Color.pdf',
        description: 'Neon-inspired southwestern coloring design',
        type: 'pdf',
      },
      {
        id: 'ck-coloring-pages',
        title: 'CK Coloring Pages Collection',
        thumbnail: '/images/CK_Coloring_Button.webp',
        downloadUrl: '/downloads/coloring-pages/CK_Coloring_Pages_UP.pdf',
        description: 'Collection of Cowboy Kimono coloring pages',
        type: 'pdf',
      },
      {
        id: 'creativity-exercise',
        title: 'CK Creativity Exercise',
        thumbnail: '/images/CK_Coloring_Button.webp',
        downloadUrl: '/downloads/coloring-pages/CK_Creativity_Exercise.pdf',
        description: 'Creative coloring exercise activities',
        type: 'pdf',
      },
      {
        id: 'holiday-craft-templates',
        title: 'Holiday Craft Templates',
        thumbnail: '/images/CKCraft_Template2.webp',
        downloadUrl:
          '/downloads/coloring-pages/CK_Holiday_Craft_Templates_1.pdf',
        description: 'Holiday-themed craft templates',
        type: 'pdf',
      },
    ],
  },
  'craft-templates': {
    id: 'craft-templates',
    title: 'Craft Templates',
    description:
      'Artistic templates and stencils for painting and decorating your own cowboy kimonos.',
    image: '/images/CKCraft_Template2.webp',
    thumbnails: [
      {
        id: 'june-bugs',
        title: "3 June Bugs You'll Love Immediately",
        thumbnail: '/images/Craft_June_Bug.webp',
        downloadUrl: '/downloads/craft-templates/June_Bugs.pdf',
        description: 'Adorable June bug craft template',
        type: 'pdf',
      },
      {
        id: 'ox-book-corner',
        title: 'Year of the OX Irresistible Paper Craft',
        thumbnail: '/images/Ox_book_corner.webp',
        downloadUrl: '/downloads/craft-templates/Ox_Book_Corner.pdf',
        description: 'Year of the Ox bookmark craft',
        type: 'pdf',
      },
      {
        id: 'kickass-thanks',
        title: 'Create a Kickass Thank You for Your Mail Carrier',
        thumbnail: '/images/Kickass_Thanks_Envelope.webp',
        downloadUrl: '/downloads/craft-templates/Kickass_Thank_You.pdf',
        description: 'Mail carrier appreciation craft',
        type: 'pdf',
      },
      {
        id: 'labor-day',
        title: 'Your Labor is Loved (Labor Day Craft)',
        thumbnail: '/images/Labor_is_Loved.webp',
        downloadUrl: '/downloads/craft-templates/Labor_Day_Love.pdf',
        description: 'Labor Day appreciation craft',
        type: 'pdf',
      },
      {
        id: 'fathers-day',
        title: 'Yum. Fathers Day Craft',
        thumbnail: '/images/Father_Day_Muffins.webp',
        downloadUrl: '/downloads/craft-templates/Fathers_Day_Craft.pdf',
        description: "Father's Day craft template",
        type: 'pdf',
      },
      {
        id: 'milagro-ornaments',
        title: 'Jumbo Milagros for Mothers Day',
        thumbnail: '/images/Jumbo_Milagro.webp',
        downloadUrl:
          '/downloads/craft-templates/Milagro_Ornaments_w_instructions.pdf',
        description: "Mother's Day milagro ornament craft",
        type: 'pdf',
      },
      {
        id: 'grocery-bag-birds',
        title: 'Grocery Bag Bird Ornaments',
        thumbnail: '/images/Grocery_Bag_Birds_Green.webp',
        downloadUrl:
          '/downloads/craft-templates/Grocery_Bag_Birds_with_instructions.pdf',
        description: 'Recycled grocery bag bird craft',
        type: 'pdf',
      },
    ],
  },
  'diy-tutorials': {
    id: 'diy-tutorials',
    title: 'DIY Tutorials',
    description:
      'Comprehensive guides on caring for your handcrafted pieces and styling tips.',
    image: '/images/Jumbo_Milagro.webp',
    thumbnails: [
      {
        id: 'wash-painted-denim',
        title: 'How to Wash Painted Denim',
        thumbnail: '/images/CK_Wash_Painted_Denim.webp',
        downloadUrl: '/downloads/DIY-tutorials/CK_Wash_Painted_Denim.pdf',
        description: 'Care guide for handpainted denim',
        type: 'pdf',
      },
    ],
  },
};

// Cache configuration for downloads
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '100', 10);
    const useFallback = searchParams.get('fallback') === 'true';

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

    let responseData;

    // If fallback is explicitly requested, use static data
    if (useFallback) {
      if (
        category &&
        FALLBACK_DOWNLOADS[category as keyof typeof FALLBACK_DOWNLOADS]
      ) {
        responseData = {
          downloads: [
            FALLBACK_DOWNLOADS[category as keyof typeof FALLBACK_DOWNLOADS],
          ],
          pagination: {
            totalPosts: 1,
            totalPages: 1,
            currentPage: 1,
            perPage: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          meta: {
            total: 1,
            category,
            timestamp: new Date().toISOString(),
            source: 'fallback',
          },
        };
      } else {
        responseData = {
          downloads: Object.values(FALLBACK_DOWNLOADS),
          pagination: {
            totalPosts: Object.keys(FALLBACK_DOWNLOADS).length,
            totalPages: 1,
            currentPage: 1,
            perPage: Object.keys(FALLBACK_DOWNLOADS).length,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          meta: {
            total: Object.keys(FALLBACK_DOWNLOADS).length,
            category: 'all',
            timestamp: new Date().toISOString(),
            source: 'fallback',
          },
        };
      }
    } else {
      // Try to fetch from WordPress API
      try {
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

        // Transform WordPress data to match frontend structure
        const transformedDownloads =
          await transformDownloadsData(downloads);

        // If WordPress returns no downloads, fall back to static data
        if (transformedDownloads.length === 0) {
          console.warn('No downloads from WordPress, using fallback data');
          if (
            category &&
            FALLBACK_DOWNLOADS[category as keyof typeof FALLBACK_DOWNLOADS]
          ) {
            responseData = {
              downloads: [
                FALLBACK_DOWNLOADS[
                  category as keyof typeof FALLBACK_DOWNLOADS
                ],
              ],
              pagination: {
                totalPosts: 1,
                totalPages: 1,
                currentPage: 1,
                perPage: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
              meta: {
                total: 1,
                category,
                timestamp: new Date().toISOString(),
                source: 'fallback-no-wp-data',
              },
            };
          } else {
            responseData = {
              downloads: Object.values(FALLBACK_DOWNLOADS),
              pagination: {
                totalPosts: Object.keys(FALLBACK_DOWNLOADS).length,
                totalPages: 1,
                currentPage: 1,
                perPage: Object.keys(FALLBACK_DOWNLOADS).length,
                hasNextPage: false,
                hasPreviousPage: false,
              },
              meta: {
                total: Object.keys(FALLBACK_DOWNLOADS).length,
                category: 'all',
                timestamp: new Date().toISOString(),
                source: 'fallback-no-wp-data',
              },
            };
          }
        } else {
          responseData = {
            downloads: transformedDownloads,
            pagination,
            meta: {
              total: downloads.length,
              category: category || 'all',
              timestamp: new Date().toISOString(),
              source: 'wordpress',
            },
          };
        }
      } catch (wpError) {
        console.error('WordPress API error, using fallback:', wpError);
        // Fall back to static data on error
        if (
          category &&
          FALLBACK_DOWNLOADS[category as keyof typeof FALLBACK_DOWNLOADS]
        ) {
          responseData = {
            downloads: [
              FALLBACK_DOWNLOADS[category as keyof typeof FALLBACK_DOWNLOADS],
            ],
            pagination: {
              totalPosts: 1,
              totalPages: 1,
              currentPage: 1,
              perPage: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            meta: {
              total: 1,
              category,
              timestamp: new Date().toISOString(),
              source: 'fallback-wp-error',
            },
          };
        } else {
          responseData = {
            downloads: Object.values(FALLBACK_DOWNLOADS),
            pagination: {
              totalPosts: Object.keys(FALLBACK_DOWNLOADS).length,
              totalPages: 1,
              currentPage: 1,
              perPage: Object.keys(FALLBACK_DOWNLOADS).length,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            meta: {
              total: Object.keys(FALLBACK_DOWNLOADS).length,
              category: 'all',
              timestamp: new Date().toISOString(),
              source: 'fallback-wp-error',
            },
          };
        }
      }
    }

    // Cache the response
    cacheManager.set(cacheKey, responseData, CACHE_TTL);

    return NextResponse.json(responseData, {
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
  return '/images/placeholder.svg';
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
