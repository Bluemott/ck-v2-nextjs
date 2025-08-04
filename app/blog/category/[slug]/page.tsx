import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchCategoryBySlug, decodeHtmlEntities } from '../../../lib/api';
import { generateSEOMetadata } from '../../../lib/seo';
import BlogClient from '../../BlogClient';
import Breadcrumbs from '../../../components/Breadcrumbs';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const category = await fetchCategoryBySlug(slug);
    
    if (!category) {
      return generateSEOMetadata({
        title: 'Category Not Found',
        description: 'The requested category could not be found.',
      });
    }

    return generateSEOMetadata({
      title: `${decodeHtmlEntities(category.name)} Posts`,
      description: `Browse all posts in the ${decodeHtmlEntities(category.name)} category. Discover stories, inspiration, and insights from Cowboy Kimono.`,
      keywords: [decodeHtmlEntities(category.name), 'cowboy kimono blog', 'western fashion', 'handcraft stories'],
      canonical: `/blog/category/${slug}`,
    });
  } catch {
    return generateSEOMetadata({
      title: 'Category',
      description: 'Browse posts by category.',
    });
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  try {
    const category = await fetchCategoryBySlug(slug);
    
    if (!category) {
      notFound();
    }

    // Check if the category has any posts
    if (category.count === 0) {
      return (
        <div className="min-h-screen bg-[#f0f8ff] py-12">
          <div className="max-w-7xl mx-auto px-8">
            {/* Breadcrumbs */}
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog' },
                { label: decodeHtmlEntities(category.name) }
              ]}
            />

            {/* Category Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-gray-900 serif">
                {decodeHtmlEntities(category.name)}
              </h1>
              {category.description && (
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  {decodeHtmlEntities(category.description)}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                No posts found in this category
              </p>
            </div>

            {/* Empty State */}
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-500 mb-6">
                  There are currently no posts in the &ldquo;{decodeHtmlEntities(category.name)}&rdquo; category. Check back later for new content!
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
              { label: decodeHtmlEntities(category.name) }
            ]}
          />

          {/* Category Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 serif">
              {decodeHtmlEntities(category.name)}
            </h1>
            {category.description && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {decodeHtmlEntities(category.description)}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Browse all posts in this category
            </p>
          </div>

          {/* Blog Posts Grid */}
          <BlogClient initialCategory={category.slug} showHeader={false} />

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