'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPosts, type WordPressPost, decodeHtmlEntities } from '../lib/wordpress';

interface HomeBlogCardsProps {
  postsPerPage?: number;
}

export default function HomeBlogCards({ postsPerPage = 3 }: HomeBlogCardsProps) {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecentPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const recentPosts = await fetchPosts({
          per_page: postsPerPage,
          page: 1,
          _embed: true,
        });
        
        setPosts(recentPosts);
      } catch (err) {
        console.error('Error loading recent posts:', err);
        setError('Failed to load recent posts');
      } finally {
        setLoading(false);
      }
    };

    loadRecentPosts();
  }, [postsPerPage]);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="aspect-square relative bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load recent posts. Please try again later.</p>
      </div>
    );
  }

  // No posts state
  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No recent posts available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`} className="block">
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="aspect-square relative">
              {/* Use WordPress featured image if available, otherwise fallback */}
              {post._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                <Image
                  src={post._embedded['wp:featuredmedia'][0].source_url}
                  alt={post._embedded['wp:featuredmedia'][0].alt_text || post.title.rendered}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-t-lg transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  quality={85}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg">
                  <div className="text-gray-400 text-center p-4">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-sm">No Image</div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 line-clamp-2"
                 dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(post.title.rendered) }}
              />
              <span className="text-[#1e2939] hover:text-[#2a3441] font-medium">
                Read More →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 