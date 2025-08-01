import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogSidebar from '../../components/BlogSidebar';
import StructuredData, { generateArticleStructuredData } from '../../components/StructuredData';
import { fetchPostBySlug, decodeHtmlEntities, getFeaturedImageUrl, getPostCategories, getPostTags } from '../../lib/api';
import WordPressImage from '../../components/WordPressImage';
import { generateSEOMetadata } from '../../lib/seo';
import Breadcrumbs from '../../components/Breadcrumbs';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  
  if (!post || post.status !== 'publish') {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
      robots: {
        index: false,
        follow: false,
      },
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

export async function generateStaticParams() {
  // Generate static paths for existing blog posts
  try {
    const { fetchPosts } = await import('../../lib/api');
    const posts = await fetchPosts({ per_page: 100 });
    
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  
  if (!post || post.status !== 'publish') {
    notFound();
  }

  // Get categories and tags from the post data
  const categories = getPostCategories(post);
  const tags = getPostTags(post);

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
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cowboykimono.com'}/blog/${post.slug}`,
          image: getFeaturedImageUrl(post) || undefined,
          datePublished: post.date,
          author: 'Cowboy Kimono',
        })}
      />
      
      {/* Main Article Content */}
      <article className="min-h-screen bg-[#f0f8ff] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
                        <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Blog', href: '/blog' },
                  { label: decodeHtmlEntities(post.title.rendered) }
                ]}
              />

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              {/* Featured Image */}
              <div className="w-full mb-10">
                <WordPressImage
                  post={post}
                  size="large"
                  className="w-full h-auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
                  priority
                  objectFit="none"
                />
              </div>

                             {/* Post Header */}
               <header className="mb-10">
                 <h1 
                   className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 serif leading-tight"
                   dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(post.title.rendered) }}
                 />
                 <div className="flex items-center space-x-4 text-gray-600 font-medium mb-6">
                   <span>Published on {formatDate(post.date)}</span>
                 </div>
                 
                 {/* Post Categories and Tags */}
                 {(categories.length > 0 || tags.length > 0) && (
                   <div className="flex flex-col sm:flex-row gap-4">
                     {categories.length > 0 && (
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-gray-500">In:</span>
                         <div className="flex flex-wrap gap-2">
                           {categories.filter(Boolean).map((category) => (
                             <Link
                               key={category!.id}
                               href={`/blog/category/${category!.slug}`}
                               className="px-3 py-1 bg-[#1e2939] text-white rounded-full text-xs font-medium hover:bg-[#2a3441] transition-all duration-300 hover:shadow-md"
                             >
                               {decodeHtmlEntities(category!.name)}
                             </Link>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     {tags.length > 0 && (
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-gray-500">Tagged:</span>
                         <div className="flex flex-wrap gap-2">
                           {tags.filter(Boolean).map((tag) => (
                             <Link
                               key={tag!.id}
                               href={`/blog/tag/${tag!.slug}`}
                               className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 hover:shadow-md"
                             >
                               {decodeHtmlEntities(tag!.name)}
                             </Link>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </header>

              {/* Post Content */}
              <div 
                className="prose prose-lg md:prose-xl max-w-none mb-12 leading-relaxed"
                style={{
                  color: '#111827',
                  fontSize: '1.125rem',
                  lineHeight: '1.75'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: decodeHtmlEntities(post.content.rendered)
                }}
                // Add security attributes for content
                suppressHydrationWarning={true}
              />


             </div>

            {/* Sidebar - Simplified */}
            <div className="w-full lg:w-80 lg:sticky lg:top-8 lg:self-start">
              <BlogSidebar 
                currentPost={post}
                currentPostCategories={categories.map(cat => cat.id)}
                currentPostTags={tags.map(tag => tag.id)}
                showRecentPosts={false}
                showCategories={false}
                showTags={false}
              />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
