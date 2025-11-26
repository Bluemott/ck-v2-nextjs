'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import WordPressImage from '../components/WordPressImage';
import {
  decodeHtmlEntities,
  processExcerpt,
  type BlogPost,
} from '../lib/api';
import {
  usePosts,
  useSearchPosts,
  useCategories,
  useTags,
  type UsePostsOptions,
} from '../lib/hooks';
import type { WPRestCategory, WPRestTag } from '../lib/types/wordpress';

const POSTS_PER_PAGE = 9;

interface BlogClientProps {
  initialCategory?: string;
  initialTag?: string;
  initialTagData?: WPRestTag;
  showHeader?: boolean;
}

/**
 * BlogClient with SWR integration
 * - Automatic caching and deduplication
 * - Background revalidation
 * - Stale-while-revalidate pattern
 * - Request deduplication
 */
const BlogClientSWR = ({
  initialCategory,
  initialTag,
  initialTagData,
  showHeader = true,
}: BlogClientProps = {}) => {
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagId, setTagId] = useState<number | null>(null);

  // Fetch categories and tags using SWR
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { tags, isLoading: tagsLoading } = useTags();

  // Resolve category/tag IDs from slugs
  useEffect(() => {
    if (initialCategory && categories.length > 0) {
      const cat = categories.find((c) => c.slug === initialCategory);
      if (cat) setCategoryId(cat.id);
    }
    if (initialTag) {
      if (initialTagData) {
        setTagId(initialTagData.id);
      } else if (tags.length > 0) {
        const tag = tags.find((t) => t.slug === initialTag);
        if (tag) setTagId(tag.id);
      }
    }
  }, [initialCategory, initialTag, initialTagData, categories, tags]);

  // Build query options
  const queryOptions: UsePostsOptions = {
    page: currentPage,
    perPage: POSTS_PER_PAGE,
  };
  if (categoryId) queryOptions.categories = [categoryId];
  if (tagId) queryOptions.tags = [tagId];

  // Fetch posts using SWR (only when not searching)
  const {
    posts,
    totalPosts,
    totalPages,
    isLoading: postsLoading,
    isValidating: postsValidating,
    error: postsError,
  } = usePosts(debouncedSearchTerm ? {} : queryOptions);

  // Search posts using SWR
  const {
    results: searchResults,
    totalResults: searchTotalResults,
    isSearching,
    error: searchError,
  } = useSearchPosts(debouncedSearchTerm, { perPage: 50 });

  // Recent posts for sidebar (always fetch first 5)
  const { posts: recentPosts } = usePosts({ perPage: 5 });

  // Handle mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on category/tag change
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, [initialCategory, initialTag]);

  // Sticky sidebar
  useEffect(() => {
    const handleScroll = () => {
      setIsSidebarSticky(window.pageYOffset > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine which posts to display
  const isSearchMode = debouncedSearchTerm.length >= 2;
  const displayPosts = isSearchMode ? searchResults : posts;
  const isLoading = postsLoading || categoriesLoading || tagsLoading;
  const isPageLoading = postsValidating || isSearching;
  const error = postsError || searchError;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handlePageChange = (page: number) => {
    if (isPageLoading || page === currentPage || isSearchMode) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  // Render pagination
  const renderPagination = () => {
    if (isSearchMode || totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isPageLoading}
          className={`px-4 py-2 mx-1 border rounded-lg transition-colors font-medium ${
            isPageLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          ← Previous
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={isPageLoading}
          className={`px-4 py-2 mx-1 border rounded-lg transition-colors font-medium ${
            i === currentPage
              ? 'bg-[#1e2939] text-white border-[#1e2939]'
              : isPageLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isPageLoading}
          className={`px-4 py-2 mx-1 border rounded-lg transition-colors font-medium ${
            isPageLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Next →
        </button>
      );
    }

    return (
      <nav className="flex justify-center items-center mt-16" aria-label="Blog pagination">
        <div className="flex flex-wrap justify-center">{pages}</div>
        {isPageLoading && (
          <div className="flex items-center ml-4 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e2939] mr-2" />
            Updating...
          </div>
        )}
      </nav>
    );
  };

  // Loading state
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1e2939] mx-auto" />
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 serif">Unable to Load Blog</h2>
          <p className="text-red-600 mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1e2939] text-white px-6 py-3 rounded-lg hover:bg-[#2a3441] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {showHeader && (
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <Image
                src="/images/CK_Logo_Blog.webp"
                alt="Blog Header"
                width={400}
                height={100}
                className="max-w-full h-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 serif">
              Blog & Stories
            </h1>
            <p className="text-gray-600 text-xl md:text-2xl max-w-3xl mx-auto">
              Discover stories, inspiration, and insights from the world of Cowboy Kimono
            </p>
            {!isSearchMode && totalPosts > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Showing page {currentPage} of {totalPages} ({totalPosts} total posts)
              </p>
            )}
            {isSearchMode && searchTotalResults > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Found {searchTotalResults} post{searchTotalResults !== 1 ? 's' : ''} matching &ldquo;{debouncedSearchTerm}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Posts Grid */}
          <div className="flex-1 lg:order-1 relative">
            {displayPosts.length === 0 && !isPageLoading ? (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold text-gray-600 mb-2 serif">
                  {isSearchMode ? 'No search results found' : 'No posts found'}
                </h3>
                <p className="text-gray-500">
                  {isSearchMode
                    ? `No posts match "${debouncedSearchTerm}". Try a different search term.`
                    : 'No blog posts found.'}
                </p>
                {isSearchMode && (
                  <button
                    onClick={clearSearch}
                    className="mt-4 px-4 py-2 bg-[#1e2939] text-white rounded-lg hover:bg-[#2a3441]"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 transition-opacity duration-300 ${isPageLoading ? 'opacity-50' : 'opacity-100'}`}>
                  {displayPosts.map((post: BlogPost) => {
                    if (!post?.id || !post?.slug) return null;
                    const title = post.title?.rendered || 'Untitled';
                    const truncatedExcerpt = processExcerpt(post.excerpt, 180);

                    return (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="block group break-inside-avoid mb-6">
                        <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                          <div className="relative w-full overflow-hidden">
                            <WordPressImage
                              post={post}
                              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                          <div className="p-4 sm:p-6">
                            <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#1e2939] line-clamp-2 serif">
                              <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(title) }} />
                            </h2>
                            <p className="text-gray-500 text-sm mb-4">{formatDate(post.date)}</p>
                            <div
                              className="text-gray-700 mb-6 line-clamp-4 text-sm"
                              dangerouslySetInnerHTML={{ __html: truncatedExcerpt }}
                            />
                            <div className="inline-flex items-center text-[#1e2939] font-semibold text-sm">
                              Read More
                              <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
                {renderPagination()}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className={`w-full lg:w-80 lg:order-2 space-y-8 ${isSidebarSticky ? 'lg:sticky lg:top-24 lg:self-start' : ''}`}>
            {/* Search */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">Search Blog</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e2939] focus:border-transparent outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {(searchTerm || isSearchMode) && (
                <button onClick={clearSearch} className="mt-3 text-sm text-[#1e2939] hover:text-[#2a3441] font-medium">
                  Clear search
                </button>
              )}
            </div>

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800 serif">Recent Posts</h3>
                <div className="space-y-6">
                  {recentPosts.slice(0, 4).map((post: BlogPost) => {
                    if (!post?.id || !post?.slug) return null;
                    return (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                        <div className="flex space-x-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                            <WordPressImage post={post} fill className="object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#1e2939] serif">
                              <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(post.title?.rendered || '') }} />
                            </h4>
                            <p className="text-xs text-gray-500 mt-2">{formatDate(post.date)}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800 serif">Categories</h3>
                <div className="space-y-4">
                  {categories.map((category: WPRestCategory) => (
                    <Link
                      key={category.id}
                      href={`/blog/category/${category.slug}`}
                      className="block text-gray-600 hover:text-[#1e2939] text-sm font-medium group"
                    >
                      <div className="flex items-center justify-between">
                        <span>{decodeHtmlEntities(category.name)}</span>
                        <span className="text-gray-400 group-hover:text-gray-600">({category.count})</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-gray-800 serif">Tags</h3>
                <div className="flex flex-wrap gap-3">
                  {(showAllTags ? tags : tags.slice(0, 8)).map((tag: WPRestTag) => (
                    <Link
                      key={tag.id}
                      href={`/blog/tag/${tag.slug}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-all"
                    >
                      {decodeHtmlEntities(tag.name)}
                    </Link>
                  ))}
                </div>
                {tags.length > 8 && (
                  <button
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="mt-4 text-sm text-[#1e2939] hover:text-[#2a3441] font-medium"
                  >
                    {showAllTags ? 'Show Less' : `Show More (${tags.length - 8} more)`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogClientSWR;

