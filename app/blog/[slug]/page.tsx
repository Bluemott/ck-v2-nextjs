'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BlogSidebar from '../../components/BlogSidebar';
import StructuredData, { generateArticleStructuredData } from '../../components/StructuredData';
import { fetchPostBySlug, type WordPressPost } from '../../lib/wordpress';

const BlogPostPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<WordPressPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const fetchedPost = await fetchPostBySlug(slug);
        if (!fetchedPost) {
          throw new Error('Post not found');
        }
        setPost(fetchedPost);
      } catch (err) {
        setError('Failed to load blog post. Please try again later.');
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
          <Link 
            href="/blog"
            className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441]"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Structured Data for Blog Article */}
      {post && (
        <StructuredData
          type="BlogPosting"
          data={generateArticleStructuredData({
            title: post.title.rendered,
            description: post.content.rendered.replace(/<[^>]+>/g, '').slice(0, 160),
            url: `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${post.slug}`,
            image: post.featured_media ? `${process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_URL}/${post.featured_media}.jpg` : undefined,
            datePublished: post.date,
            author: 'Cowboy Kimono',
          })}
        />
      )}
      {/* Main Article Content */}
      <article className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back to Blog Link */}
          <Link 
            href="/blog"
            className="text-[#1e2939] hover:text-[#2a3441] mb-6 inline-flex items-center"
          >
            ← Back to Blog
          </Link>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              {/* Featured Image */}
              {post.featured_media && (
                <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_URL}/${post.featured_media}.jpg`}
                    alt={post.title.rendered}
                    width={800}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Header */}
              <header className="mb-8">
                <h1 
                  className="text-4xl font-bold mb-4 text-gray-900 serif"
                  dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                />
                <p className="text-gray-700 font-medium">
                  Published on {formatDate(post.date)}
                </p>
              </header>

              {/* Post Content */}
              <div 
                className="prose prose-lg max-w-none mb-8"
                style={{
                  color: '#111827'
                }}
                dangerouslySetInnerHTML={{ __html: post.content.rendered }}
              />

              {/* Back to Blog Link */}
              <div className="border-t pt-8">
                <Link 
                  href="/blog"
                  className="text-[#1e2939] hover:text-[#2a3441] font-medium"
                >
                  ← Back to all posts
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <BlogSidebar currentPostId={post.id} />
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPostPage;
