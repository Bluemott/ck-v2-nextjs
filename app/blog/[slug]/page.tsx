import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogSidebar from '../../components/BlogSidebar';
import StructuredData, { generateArticleStructuredData } from '../../components/StructuredData';
import { fetchPostBySlug, decodeHtmlEntities, getFeaturedImageUrl } from '../../lib/wordpress';
import WordPressImage from '../../components/WordPressImage';
import { generateSEOMetadata } from '../../lib/seo';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const title = decodeHtmlEntities(post.title.rendered);
  const description = post.excerpt.rendered.replace(/<[^>]+>/g, '').slice(0, 160);
  const image = getFeaturedImageUrl(post);
  
  return generateSEOMetadata({
    title,
    description,
    keywords: ['cowboy kimono blog', 'western fashion', 'handcraft stories', 'design inspiration'],
    canonical: `/blog/${slug}`,
    ogImage: image || undefined,
    ogType: 'article',
    publishedTime: post.date,
    modifiedTime: post.modified,
    author: 'Cowboy Kimono',
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  
  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Structured Data for Blog Article */}
      <StructuredData
        type="BlogPosting"
        data={generateArticleStructuredData({
          title: decodeHtmlEntities(post.title.rendered),
          description: post.content.rendered.replace(/<[^>]+>/g, '').slice(0, 160),
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com'}/blog/${post.slug}`,
          image: getFeaturedImageUrl(post) || undefined,
          datePublished: post.date,
          author: 'Cowboy Kimono',
        })}
      />
      
      {/* Main Article Content */}
      <article className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back to Blog Link */}
          <Link 
            href="/blog"
            className="text-[#1e2939] hover:text-[#2a3441] mb-6 inline-flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              {/* Featured Image */}
              <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden shadow-lg">
                <WordPressImage
                  post={post}
                  size="large"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>

              {/* Post Header */}
              <header className="mb-8">
                <h1 
                  className="text-4xl font-bold mb-4 text-gray-900 serif"
                  dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(post.title.rendered) }}
                />
                <p className="text-gray-600 font-medium">
                  Published on {formatDate(post.date)}
                </p>
              </header>

              {/* Post Content */}
              <div 
                className="prose prose-lg max-w-none mb-8"
                style={{
                  color: '#111827'
                }}
                dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(post.content.rendered) }}
              />

              {/* Back to Blog Link */}
              <div className="border-t pt-8">
                <Link 
                  href="/blog"
                  className="text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors"
                >
                  ← Back to all posts
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <BlogSidebar 
              currentPostId={post.id} 
              currentPostCategories={post.categories || []}
              currentPostTags={post.tags || []}
            />
          </div>
        </div>
      </article>
    </>
  );
}
