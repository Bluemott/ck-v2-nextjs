import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchTags } from '../../../lib/wordpress';
import { generateSEOMetadata } from '../../../lib/seo';
import { decodeHtmlEntities } from '../../../lib/wordpress';
import BlogClient from '../../BlogClient';
import Breadcrumbs from '../../../components/Breadcrumbs';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const tags = await fetchTags();
    const tag = tags.find(t => t.slug === slug);
    
    if (!tag) {
      return generateSEOMetadata({
        title: 'Tag Not Found',
        description: 'The requested tag could not be found.',
      });
    }

    return generateSEOMetadata({
      title: `${decodeHtmlEntities(tag.name)} Posts`,
      description: `Browse all posts tagged with ${decodeHtmlEntities(tag.name)}. Discover stories, inspiration, and insights from Cowboy Kimono.`,
      keywords: [decodeHtmlEntities(tag.name), 'cowboy kimono blog', 'western fashion', 'handcraft stories'],
      canonical: `/blog/tag/${slug}`,
    });
  } catch {
    return generateSEOMetadata({
      title: 'Tag',
      description: 'Browse posts by tag.',
    });
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  
  try {
    const tags = await fetchTags();
    const tag = tags.find(t => t.slug === slug);
    
    if (!tag) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-[#f0f8ff] py-12">
        <div className="max-w-7xl mx-auto px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: decodeHtmlEntities(tag.name) }
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
          <BlogClient initialTag={tag.id} showHeader={false} />

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