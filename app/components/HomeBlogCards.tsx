'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decodeHtmlEntities,
  fetchPosts,
  processExcerpt,
  type BlogPost,
} from '../lib/api';
import WordPressImage from './WordPressImage';

const HomeBlogCards = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchPosts({
          per_page: 3,
          _embed: true, // Explicitly request embedded data for thumbnails
        });

        if (!Array.isArray(data)) {
          console.error(
            'HomeBlogCards - Expected array but got:',
            typeof data,
            data
          );
          setError('Invalid data format received');
          return;
        }

        // Debug information removed for production

        setPosts(data);
      } catch (err) {
        console.error('HomeBlogCards - Error fetching blog posts:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load blog posts';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, []);

  // Safe HTML processing function
  const safeDecodeHtml = useCallback((htmlString: string): string => {
    if (!htmlString || typeof htmlString !== 'string') return '';
    try {
      return decodeHtmlEntities(htmlString);
    } catch (error) {
      console.error('HomeBlogCards - Error decoding HTML entities:', error);
      return String(htmlString || '');
    }
  }, []);

  // Memoize processed posts to prevent unnecessary re-renders
  const processedPosts = useMemo(() => {
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return [];
    }

    return posts
      .map((post, index) => {
        // Safe data extraction with null checks
        if (!post || !post.id || !post.slug) {
          console.warn(
            `HomeBlogCards - Invalid post object at index ${index}:`,
            post
          );
          return null;
        }

        // Additional safety - ensure post has required structure
        if (typeof post !== 'object' || post === null) {
          console.warn(
            `HomeBlogCards - Post is not a valid object at index ${index}:`,
            post
          );
          return null;
        }

        try {
          // Safe data extraction with comprehensive validation
          let title = 'Untitled';
          let date = '';

          try {
            // Handle title - could be string or object with rendered property
            const titleData = post?.title;
            if (typeof titleData === 'string') {
              title = titleData;
            } else if (
              titleData &&
              typeof titleData === 'object' &&
              'rendered' in titleData
            ) {
              title = titleData.rendered || 'Untitled';
            } else {
              title = 'Untitled';
            }

            if (typeof title !== 'string') {
              console.warn(
                'HomeBlogCards - title is not a string:',
                typeof title,
                title
              );
              title = String(title || 'Untitled');
            }
          } catch (titleError) {
            console.error(
              'HomeBlogCards - Error extracting title:',
              titleError
            );
            title = 'Untitled';
          }

          try {
            date = post?.date || '';
            if (date && typeof date !== 'string') {
              console.warn(
                'HomeBlogCards - date is not a string:',
                typeof date,
                date
              );
              date = String(date || '');
            }
          } catch (dateError) {
            console.error('HomeBlogCards - Error extracting date:', dateError);
            date = '';
          }

          // Use the safe excerpt processing function
          const safeTitle = safeDecodeHtml(title);
          const truncatedExcerpt = processExcerpt(post?.excerpt, 150);

          return {
            post,
            safeTitle,
            truncatedExcerpt,
            date,
            index,
          };
        } catch (error) {
          console.error(
            `HomeBlogCards - Error processing post ${index}:`,
            error
          );
          return null;
        }
      })
      .filter(Boolean);
  }, [posts, safeDecodeHtml]);

  // Render loading state
  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gray-600">Loading recent posts...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || renderError) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error || renderError}</p>
            <button
              onClick={() => {
                setError(null);
                setRenderError(null);
                window.location.reload();
              }}
              className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render no posts state
  if (!posts || posts.length === 0) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">No posts found</p>
          </div>
        </div>
      </div>
    );
  }

  // Additional safety check for posts array
  if (!Array.isArray(posts)) {
    console.error(
      'HomeBlogCards - posts is not an array:',
      typeof posts,
      posts
    );
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Error: Invalid posts data format
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  try {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gray-600">
              Discover stories, inspiration, and insights from the world of
              Cowboy Kimono
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {processedPosts.map((processedPost) => {
              if (!processedPost) return null;

              const { post, safeTitle, truncatedExcerpt, date, index } =
                processedPost;

              return (
                <Link
                  key={`${post.id}-${index}`}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                    {/* Featured Image */}
                    <div className="relative overflow-hidden">
                      <WordPressImage
                        post={post}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6 lg:p-8">
                      <h3
                        className="text-xl font-semibold mb-3 text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors serif"
                        dangerouslySetInnerHTML={{ __html: safeTitle }}
                      />

                      <p className="text-gray-600 text-sm mb-4 font-medium">
                        {formatDate(date)}
                      </p>

                      <div
                        className="text-gray-700 line-clamp-3 text-base leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html:
                            typeof truncatedExcerpt === 'string'
                              ? truncatedExcerpt
                              : '',
                        }}
                      />

                      <div className="mt-6 inline-flex items-center text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors">
                        Read More
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Posts Link */}
          <div className="text-center mt-12">
            <Link
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-[#1e2939] text-white rounded-lg hover:bg-[#2a3441] transition-colors font-medium"
            >
              View All Posts
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (mainRenderError) {
    console.error('HomeBlogCards - Main render error:', mainRenderError);
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Sorry, there was an error loading the blog posts.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default HomeBlogCards;
