'use client';

import Image from 'next/image';
import { useState } from 'react';
import { trackDownload } from '../lib/analytics';
import DownloadCard from './components/DownloadCard';
import EmptyState from './components/EmptyState';
import FeaturedDownloads from './components/FeaturedDownloads';

interface DownloadThumbnail {
  id: string;
  title: string;
  thumbnail: string;
  downloadUrl: string;
  type?: string;
  format?: string;
  fileSize?: string;
  difficulty?: string;
  timeEstimate?: string;
  description?: string;
  category: string;
  slug: string;
}

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  image: string;
  thumbnails: DownloadThumbnail[];
}

const DownloadsClient = () => {
  const [dynamicThumbnails, setDynamicThumbnails] = useState<
    Record<string, DownloadThumbnail[]>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

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

  // Toggle category expansion - only allow one category to be expanded at a time
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        // If clicking the currently expanded category, close it
        next.delete(categoryId);
      } else {
        // If clicking a different category, close all others and open this one
        next.clear();
        next.add(categoryId);
        fetchDownloadsForCategory(categoryId);
      }
      return next;
    });
  };

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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch downloads');
      }

      // Extract thumbnails from the API response
      let thumbnails = [];

      if (data.success && data.downloads) {
        if (Array.isArray(data.downloads)) {
          const section = data.downloads.find(
            (section: { id: string }) => section.id === category
          );
          thumbnails = section?.thumbnails || [];
        } else if (
          data.downloads.thumbnails &&
          Array.isArray(data.downloads.thumbnails)
        ) {
          thumbnails = data.downloads.thumbnails;
        } else if (
          data.downloads.id === category &&
          data.downloads.thumbnails
        ) {
          thumbnails = data.downloads.thumbnails;
        }
      }

      if (!Array.isArray(thumbnails)) {
        thumbnails = [];
      }

      setDynamicThumbnails((prev) => ({ ...prev, [category]: thumbnails }));
    } catch (err) {
      console.error(`Error fetching downloads for ${category}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
      setDynamicThumbnails((prev) => ({ ...prev, [category]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  // Handle download tracking
  const handleDownload = async (downloadId: string, _title: string) => {
    try {
      await trackDownload(downloadId, {
        category: 'unknown',
        slug: 'unknown',
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  // Helper function to determine download type and button text
  // const _getDownloadInfo = (downloadUrl: string, downloadType?: string) => {
  //   if (!downloadUrl || typeof downloadUrl !== 'string') {
  //     return { type: 'unknown', text: 'Download' };
  //   }

  //   // Check if it's a blog post link
  //   if (downloadUrl.startsWith('/blog/') || downloadUrl.includes('/blog/')) {
  //     return { type: 'blog', text: 'Read Post' };
  //   }

  //   // Check if it's a PDF or file download
  //   if (
  //     downloadUrl.includes('.pdf') ||
  //     downloadUrl.includes('.doc') ||
  //     downloadUrl.includes('.docx') ||
  //     downloadUrl.includes('.zip') ||
  //     downloadUrl.includes('.rar') ||
  //     downloadType === 'pdf' ||
  //     downloadType === 'file'
  //   ) {
  //     return { type: 'file', text: 'Download' };
  //   }

  //   // Check if it's an external link
  //   if (
  //     downloadUrl.startsWith('http') &&
  //     !downloadUrl.includes('cowboykimono.com')
  //   ) {
  //     return { type: 'external', text: 'Visit Link' };
  //   }

  //   // Default to download
  //   return { type: 'download', text: 'Download' };
  // };

  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>

        {/* Featured Downloads */}
        <FeaturedDownloads onDownload={handleDownload} />

        {/* Section Divider */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#f0f8ff] px-6 text-gray-500 text-sm font-medium">
              Browse by Category
            </span>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {staticCards.map((section) => {
            const isExpanded = expandedCategories.has(section.id);
            const isLoading = loading[section.id];

            return (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
              >
                {/* Image Section */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ height: 300 }}
                >
                  <Image
                    src={section.image}
                    alt={`${section.title} preview`}
                    fill
                    className="object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                  />
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                </div>

                {/* Content Section */}
                <div className="p-6 lg:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#1e2939] transition-colors duration-300 serif">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed text-sm sm:text-base">
                    {section.description}
                  </p>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleCategory(section.id)}
                    className="w-full bg-[#1e2939] hover:bg-[#2a3441] text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group/btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {isExpanded ? 'Hide Downloads' : 'Show Downloads'}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Downloads Section - Full Width Below Cards */}
        {Array.from(expandedCategories).map((categoryId) => {
          const section = staticCards.find((s) => s.id === categoryId);
          const thumbnails = dynamicThumbnails[categoryId];
          const isLoading = loading[categoryId];
          const hasDownloads = (thumbnails?.length ?? 0) > 0;

          if (!section) return null;

          return (
            <div key={categoryId} className="mb-12">
              <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 serif">
                    {section.title} Downloads
                  </h2>
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {isLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-200 rounded-xl h-64 animate-pulse"
                      ></div>
                    ))}
                  </div>
                )}

                {!isLoading && hasDownloads && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {thumbnails?.map((item) => (
                      <DownloadCard
                        key={item.id}
                        {...item}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && !hasDownloads && (
                  <EmptyState
                    title="No Downloads Available"
                    description={`There are currently no downloads available for ${section.title.toLowerCase()}.`}
                    actionText="Refresh"
                    onAction={() => fetchDownloadsForCategory(categoryId)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DownloadsClient;
