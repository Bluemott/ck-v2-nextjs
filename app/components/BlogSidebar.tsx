'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPosts, type WordPressPost, decodeHtmlEntities } from '../lib/wordpress';
import WordPressImage from './WordPressImage';

interface BlogSidebarProps {
  currentPostId?: number;
}

const BlogSidebar = ({ currentPostId }: BlogSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<WordPressPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<WordPressPost[]>([]);
  const [suggestedPost, setSuggestedPost] = useState<WordPressPost | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent posts and suggested post
  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch recent posts
        const recentData = await fetchPosts({ 
          per_page: 5,
          _embed: true
        });
        setRecentPosts(recentData);

        // Set suggested post (next post after current, or random if no current)
        if (currentPostId) {
          const currentIndex = recentData.findIndex((post: WordPressPost) => post.id === currentPostId);
          if (currentIndex !== -1 && currentIndex < recentData.length - 1) {
            setSuggestedPost(recentData[currentIndex + 1]);
          } else {
            // If current is last or not found, suggest the first different post
            const differentPost = recentData.find((post: WordPressPost) => post.id !== currentPostId);
            setSuggestedPost(differentPost || null);
          }
        } else {
          // On blog listing page, suggest the most recent post
          setSuggestedPost(recentData[0] || null);
        }
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
        setError('Failed to load sidebar data');
      } finally {
        setLoading(false);
      }
    };

    loadSidebarData();
  }, [currentPostId]);

  // Search functionality
  useEffect(() => {
    const searchPosts = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const data = await fetchPosts({ 
          search: searchTerm,
          per_page: 5,
          _embed: true
        });
        setSearchResults(data);
      } catch (err) {
        console.error('Error searching posts:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 space-y-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Search Blog</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2939] focus:border-transparent placeholder:text-gray-600"
          />
          {isSearching && (
            <div className="absolute right-3 top-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1e2939]"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Search Results:</h4>
            {searchResults.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <h5 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {decodeHtmlEntities(post.title.rendered)}
                </h5>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(post.date)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Recent Posts</h3>
        <div className="space-y-4">
          {recentPosts.map((post) => (
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

      {/* Suggested Post Section */}
      {suggestedPost && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">You Might Like</h3>
          <Link href={`/blog/${suggestedPost.slug}`} className="block group">
            {suggestedPost.featured_media && (
              <div className="relative w-full h-32 mb-3 rounded overflow-hidden">
                <WordPressImage
                  post={suggestedPost}
                  size="medium"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <h4 className="text-sm font-medium text-gray-900 group-hover:text-[#1e2939] line-clamp-2 transition-colors">
              {decodeHtmlEntities(suggestedPost.title.rendered)}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(suggestedPost.date)}
            </p>
          </Link>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogSidebar;
