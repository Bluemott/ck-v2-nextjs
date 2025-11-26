import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogPostFooter from '../../components/BlogPostFooter';
import BlogSidebar from '../../components/BlogSidebar';
import Breadcrumbs from '../../components/Breadcrumbs';
import StructuredData, {
  generateArticleStructuredData,
  generateBreadcrumbStructuredData,
} from '../../components/StructuredData';
import WordPressImage from '../../components/WordPressImage';
import {
  decodeHtmlEntities,
  fetchPostBySlug,
  fetchPosts,
  getFeaturedImageUrl,
  getPostCategories,
  getPostTags,
  processExcerpt,
} from '../../lib/api';
import { env } from '../../lib/env';
import { generateSEOMetadata } from '../../lib/seo';

// ISR: Revalidate every 60 seconds for fresher content, or on-demand via webhook
export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
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
  const description = processExcerpt(post.excerpt, 160);
  const image = getFeaturedImageUrl(post);

  // Extract Yoast SEO data from the WordPress API response
  const yoastSEO = post.yoast_head_json
    ? {
        title: post.yoast_head_json.title,
        metaDesc: post.yoast_head_json.description,
        canonical: post.yoast_head_json.canonical,
        opengraphTitle: post.yoast_head_json.og_title,
        opengraphDescription: post.yoast_head_json.og_description,
        opengraphImage: post.yoast_head_json.og_image?.[0]?.url,
        twitterTitle: post.yoast_head_json.twitter_title,
        twitterDescription: post.yoast_head_json.twitter_description,
        twitterImage: post.yoast_head_json.twitter_image,
        focuskw: '', // Yoast focus keyword not available in head_json
        metaKeywords: '', // Yoast meta keywords not available in head_json
        metaRobotsNoindex:
          post.yoast_head_json.robots?.index === 'noindex' ? '1' : '0',
        metaRobotsNofollow:
          post.yoast_head_json.robots?.follow === 'nofollow' ? '1' : '0',
        opengraphType: post.yoast_head_json.og_type,
        opengraphUrl: post.yoast_head_json.og_url,
        opengraphSiteName: post.yoast_head_json.og_site_name,
        opengraphAuthor: post.yoast_head_json.author,
        opengraphPublishedTime: post.yoast_head_json.article_published_time,
        opengraphModifiedTime: post.yoast_head_json.article_modified_time,
        schema: post.yoast_head_json.schema
          ? JSON.stringify(post.yoast_head_json.schema)
          : undefined,
      }
    : undefined;

  return generateSEOMetadata({
    title,
    description,
    keywords: [
      'cowboy kimono blog',
      'western fashion',
      'handcraft stories',
      'design inspiration',
    ],
    canonical: `/blog/${slug}`,
    ogImage: image || undefined,
    ogType: 'article',
    publishedTime: post.date,
    modifiedTime: post.modified,
    author: 'Cowboy Kimono',
    yoastSEO,
  });
}

export async function generateStaticParams() {
  // Generate static paths for existing blog posts
  try {
    const { fetchPosts } = await import('../../lib/api');
    // Increased to match sitemap coverage for better indexation
    // The build-time cache will share data with sitemap generation
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

  // Fetch related posts for navigation
  const allPosts = await fetchPosts({ per_page: 100 });
  const currentPostIndex = allPosts.findIndex((p) => p.id === post.id);
  const previousPost =
    currentPostIndex > 0 ? allPosts[currentPostIndex - 1] : null;
  const nextPost =
    currentPostIndex < allPosts.length - 1
      ? allPosts[currentPostIndex + 1]
      : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Structured Data for Blog Article */}
      <StructuredData
        data={generateArticleStructuredData({
          title: decodeHtmlEntities(post.title.rendered),
          description: post.content.rendered
            .replace(/<[^>]+>/g, '')
            .slice(0, 160),
          url: `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
          image: getFeaturedImageUrl(post) || '',
          datePublished: post.date,
          dateModified: post.modified,
          author: 'Cowboy Kimono',
          category: 'Blog',
          tags: [],
        })}
      />

      {/* Structured Data for Breadcrumbs */}
      <StructuredData
        data={generateBreadcrumbStructuredData([
          { name: 'Home', url: env.NEXT_PUBLIC_SITE_URL },
          { name: 'Blog', url: `${env.NEXT_PUBLIC_SITE_URL}/blog` },
          {
            name: decodeHtmlEntities(post.title.rendered),
            url: `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
          },
        ])}
      />

      {/* Main Article Content */}
      <article className="min-h-screen bg-[#f0f8ff] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: decodeHtmlEntities(post.title.rendered) },
            ]}
          />

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              {/* Hero Image - Enhanced */}
              <div className="w-full mb-8">
                <WordPressImage
                  post={post}
                  size="large"
                  className="w-full h-auto rounded-lg shadow-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 70vw"
                  priority
                  objectFit="cover"
                />
              </div>
              {/* Post Header */}
              <header className="mb-10">
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 serif leading-tight"
                  dangerouslySetInnerHTML={{
                    __html: decodeHtmlEntities(post.title.rendered),
                  }}
                />
                <div className="flex items-center space-x-4 text-gray-600 font-medium mb-6">
                  <span>Published on {formatDate(post.date)}</span>
                </div>

                {/* Post Categories and Tags */}
                {(categories.length > 0 || tags.length > 0) && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {categories.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          In:
                        </span>
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
                        <span className="text-sm font-medium text-gray-500">
                          Tagged:
                        </span>
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
                  lineHeight: '1.75',
                }}
                dangerouslySetInnerHTML={{
                  __html: decodeHtmlEntities(post.content.rendered),
                }}
                // Add security attributes for content
                suppressHydrationWarning={true}
              />

              {/* Blog Post Footer */}
              <BlogPostFooter
                postTitle={decodeHtmlEntities(post.title.rendered)}
                postUrl={`${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`}
                currentPostSlug={post.slug}
                previousPost={previousPost}
                nextPost={nextPost}
              />
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 lg:sticky lg:top-24 lg:self-start">
              <BlogSidebar
                currentPost={post}
                currentPostCategories={categories.map((cat) => cat.id)}
                currentPostTags={tags.map((tag) => tag.id)}
                showRecentPosts={false}
                showCategories={true}
                showTags={true}
              />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
