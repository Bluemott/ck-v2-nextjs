'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPosts, fetchCategories, fetchTags, type BlogPost, decodeHtmlEntities } from '../lib/api';
import WordPressImage from './WordPressImage';
import RelatedPosts from './RelatedPosts';

interface BlogSidebarProps {
  currentPost?: BlogPost;
  currentPostCategories?: number[];
  currentPostTags?: number[];
  showRecentPosts?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
}

const BlogSidebar = ({ 
  currentPost, 
  currentPostCategories = [], 
  currentPostTags = [],
  showRecentPosts = true,
  showCategories = true,
  showTags = true
}: BlogSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
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
          per_page: 3,
        });
        setRecentPosts(recentData);

        // Fetch categories and tags
        const [categoriesData, tagsData] = await Promise.all([
          fetchCategories(),
          fetchTags()
        ]);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch {
        // Remove console.error for production - sidebar data failure is non-critical
      } finally {
        setLoading(false);
      }
    };

    loadSidebarData();
  }, [currentPost]);

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
        });
        setSearchResults(data);
      } catch {
        // Remove console.error for production - search failure is non-critical
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2939] focus:border-transparent placeholder:text-gray-800"
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
                  {decodeHtmlEntities(post.title?.rendered || 'Untitled')}
                </h5>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(post.date)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Related Posts Section */}
      {currentPost && (
        <RelatedPosts
          currentPost={currentPost}
          categories={currentPostCategories}
          tags={currentPostTags}
          limit={4}
        />
      )}

      {/* Categories Section */}
      {showCategories && categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Categories</h3>
          <div className="space-y-2">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className="block text-gray-600 hover:text-[#1e2939] transition-colors text-sm"
              >
                {decodeHtmlEntities(category.name)}
                <span className="text-gray-400 ml-1">({category.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags Section */}
      {showTags && tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 12).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-[#1e2939] hover:text-white transition-colors"
              >
                {decodeHtmlEntities(tag.name)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts Section */}
      {showRecentPosts && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Recent Posts</h3>
          <div className="space-y-4">
            {recentPosts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <div className="flex items-start space-x-3">
                  {post._embedded?.['wp:featuredmedia']?.[0] && (
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
                      {decodeHtmlEntities(post.title?.rendered || 'Untitled')}
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
