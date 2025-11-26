import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '../../../components/Breadcrumbs';
import {
  decodeHtmlEntities,
  fetchPosts,
  fetchTagBySlug,
} from '../../../lib/api';
import { generateSEOMetadata } from '../../../lib/seo';
import BlogClient from '../../BlogClient';

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

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
        description:
          'The requested tag could not be found. Browse our latest blog posts instead.',
      });
    }

    // Use WordPress description if available, otherwise generate one
    const description = tag.description
      ? decodeHtmlEntities(tag.description)
      : `Browse all posts tagged with ${decodeHtmlEntities(tag.name)}. Discover stories, inspiration, and insights from Cowboy Kimono.`;

    return generateSEOMetadata({
      title: `${decodeHtmlEntities(tag.name)} Posts`,
      description,
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

    // Generate pages for all tags, not just those with posts
    return tags
      .filter((tag) => tag && tag.slug)
      .map((tag) => ({
        slug: tag.slug,
      }));
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    return [];
  }
}

// Allow dynamic paths for tags not pre-built
export const dynamicParams = true;
export const revalidate = 3600; // Revalidate every hour

// Fallback component for missing or empty tags
async function TagFallback({ tagName }: { tagName?: string }) {
  // Fetch recent posts to show as recommendations
  let recentPosts: Awaited<ReturnType<typeof fetchPosts>> = [];
  try {
    recentPosts = await fetchPosts({ per_page: 6 });
  } catch {
    // Silently fail - we'll show an empty state
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-7xl mx-auto px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: tagName || 'Tag' },
          ]}
        />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 serif">
            {tagName ? `Posts tagged: ${tagName}` : 'Tag Not Found'}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {tagName
              ? `There are currently no posts tagged with "${tagName}".`
              : 'The requested tag could not be found.'}
          </p>
        </div>

        {/* Recommended Posts Section */}
        {recentPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center serif">
              Recommended Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => {
                const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
                const title = typeof post.title === 'object' ? post.title.rendered : post.title;
                const excerpt = typeof post.excerpt === 'object' ? post.excerpt.rendered : post.excerpt;
                
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {featuredMedia?.source_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={featuredMedia.source_url}
                          alt={featuredMedia.alt_text || title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {title}
                      </h3>
                      {excerpt && (
                        <p
                          className="text-gray-600 text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: excerpt }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-[#1e2939] text-white rounded-md hover:bg-[#2a3441] transition-colors"
          >
            ← Browse All Posts
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;

  try {
    const tag = await fetchTagBySlug(slug);

    // Tag not found - show fallback with recommendations
    if (!tag) {
      return <TagFallback />;
    }

    // Tag exists but has no posts - show fallback with tag name
    if (tag.count === 0) {
      return <TagFallback tagName={decodeHtmlEntities(tag.name)} />;
    }

    // Tag exists with posts - show normal tag page
    return (
      <div className="min-h-screen bg-[#f0f8ff] py-12">
        <div className="max-w-7xl mx-auto px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: decodeHtmlEntities(tag.name) },
            ]}
          />

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
              {tag.count} {tag.count === 1 ? 'post' : 'posts'} with this tag
            </p>
          </div>

          <BlogClient
            initialTag={tag.slug}
            initialTagData={tag}
            showHeader={false}
          />

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
    // On any error, show fallback instead of 404
    return <TagFallback />;
  }
}
