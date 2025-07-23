'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchRelatedPosts, type WordPressPost, decodeHtmlEntities } from '../lib/wordpress';
import WordPressImage from './WordPressImage';

interface RelatedPostsProps {
  currentPostId: number;
  categories: number[];
  tags: number[];
  limit?: number;
}

const RelatedPosts = ({ currentPostId, categories, tags, limit = 3 }: RelatedPostsProps) => {
  const [relatedPosts, setRelatedPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRelatedPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const posts = await fetchRelatedPosts(currentPostId, categories, tags, limit);
        setRelatedPosts(posts);
      } catch (err) {
        console.error('Error loading related posts:', err);
        setError('Failed to load related posts');
      } finally {
        setLoading(false);
      }
    };

    loadRelatedPosts();
  }, [currentPostId, categories, tags, limit]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Related Posts</h3>
        <p className="text-gray-600 text-sm">No related posts found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Related Posts</h3>
      <div className="space-y-4">
        {relatedPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <div className="flex items-start space-x-3">
              {post.featured_media && (
                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                  <WordPressImage
                    post={post}
                    size="medium"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-[#1e2939] line-clamp-2 transition-colors">
                  {decodeHtmlEntities(post.title.rendered)}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(post.date)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts; 