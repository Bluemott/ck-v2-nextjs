'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPosts, type WordPressPost } from '../lib/wordpress';

interface BlogSidebarProps {
  currentPostId?: number;
}

const BlogSidebar = ({ currentPostId }: BlogSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<WordPressPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<WordPressPost[]>([]);
  const [suggestedPost, setSuggestedPost] = useState<WordPressPost | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch recent posts and suggested post
  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        // Fetch recent posts
        const recentData = await fetchPosts({ per_page: 5 });
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
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
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
          per_page: 5 
        });
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching posts:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPosts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full lg:w-80 space-y-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Search Blog</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2939] focus:border-transparent placeholder:text-gray-600"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e2939]"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchTerm.length >= 2 && (
          <div className="mt-4">
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {stripHtml(post.title.rendered)}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(post.date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : !isSearching ? (
              <p className="text-sm text-gray-500 mt-2">No posts found</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Suggested Next Read */}
      {suggestedPost && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {currentPostId ? 'Next Read' : 'Featured Post'}
          </h3>
          <Link href={`/blog/${suggestedPost.slug}`} className="block">
            <div className="group">
              {suggestedPost.featured_media && (
                <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_URL}/${suggestedPost.featured_media}.jpg`}
                    alt={stripHtml(suggestedPost.title.rendered)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors">
                {stripHtml(suggestedPost.title.rendered)}
              </h4>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(suggestedPost.date)}
              </p>
              <div 
                className="text-sm text-gray-600 mt-2 line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: suggestedPost.excerpt.rendered.substring(0, 80) + '...' 
                }}
              />
            </div>
          </Link>
        </div>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Posts</h3>
          <div className="space-y-4">
            {recentPosts.slice(0, 4).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                <div className="flex space-x-3 group">
                  {post.featured_media && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_URL}/${post.featured_media}.jpg`}
                        alt={stripHtml(post.title.rendered)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors">
                      {stripHtml(post.title.rendered)}
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
      )}
    </div>
  );
};

export default BlogSidebar;
