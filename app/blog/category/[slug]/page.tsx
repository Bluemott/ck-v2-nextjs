import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchCategories } from '../../../lib/wordpress';
import { generateSEOMetadata } from '../../../lib/seo';
import { decodeHtmlEntities } from '../../../lib/wordpress';
import BlogClient from '../../BlogClient';
import Breadcrumbs from '../../../components/Breadcrumbs';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const categories = await fetchCategories();
    const category = categories.find(cat => cat.slug === slug);
    
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
    const categories = await fetchCategories();
    const category = categories.find(cat => cat.slug === slug);
    
    if (!category) {
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
          <BlogClient initialCategory={category.id} showHeader={false} />

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