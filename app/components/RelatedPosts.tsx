'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  decodeHtmlEntities,
  fetchRecommendationsWithMetadata,
  type BlogPost,
} from '../lib/api';
import WordPressImage from './WordPressImage';

interface RelatedPostsProps {
  currentPost: BlogPost;
  categories: number[];
  tags: number[];
  limit?: number;
  showMetadata?: boolean;
}

const RelatedPosts = ({
  currentPost,
  categories,
  tags,
  limit = 3,
  showMetadata = false,
}: RelatedPostsProps) => {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    sourcePostId: number;
    categoriesFound: number;
    tagsFound: number;
    totalPostsProcessed: number;
    uniquePostsFound: number;
  } | null>(null);
  const [source, setSource] = useState<'lambda' | 'wordpress' | null>(null);

  useEffect(() => {
    const loadRelatedPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        setMetadata(null);
        setSource(null);

        // Use the new Lambda API with metadata
        const result = await fetchRecommendationsWithMetadata(
          currentPost.id,
          limit
        );

        // Debug information removed for production

        setRelatedPosts(result.recommendations);
        setMetadata(result.metadata || null);
        setSource(result.source);

        // Log the source for monitoring
        if (result.source === 'lambda') {
          console.warn(
            `Using Lambda API for recommendations (${result.recommendations.length} posts)`
          );
        } else {
          console.warn(
            `Using WordPress REST API for recommendations (${result.recommendations.length} posts)`
          );
        }
      } catch (error) {
        console.error('Error loading related posts:', error);
        setError('Failed to load related posts');
      } finally {
        setLoading(false);
      }
    };

    loadRelatedPosts();
  }, [currentPost, categories, tags, limit]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-6 w-32"></div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100 text-center">
        <div className="text-red-400 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-600 serif">
          Error Loading Related Posts
        </h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-600 serif">
          No Related Posts
        </h3>
        <p className="text-gray-500 text-sm">
          No related posts available at the moment. Check back later for more
          content!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 serif">
          {categories.length === 0 && tags.length === 0
            ? 'Recent Posts'
            : 'Related Posts'}
        </h3>

        {/* Show source indicator when metadata is enabled */}
        {showMetadata && source && (
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                source === 'lambda'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {source === 'lambda' ? (
                <>
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lambda AI
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  WordPress
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Show metadata when enabled */}
      {showMetadata && metadata && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>Categories found: {metadata.categoriesFound}</div>
            <div>Tags found: {metadata.tagsFound}</div>
            <div>Posts processed: {metadata.totalPostsProcessed}</div>
            <div>Unique posts: {metadata.uniquePostsFound}</div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {relatedPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <div className="flex items-start space-x-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md bg-gray-100">
                <WordPressImage
                  post={post}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="80px"
                />
                {/* Subtle overlay on hover */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#1e2939] line-clamp-2 transition-colors duration-300 leading-tight serif">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: decodeHtmlEntities(
                        post.title?.rendered || 'Untitled Post'
                      ),
                    }}
                  />
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-500 font-medium">
                    {formatDate(post.date)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
