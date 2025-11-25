import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StructuredData, {
  generateBreadcrumbStructuredData,
  generateDownloadStructuredData,
} from '../../../components/StructuredData';
import { restAPIClient } from '../../../lib/rest-api';
import { generateSEOMetadata } from '../../../lib/seo';
import DownloadTracker from './DownloadTracker';

interface DownloadPageProps {
  params: {
    category: string;
    slug: string;
  };
}

export async function generateStaticParams() {
  try {
    const { downloads } = await restAPIClient.getDownloads({
      per_page: 100,
      _embed: true,
      status: 'publish',
    });

    return downloads
      .filter((download) => {
        const acfData = download.acf || download.meta || {};
        return acfData.download_slug && acfData.download_category;
      })
      .map((download) => {
        const acfData = download.acf || download.meta || {};
        return {
          category: acfData.download_category,
          slug: acfData.download_slug,
        };
      });
  } catch (error) {
    console.error('Error generating static params for download pages:', error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: DownloadPageProps): Promise<Metadata> {
  const { category, slug } = params;

  try {
    const download = await restAPIClient.getDownloadBySlug(category, slug);

    if (!download) {
      return generateSEOMetadata({
        title: 'Download Not Found',
        description: 'The requested download could not be found.',
        canonical: `/downloads/${category}/${slug}`,
      });
    }

    const acfData = download.acf || download.meta || {};
    const seoTitle = acfData.download_seo_title || download.title.rendered;
    const seoDescription =
      acfData.download_seo_description || download.excerpt?.rendered || '';

    return generateSEOMetadata({
      title: seoTitle,
      description: seoDescription,
      keywords: [category, 'download', 'free', 'cowboy kimono'],
      canonical: `/downloads/${category}/${slug}`,
      ogImage: download._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    });
  } catch (error) {
    console.error('Error generating metadata for download page:', error);
    return generateSEOMetadata({
      title: 'Download',
      description: 'Download page',
      canonical: `/downloads/${category}/${slug}`,
    });
  }
}

export default async function IndividualDownloadPage({
  params,
}: DownloadPageProps) {
  const { category, slug } = params;

  try {
    console.warn(`[Download Page] Fetching download: ${category}/${slug}`);
    const download = await restAPIClient.getDownloadBySlug(category, slug);
    console.warn(
      `[Download Page] Download result:`,
      download ? 'Found' : 'Not found'
    );

    if (!download) {
      console.warn(
        `[Download Page] Download not found for ${category}/${slug}`
      );
      // Instead of calling notFound() immediately, let's return a 404 page
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">
              Download not found: {category}/{slug}
            </p>
            <Link
              href="/downloads"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Downloads
            </Link>
          </div>
        </div>
      );
    }

    const acfData = download.acf || download.meta || {};

    // Get thumbnail - check ACF field first, then WordPress featured image
    let thumbnailUrl = '/images/placeholder.svg';
    if (acfData.download_thumbnail) {
      // ACF thumbnail field (returns media ID)
      const thumbId =
        typeof acfData.download_thumbnail === 'number'
          ? acfData.download_thumbnail
          : parseInt(acfData.download_thumbnail as string, 10);
      if (!isNaN(thumbId)) {
        const thumbMedia = await restAPIClient.getMediaById(thumbId);
        if (thumbMedia?.url) {
          thumbnailUrl = thumbMedia.url;
        }
      }
    } else if (download._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      thumbnailUrl = download._embedded['wp:featuredmedia'][0].source_url;
    }

    // Fetch related downloads from the same category
    const relatedDownloads =
      await restAPIClient.getDownloadsByCategory(category);
    const filteredRelatedDownloads = relatedDownloads
      .filter((relatedDownload) => relatedDownload.id !== download.id)
      .slice(0, 3); // Show up to 3 related downloads

    // Resolve thumbnails for related downloads
    const relatedWithThumbnails = await Promise.all(
      filteredRelatedDownloads.map(async (rd) => {
        const rdAcf = rd.acf || rd.meta || {};
        let thumb = '/images/placeholder.svg';
        if (rdAcf.download_thumbnail) {
          const thumbId =
            typeof rdAcf.download_thumbnail === 'number'
              ? rdAcf.download_thumbnail
              : parseInt(rdAcf.download_thumbnail as string, 10);
          if (!isNaN(thumbId)) {
            const media = await restAPIClient.getMediaById(thumbId);
            if (media?.url) thumb = media.url;
          }
        } else if (rd._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          thumb = rd._embedded['wp:featuredmedia'][0].source_url;
        }
        return { ...rd, resolvedThumbnail: thumb };
      })
    );

    // Get download URL - resolve ACF file ID to actual media URL
    let downloadUrl = '#';
    if (acfData.download_type === 'blog-post' && acfData.download_url) {
      downloadUrl = acfData.download_url;
    } else if (acfData.download_file) {
      // ACF returns file ID, resolve it to actual URL via Media API
      const fileId =
        typeof acfData.download_file === 'number'
          ? acfData.download_file
          : parseInt(acfData.download_file, 10);

      if (!isNaN(fileId)) {
        const media = await restAPIClient.getMediaById(fileId);
        if (media?.url) {
          downloadUrl = media.url;
        }
      }
    }

    // Generate structured data
    const downloadStructuredData = generateDownloadStructuredData({
      name: download.title.rendered,
      description:
        acfData.download_description || download.excerpt?.rendered || '',
      url: `https://cowboykimono.com/downloads/${category}/${slug}`,
      image: thumbnailUrl,
      fileFormat: acfData.download_format || 'PDF',
      fileSize: acfData.download_file_size,
      downloadUrl,
      category,
      difficulty: acfData.download_difficulty,
      timeEstimate: acfData.download_time_estimate,
      materialsNeeded: acfData.download_materials_needed,
    });

    const breadcrumbStructuredData = generateBreadcrumbStructuredData([
      { name: 'Home', url: 'https://cowboykimono.com' },
      { name: 'Downloads', url: 'https://cowboykimono.com/downloads' },
      {
        name: category.replace('-', ' '),
        url: `https://cowboykimono.com/downloads/${category}`,
      },
      {
        name: download.title.rendered,
        url: `https://cowboykimono.com/downloads/${category}/${slug}`,
      },
    ]);

    return (
      <div className="min-h-screen bg-[#f0f8ff] py-12">
        <StructuredData
          data={[downloadStructuredData, breadcrumbStructuredData]}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/downloads" className="hover:text-gray-700">
                  Downloads
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href={`/downloads/${category}`}
                  className="hover:text-gray-700 capitalize"
                >
                  {category.replace('-', ' ')}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900">{download.title.rendered}</li>
            </ol>

            {/* Back to Downloads Button */}
            <div className="mt-4">
              <Link
                href="/downloads"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Downloads
              </Link>
            </div>
          </nav>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Image Section */}
              <div className="md:w-1/2">
                <div className="relative h-64 md:h-full">
                  <Image
                    src={thumbnailUrl}
                    alt={download.title.rendered}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Content Section */}
              <div className="md:w-1/2 p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4 serif">
                    {download.title.rendered}
                  </h1>

                  {acfData.download_description && (
                    <p className="text-gray-600 mb-6">
                      {acfData.download_description}
                    </p>
                  )}
                </div>

                {/* File Information */}
                <div className="mb-6 space-y-3">
                  {acfData.download_file_size && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">
                        File Size:
                      </span>
                      <span className="text-sm text-gray-900">
                        {acfData.download_file_size}
                      </span>
                    </div>
                  )}

                  {acfData.download_format && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">
                        Format:
                      </span>
                      <span className="text-sm text-gray-900">
                        {acfData.download_format}
                      </span>
                    </div>
                  )}

                  {acfData.download_difficulty && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">
                        Difficulty:
                      </span>
                      <span className="text-sm text-gray-900">
                        {acfData.download_difficulty}
                      </span>
                    </div>
                  )}

                  {acfData.download_time_estimate && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-24">
                        Time:
                      </span>
                      <span className="text-sm text-gray-900">
                        {acfData.download_time_estimate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Materials Needed */}
                {acfData.download_materials_needed && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Materials Needed
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {acfData.download_materials_needed}
                    </p>
                  </div>
                )}

                {/* Download Button */}
                <div className="mb-6">
                  <a
                    href={downloadUrl}
                    download
                    className="inline-flex items-center px-6 py-3 bg-[#8B4513] text-white font-semibold rounded-lg hover:bg-[#A0522D] transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download {acfData.download_format || 'File'}
                  </a>
                </div>

                {/* Social Sharing */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Share this download
                  </h3>
                  <div className="flex space-x-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(download.title.rendered)}&url=${encodeURIComponent(`https://cowboykimono.com/downloads/${category}/${slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://cowboykimono.com/downloads/${category}/${slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a
                      href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(`https://cowboykimono.com/downloads/${category}/${slug}`)}&description=${encodeURIComponent(download.title.rendered)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Downloads */}
          {relatedWithThumbnails.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 serif">
                Related Downloads
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedWithThumbnails.map((relatedDownload) => {
                  const relatedAcfData =
                    relatedDownload.acf || relatedDownload.meta || {};
                  const relatedThumbnailUrl = relatedDownload.resolvedThumbnail;
                  const relatedSlug = relatedAcfData.download_slug || '';

                  return (
                    <div
                      key={relatedDownload.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="relative h-48">
                        <Image
                          src={relatedThumbnailUrl}
                          alt={relatedDownload.title.rendered}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedDownload.title.rendered}
                        </h3>
                        {relatedAcfData.download_description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {relatedAcfData.download_description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 capitalize">
                            {category.replace('-', ' ')}
                          </span>
                          {relatedSlug && (
                            <Link
                              href={`/downloads/${category}/${relatedSlug}`}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Download Tracker */}
        <DownloadTracker
          downloadId={`download-${download.id}`}
          category={category}
          slug={slug}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading download page:', error);
    notFound();
  }
}
