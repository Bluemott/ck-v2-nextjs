import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StructuredData, {
  generateBreadcrumbStructuredData,
} from '../../components/StructuredData';
import { restAPIClient } from '../../lib/rest-api';
import { generateSEOMetadata } from '../../lib/seo';
import DownloadCard from '../components/DownloadCard';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

// Valid categories
const VALID_CATEGORIES = ['coloring-pages', 'craft-templates', 'diy-tutorials'];

// Category configuration
const CATEGORY_CONFIG = {
  'coloring-pages': {
    title: 'Coloring Pages',
    description:
      'Free printable coloring pages featuring western themes, cowboys, and desert landscapes.',
    image: '/images/Neon_Coloring_Mock.webp',
    seoTitle: 'Free Coloring Pages - Cowboy Kimono',
    seoDescription:
      'Download free western-themed coloring pages. Perfect for relaxation and creativity with cowboy and desert designs.',
  },
  'craft-templates': {
    title: 'Craft Templates',
    description:
      'DIY craft templates and patterns for creating western-inspired decorations and gifts.',
    image: '/images/CKCraft_Template2.webp',
    seoTitle: 'Free Craft Templates - Cowboy Kimono',
    seoDescription:
      'Get free DIY craft templates and patterns for western-inspired decorations and handmade gifts.',
  },
  'diy-tutorials': {
    title: 'DIY Tutorials',
    description:
      'Comprehensive guides on caring for your handcrafted pieces and styling tips for different occasions.',
    image: '/images/Jumbo_Milagro.webp',
    seoTitle: 'DIY Tutorials & Guides - Cowboy Kimono',
    seoDescription:
      'Learn with our comprehensive DIY tutorials for caring and styling your western fashion pieces.',
  },
};

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({
    category,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = params;

  if (!VALID_CATEGORIES.includes(category)) {
    return generateSEOMetadata({
      title: 'Category Not Found',
      description: 'The requested download category could not be found.',
      canonical: `/downloads/${category}`,
    });
  }

  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

  return generateSEOMetadata({
    title: config.seoTitle,
    description: config.seoDescription,
    keywords: [
      category.replace('-', ' '),
      'downloads',
      'free',
      'cowboy kimono',
      'western',
    ],
    canonical: `/downloads/${category}`,
    ogImage: config.image,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params;

  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

  try {
    // Fetch downloads for this category
    const downloads = await restAPIClient.getDownloadsByCategory(category);

    // Debug: Log the raw downloads to see what we're getting
    console.warn(
      `[Category Page] Fetched ${downloads.length} downloads for category: ${category}`
    );
    downloads.forEach((download, index) => {
      const acfData = download.acf || download.meta || {};
      console.warn(`[Category Page] Download ${index + 1}:`, {
        id: download.id,
        title: download.title.rendered,
        category: acfData.download_category,
        expectedCategory: category,
      });
    });

    // Filter downloads to ensure they match the requested category
    const filteredDownloads = downloads.filter((download) => {
      const acfData = download.acf || download.meta || {};
      const downloadCategory = acfData.download_category;
      const matches = downloadCategory === category;

      if (!matches) {
        console.warn(
          `[Category Page] Filtering out download "${download.title.rendered}" - category "${downloadCategory}" doesn't match "${category}"`
        );
      }

      return matches;
    });

    console.warn(
      `[Category Page] After filtering: ${filteredDownloads.length} downloads match category "${category}"`
    );

    // Transform downloads to match DownloadCard props
    const transformedDownloads = filteredDownloads.map((download) => {
      const acfData = download.acf || download.meta || {};
      const thumbnailUrl =
        download._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
        '/images/placeholder.svg';

      // Get download URL
      let downloadUrl = '#';
      if (acfData.download_type === 'blog-post' && acfData.download_url) {
        downloadUrl = acfData.download_url;
      } else if (acfData.download_file) {
        downloadUrl = `https://api.cowboykimono.com/wp-content/uploads/2025/10/media-${acfData.download_file}.pdf`;
      }

      return {
        id: `download-${download.id}`,
        title: download.title.rendered,
        thumbnail: thumbnailUrl,
        downloadUrl,
        description:
          acfData.download_description || download.excerpt?.rendered || '',
        type: acfData.download_type || 'pdf',
        format: acfData.download_format || '',
        fileSize: acfData.download_file_size || '',
        difficulty: acfData.download_difficulty || '',
        timeEstimate: acfData.download_time_estimate || '',
        category: acfData.download_category || category,
        slug: acfData.download_slug || '',
      };
    });

    // Generate structured data
    const breadcrumbStructuredData = generateBreadcrumbStructuredData([
      { name: 'Home', url: 'https://cowboykimono.com' },
      { name: 'Downloads', url: 'https://cowboykimono.com/downloads' },
      {
        name: config.title,
        url: `https://cowboykimono.com/downloads/${category}`,
      },
    ]);

    return (
      <div className="min-h-screen bg-[#f0f8ff] py-12">
        <StructuredData data={[breadcrumbStructuredData]} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
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
              <li className="text-gray-900">{config.title}</li>
            </ol>
          </nav>

          {/* Category Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Image
                src={config.image}
                alt={`${config.title} preview`}
                width={400}
                height={200}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 serif">
              {config.title}
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              {config.description}
            </p>
          </div>

          {/* Downloads Grid */}
          {transformedDownloads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transformedDownloads.map((download) => (
                <DownloadCard key={download.id} {...download} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Downloads Available
                </h3>
                <p className="text-gray-600 mb-6">
                  There are currently no downloads available for{' '}
                  {config.title.toLowerCase()}.
                </p>
                <Link
                  href="/downloads"
                  className="inline-flex items-center px-6 py-3 bg-[#1e2939] text-white font-medium rounded-lg hover:bg-[#2a3441] transition-colors"
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
                  Back to All Downloads
                </Link>
              </div>
            </div>
          )}

          {/* Back to Downloads */}
          <div className="mt-12 text-center">
            <Link
              href="/downloads"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
              Back to All Downloads
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading category page:', error);
    notFound();
  }
}
