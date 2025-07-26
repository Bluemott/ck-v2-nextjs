'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPosts, type WPGraphQLPost, decodeHtmlEntities } from '../lib/wpgraphql';
import WordPressImage from './WordPressImage';

interface WordPressBlogProps {
  postsPerPage?: number;
  showHeader?: boolean;
}

const WordPressBlog = ({ postsPerPage = 6, showHeader = true }: WordPressBlogProps) => {
  const [posts, setPosts] = useState<WPGraphQLPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchPosts({ 
          first: postsPerPage,
        });
        setPosts(data);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [postsPerPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          {showHeader && (
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest from the Blog</h2>
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
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors"
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

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {showHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest from the Blog</h2>
            <p className="text-gray-600">Discover stories, inspiration, and insights from the world of Cowboy Kimono</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
              <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Featured Image */}
                {post.featuredImage?.node && (
                  <div className="relative h-48 overflow-hidden">
                    <WordPressImage
                      post={post}
                      size="medium"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors">
                    <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(post.title) }} />
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {formatDate(post.date)}
                  </p>
                  
                  <div
                    className="text-gray-700 line-clamp-3 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: post.excerpt.substring(0, 120) + '...'
                    }}
                  />
                  
                  <div className="mt-4 inline-flex items-center text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors group/link">
                    Read More
                    <span className="ml-1 group-hover/link:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
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
};

export default WordPressBlog; 