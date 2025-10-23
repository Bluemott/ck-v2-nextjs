import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { decodeHtmlEntities, fetchTagBySlug } from '../../../lib/api';
import { generateSEOMetadata } from '../../../lib/seo';
import BlogClient from '../../BlogClient';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const tag = await fetchTagBySlug(slug);

    if (!tag) {
      return generateSEOMetadata({
        title: 'Tag Not Found',
        description: 'The requested tag could not be found.',
      });
    }

    return generateSEOMetadata({
      title: `${decodeHtmlEntities(tag.name)} Posts`,
      description: `Browse all posts tagged with ${decodeHtmlEntities(tag.name)}. Discover stories, inspiration, and insights from Cowboy Kimono.`,
      keywords: [
        decodeHtmlEntities(tag.name),
        'cowboy kimono blog',
        'western fashion',
        'handcraft stories',
      ],
      canonical: `/blog/tag/${slug}`,
    });
  } catch {
    return generateSEOMetadata({
      title: 'Tag',
      description: 'Browse posts by tag.',
    });
  }
}

export async function generateStaticParams() {
  try {
    const { fetchTags } = await import('../../../lib/api');
    const tags = await fetchTags();

    return tags
      .filter((tag) => tag && tag.count > 0)
      .map((tag) => ({
        slug: tag.slug,
      }));
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    return [];
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;

  try {
    const tag = await fetchTagBySlug(slug);

    if (!tag) {
      notFound();
    }

    // Check if the tag has any posts
    if (tag.count === 0) {
      return (
        <div className="min-h-screen bg-[#f0f8ff] py-12">
          <div className="max-w-7xl mx-auto px-8">
            {/* Breadcrumbs */}
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog' },
                { label: decodeHtmlEntities(tag.name) },
              ]}
            />

            {/* Tag Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-gray-900 serif">
                Posts tagged: {decodeHtmlEntities(tag.name)}
              </h1>
              {tag.description && (
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  {decodeHtmlEntities(tag.description)}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                No posts found with this tag
              </p>
            </div>

            {/* Empty State */}
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
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
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-500 mb-6">
                  There are currently no posts tagged with &ldquo;
                  {decodeHtmlEntities(tag.name)}&rdquo;. Check back later for
                  new content!
                </p>
                <Link
                  href="/blog"
                  className="inline-flex items-center px-4 py-2 bg-[#1e2939] text-white rounded-md hover:bg-[#2a3441] transition-colors"
                >
                  ← Back to all posts
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f0f8ff] py-12">
        <div className="max-w-7xl mx-auto px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: decodeHtmlEntities(tag.name) },
            ]}
          />

          {/* Tag Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 serif">
              Posts tagged: {decodeHtmlEntities(tag.name)}
            </h1>
            {tag.description && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {decodeHtmlEntities(tag.description)}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Browse all posts with this tag
            </p>
          </div>

          {/* Blog Posts Grid */}
          <BlogClient
            initialTag={tag.slug}
            initialTagData={tag}
            showHeader={false}
          />

          {/* Back to Blog Link */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-flex items-center text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors"
            >
              ← Back to all posts
            </Link>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
