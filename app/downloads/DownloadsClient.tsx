'use client';

import Image from 'next/image';
import { useState } from 'react';

interface DownloadThumbnail {
  id: string;
  title: string;
  thumbnail: string;
  downloadUrl: string;
  type?: string;
}

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  image: string;
  thumbnails: DownloadThumbnail[];
}

const DownloadsClient = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [dynamicThumbnails, setDynamicThumbnails] = useState<
    Record<string, DownloadThumbnail[]>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Static card configuration (keeping the beautiful design)
  const staticCards: DownloadItem[] = [
    {
      id: 'coloring-pages',
      title: 'Coloring Pages',
      description:
        'Free downloadable coloring pages for creating your own western-inspired garments. Includes detailed instructions and sizing guides.',
      image: '/images/Neon_Coloring_Mock.webp',
      thumbnails: [], // Will be populated from API
    },
    {
      id: 'craft-templates',
      title: 'Craft Templates',
      description:
        'Artistic templates and stencils for painting and decorating your own cowboy kimonos. Perfect for customization projects.',
      image: '/images/CKCraft_Template2.webp',
      thumbnails: [], // Will be populated from API
    },
    {
      id: 'diy-tutorials',
      title: 'DIY Tutorials',
      description:
        'Comprehensive guides on caring for your handcrafted pieces and styling tips for different occasions.',
      image: '/images/Jumbo_Milagro.webp',
      thumbnails: [], // Will be populated from API
    },
  ];

  // Fetch downloads for a specific category
  const fetchDownloadsForCategory = async (category: string) => {
    if (dynamicThumbnails[category] || loading[category]) {
      return; // Already loaded or loading
    }

    setLoading((prev) => ({ ...prev, [category]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/downloads?category=${category}`);
      const data = await response.json();

      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`API response for ${category}:`, data);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch downloads');
      }

      // Extract thumbnails from the API response
      let thumbnails = [];

      if (data.downloads && Array.isArray(data.downloads)) {
        // If downloads is an array of sections
        const section = data.downloads.find(
          (section: { id: string }) => section.id === category
        );
        thumbnails = section?.thumbnails || [];
      } else if (data.downloads && Array.isArray(data.downloads.thumbnails)) {
        // If downloads has thumbnails directly
        thumbnails = data.downloads.thumbnails;
      }

      // Ensure thumbnails is an array
      if (!Array.isArray(thumbnails)) {
        thumbnails = [];
      }

      setDynamicThumbnails((prev) => ({ ...prev, [category]: thumbnails }));
    } catch (err) {
      console.error(`Error fetching downloads for ${category}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load downloads');

      // Set empty array on error - no fallback to local files
      setDynamicThumbnails((prev) => ({
        ...prev,
        [category]: [],
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  // No fallback - WordPress API only

  const toggleCard = (cardId: string) => {
    if (expandedCard === cardId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(cardId);
      // Fetch downloads when expanding a card
      fetchDownloadsForCategory(cardId);
    }
  };

  // Helper function to determine download type and button text
  const getDownloadInfo = (downloadUrl: string, downloadType?: string) => {
    if (!downloadUrl || typeof downloadUrl !== 'string') {
      return { type: 'unknown', text: 'Download' };
    }

    // Check if it's a blog post link
    if (downloadUrl.startsWith('/blog/') || downloadUrl.includes('/blog/')) {
      return { type: 'blog', text: 'Read Post' };
    }

    // Check if it's a PDF or file download
    if (
      downloadUrl.includes('.pdf') ||
      downloadUrl.includes('.doc') ||
      downloadUrl.includes('.docx') ||
      downloadUrl.includes('.zip') ||
      downloadUrl.includes('.rar') ||
      downloadType === 'pdf' ||
      downloadType === 'file'
    ) {
      return { type: 'file', text: 'Download' };
    }

    // Check if it's an external link
    if (
      downloadUrl.startsWith('http') &&
      !downloadUrl.includes('cowboykimono.com')
    ) {
      return { type: 'external', text: 'Visit Link' };
    }

    // Default to download
    return { type: 'download', text: 'Download' };
  };

  const handleDownload = (downloadUrl: string, title: string) => {
    // Ensure downloadUrl is a string
    if (!downloadUrl || typeof downloadUrl !== 'string') {
      console.error('Invalid download URL:', downloadUrl);
      return;
    }

    const downloadInfo = getDownloadInfo(downloadUrl);

    // Check if it's a blog post link or actual download
    if (downloadInfo.type === 'blog') {
      // Navigate to blog post
      window.location.href = downloadUrl;
    } else {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/CK_Logo_Titles_Take-And-Make.webp"
              alt="Take & Make"
              width={400}
              height={100}
              className="max-w-full h-auto"
            />
          </div>
          <p className="text-gray-600 text-lg">
            Free resources, patterns, and guides to enhance your cowboy kimono
            experience
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {staticCards.length} categories available • Click cards to explore
            downloads
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {staticCards.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Main Card with Image and Overlay - Square Aspect Ratio */}
              <div
                className="cursor-pointer relative w-full overflow-hidden group"
                style={{ width: '100%', height: 300, background: '#eee' }}
                onClick={() => toggleCard(section.id)}
              >
                <Image
                  src={section.image}
                  alt={`${section.title} preview`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                  onError={(e) => {
                    console.error('Image failed to load:', section.image);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Dark Overlay - Only visible on hover */}
                <div
                  className="absolute inset-0 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{ background: 'rgba(0,0,0,0.35)', zIndex: 5 }}
                />
                {/* Text Content Overlay - Only visible on hover */}
                <div
                  className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ zIndex: 10 }}
                >
                  {/* Add a semi-transparent background behind the text for readability */}
                  <div
                    className="inline-block px-6 py-4 rounded-lg text-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg text-center serif">
                      {section.title}
                    </h2>
                    <p className="text-white text-sm leading-relaxed mb-4 drop-shadow-md line-clamp-3 text-center">
                      {section.description}
                    </p>
                    <div className="flex flex-col items-center text-white">
                      <span className="font-medium mr-2 drop-shadow-md text-center">
                        View Items
                      </span>
                      <span className="transform transition-transform duration-300 drop-shadow-md text-center">
                        ↓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Content - Full Width Below Cards */}
        {expandedCard && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 serif">
                {
                  staticCards.find((section) => section.id === expandedCard)
                    ?.title
                }
              </h3>
              <button
                onClick={() => setExpandedCard(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Loading State */}
            {loading[expandedCard] && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e2939] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading downloads...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading[expandedCard] && (
              <div className="text-center py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    Using fallback content. WordPress integration not available.
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic Content */}
            {!loading[expandedCard] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(dynamicThumbnails[expandedCard] || [])
                  .filter(
                    (item) =>
                      item && typeof item === 'object' && item.id && item.title
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center"
                    >
                      {/* Thumbnail Image */}
                      <div className="aspect-square relative w-full">
                        {item.thumbnail &&
                        item.thumbnail !== '' &&
                        item.thumbnail !== '#' ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title || 'Download'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                            onError={(e) => {
                              console.error(
                                'Thumbnail failed to load:',
                                item.thumbnail
                              );
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Download Info */}
                      <div className="p-4 flex flex-col items-center text-center w-full">
                        <h4 className="font-semibold text-gray-800 mb-2 text-center text-sm line-clamp-2 w-full">
                          {item.title || 'Untitled Download'}
                        </h4>
                        {item.downloadUrl &&
                        item.downloadUrl !== '' &&
                        item.downloadUrl !== '#' ? (
                          (() => {
                            const downloadInfo = getDownloadInfo(
                              item.downloadUrl,
                              item.type
                            );
                            return (
                              <button
                                onClick={() =>
                                  handleDownload(
                                    item.downloadUrl,
                                    item.title || 'Download'
                                  )
                                }
                                className={`px-4 py-2 rounded-md transition-colors font-medium flex items-center justify-center text-sm w-full max-w-[180px] bg-[#1e2939] hover:bg-[#2a3441] text-white`}
                              >
                                {downloadInfo.text}
                              </button>
                            );
                          })()
                        ) : (
                          <div className="px-4 py-2 rounded-md bg-gray-300 text-gray-600 text-sm text-center w-full max-w-[180px]">
                            Coming Soon
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsClient;
