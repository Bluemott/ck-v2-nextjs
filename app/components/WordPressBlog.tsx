'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { fetchPosts, type BlogPost, decodeHtmlEntities, processExcerpt } from '../lib/api';
import WordPressImage from './WordPressImage';

interface WordPressBlogProps {
  postsPerPage?: number;
  showHeader?: boolean;
}

const WordPressBlog = memo(({ postsPerPage = 6, showHeader = true }: WordPressBlogProps) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPosts({ 
        per_page: postsPerPage,
      });
      setPosts(data);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [postsPerPage]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {showHeader && (
                      <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 serif">Latest from the Blog</h2>
            <p className="text-gray-600">Loading recent posts...</p>
          </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[...Array(postsPerPage)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4" role="alert">{error}</p>
            <button
              onClick={loadPosts}
              className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Retry loading blog posts"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">No blog posts available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Additional safety check for posts array
  if (!Array.isArray(posts)) {
    console.error('WordPressBlog - posts is not an array:', typeof posts, posts);
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4" role="alert">Error: Invalid posts data format</p>
            <button
              onClick={loadPosts}
              className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Retry loading blog posts"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {showHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 serif">Latest from the Blog</h2>
            <p className="text-gray-600">Discover stories, inspiration, and insights from the world of Cowboy Kimono</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="feed" aria-label="Blog posts">
          {posts.map((post) => {
            // Safe data extraction with null checks
            if (!post || !post.id || !post.slug) {
              return null;
            }
            
            const title = post?.title?.rendered || 'Untitled Post';
            const date = post?.date || '';
            
            // Use the safe excerpt processing function
            const truncatedExcerpt = processExcerpt(post?.excerpt, 120);
            
            // Additional safety check for excerpt
            if (typeof truncatedExcerpt !== 'string') {
              console.warn('WordPressBlog - truncatedExcerpt is not a string:', typeof truncatedExcerpt, truncatedExcerpt);
            }
            
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group" aria-label={`Read ${decodeHtmlEntities(title)}`}>
                <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                  {/* Featured Image */}
                  {post._embedded?.['wp:featuredmedia']?.[0] && (
                    <div className="relative h-48 overflow-hidden">
                      <WordPressImage
                        post={post}
                        size="medium"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        alt={`Featured image for ${decodeHtmlEntities(title)}`}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors serif">
                      <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(title) }} />
                    </h3>
                    
                    <time className="text-gray-600 text-sm mb-3 block" dateTime={date}>
                      {formatDate(date)}
                    </time>
                    
                    <div
                      className="text-gray-700 line-clamp-3 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: typeof truncatedExcerpt === 'string' ? truncatedExcerpt : ''
                      }}
                    />
                    
                    <div className="mt-4 inline-flex items-center text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors group/link">
                      Read More
                      <span className="ml-1 group-hover/link:translate-x-1 transition-transform" aria-hidden="true">→</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* View All Posts Link */}
        {showHeader && (
          <div className="text-center mt-12">
            <Link 
              href="/blog"
              className="inline-flex items-center px-6 py-3 bg-[#1e2939] text-white rounded-lg hover:bg-[#2a3441] transition-colors font-medium"
            >
              View All Posts
              <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
});

WordPressBlog.displayName = 'WordPressBlog';

export default WordPressBlog; 