'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import WordPressImage from '../components/WordPressImage';
import {
  decodeHtmlEntities,
  fetchCategories,
  fetchCategoryBySlug,
  fetchPosts,
  fetchPostsWithPagination,
  fetchTagBySlug,
  fetchTags,
  processExcerpt,
  type BlogPost,
  type WPRestCategory,
  type WPRestTag,
} from '../lib/api';

// Build-time detection for conditional logging
const IS_BUILD = process.env.CI === 'true';

const POSTS_PER_PAGE = 9; // Reduced from 12 to accommodate larger cards

interface BlogClientProps {
  initialCategory?: string;
  initialTag?: string;
  initialTagData?: WPRestTag;
  showHeader?: boolean;
}

const BlogClient = ({
  initialCategory,
  initialTag,
  initialTagData,
  showHeader = true,
}: BlogClientProps = {}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<WPRestCategory[]>([]);
  const [tags, setTags] = useState<WPRestTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [searchTotalResults, setSearchTotalResults] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mounting state to prevent hydration issues
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

  // Handle WordPress search
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.trim() === '') {
        setIsSearching(false);
        setSearchResults([]);
        setSearchTotalResults(0);
        return;
      }

      setIsSearching(true);
      setIsPageLoading(true);

      try {
        // Use WordPress search to search ALL content
        const searchData = await fetchPostsWithPagination({
          per_page: 50, // Get more results for search
          search: debouncedSearchTerm.trim(),
        });

        // Validate search results
        if (searchData && Array.isArray(searchData.posts)) {
          setSearchResults(searchData.posts);
          setSearchTotalResults(searchData.totalCount || 0);
        } else {
          console.warn('Invalid search results:', searchData);
          setSearchResults([]);
          setSearchTotalResults(0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setSearchTotalResults(0);
      } finally {
        setIsPageLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, initialCategory, initialTag]);

  useEffect(() => {
    const loadPosts = async () => {
      // Skip loading posts if we're in search mode
      if (isSearching) return;

      if (currentPage === 1) {
        setLoading(true);
      } else {
        setIsPageLoading(true);
        setIsTransitioning(true);
      }

      try {
        // Build search parameters
        const searchParams: Record<string, string | number | number[]> = {
          page: currentPage,
          per_page: POSTS_PER_PAGE,
        };

        // Handle category filtering
        if (initialCategory) {
          try {
            const category = await fetchCategoryBySlug(initialCategory);
            if (category) {
              searchParams.categories = [category.id];
            }
          } catch (error) {
            console.error('Error fetching category:', error);
          }
        }

        // Handle tag filtering
        if (initialTag) {
          try {
            // Use provided tag data if available, otherwise fetch it
            const tag = initialTagData || (await fetchTagBySlug(initialTag));
            if (tag) {
              searchParams.tags = [tag.id];
            }
          } catch (error) {
            console.error('Error fetching tag:', error);
          }
        }

        const result = await fetchPostsWithPagination(searchParams);

        // Ensure we have valid data before updating state
        if (result && Array.isArray(result.posts)) {
          setPosts(result.posts);
          setHasNextPage(result.pageInfo?.hasNextPage || false);

          // Use actual total count from WordPress
          setTotalPosts(result.totalCount || 0);
          setTotalPages(Math.ceil((result.totalCount || 0) / POSTS_PER_PAGE));
        } else {
          console.warn(
            'Invalid response from fetchPostsWithPagination:',
            result
          );
          setPosts([]);
          setHasNextPage(false);
          setTotalPosts(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        if (
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('fetch')
        ) {
          setError(
            'Unable to connect to the blog server. Please check your internet connection and try again.'
          );
        } else if (errorMessage.includes('404')) {
          setError('Blog posts not found. Please try refreshing the page.');
        } else if (errorMessage.includes('500')) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError('Failed to load blog posts. Please try again later.');
        }
      } finally {
        setLoading(false);
        setIsPageLoading(false);
        // Reset transition state after a delay to ensure smooth visual transition
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }
    };

    const loadSidebarData = async () => {
      try {
        // Fetch recent posts, categories, and tags for sidebar
        const [recentData, categoriesData, tagsData] = await Promise.all([
          fetchPosts({
            per_page: 5,
          }),
          fetchCategories(),
          fetchTags(),
        ]);

        // Validate and set recent posts
        if (Array.isArray(recentData)) {
          setRecentPosts(recentData);
        } else {
          console.warn('Invalid recent posts data:', recentData);
          setRecentPosts([]);
        }

        // Validate and set categories
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.warn('Invalid categories data:', categoriesData);
          setCategories([]);
        }

        // Validate and set tags
        if (Array.isArray(tagsData)) {
          setTags(tagsData);
        } else {
          console.warn('Invalid tags data:', tagsData);
          setTags([]);
        }
      } catch (error) {
        console.error('Error loading sidebar data:', error);
        // Sidebar data failure is non-critical, so we don't set error state
        // But we can log more specific error information for debugging
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        if (!IS_BUILD) {
          console.warn('Sidebar data loading failed:', {
            error: errorMessage,
            type: 'sidebar_data_error',
          });
        }
        setRecentPosts([]);
        setCategories([]);
        setTags([]);
      }
    };

    loadPosts();
    // Only load sidebar data on initial load
    if (currentPage === 1) {
      loadSidebarData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, initialCategory, initialTag, isSearching]);

  // Remove the old client-side search filtering effect as we now use WordPress search

  // Sticky sidebar functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setIsSidebarSticky(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString: string) => {
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
  };

  const handlePageChange = (page: number) => {
    if (isPageLoading || page === currentPage || isSearching) return; // Prevent page changes during search

    // Clear search terms when changing pages (but delay it to prevent flashing)
    if (searchTerm || debouncedSearchTerm) {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setIsSearching(false);
      setSearchResults([]);
      setSearchTotalResults(0);
    }

    // Reset error state when changing pages
    setError(null);

    setCurrentPage(page);
    // Smooth scroll to top with a slight delay to allow content to load
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setIsSearching(false);
    setSearchResults([]);
    setSearchTotalResults(0);
  };

  // Get the posts to display (search results or regular posts)
  const displayPosts = isSearching ? searchResults : posts;

  // Add a cleanup function to reset states when component unmounts or reinitializes
  useEffect(() => {
    return () => {
      // Cleanup function to reset loading states
      setIsPageLoading(false);
      setIsTransitioning(false);
    };
  }, []);

  // Ensure states are properly reset on category/tag changes
  useEffect(() => {
    if (initialCategory || initialTag) {
      setCurrentPage(1);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setError(null);
    }
  }, [initialCategory, initialTag]);

  const renderPagination = () => {
    // Don't show pagination during search
    if (isSearching || totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isPageLoading}
          className={`px-4 py-2 mx-1 border rounded-lg transition-colors font-medium ${
            isPageLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
          aria-label={`Go to previous page (page ${currentPage - 1})`}
        >
          ← Previous
        </button>
      );
    }

    // Page numbers
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
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
          aria-label={`Go to page ${i}`}
          aria-current={i === currentPage ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (hasNextPage) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isPageLoading}
          className={`px-4 py-2 mx-1 border rounded-lg transition-colors font-medium ${
            isPageLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
          aria-label={`Go to next page (page ${currentPage + 1})`}
        >
          Next →
        </button>
      );
    }

    return (
      <nav
        className="flex justify-center items-center mt-16"
        aria-label="Blog pagination"
      >
        <div className="flex flex-wrap justify-center">{pages}</div>
        {/* Simplified loading indicator */}
        {isPageLoading && (
          <div className="flex items-center ml-4 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e2939] mr-2"></div>
            Loading...
          </div>
        )}
      </nav>
    );
  };

  // Prevent rendering until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1e2939] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg font-medium">
            Initializing...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we prepare the blog
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1e2939] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg font-medium">
            Loading blog posts...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we fetch the latest content
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 serif">
            Unable to Load Blog
          </h2>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1e2939] text-white px-6 py-3 rounded-lg hover:bg-[#2a3441] transition-colors font-medium"
            >
              Try Again
            </button>
            <div className="text-sm text-gray-500">
              <p>If the problem persists, please check back later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    // Additional safety check for posts array
    if (!Array.isArray(displayPosts)) {
      console.error(
        'BlogClient - displayPosts is not an array:',
        typeof displayPosts,
        displayPosts
      );
      return (
        <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-500 mb-4">
              <svg
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 serif">
              Invalid Data Format
            </h2>
            <p className="text-red-600 mb-6 text-lg">
              The blog posts data is in an unexpected format.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#1e2939] text-white px-6 py-3 rounded-lg hover:bg-[#2a3441] transition-colors font-medium"
              >
                Try Again
              </button>
              <div className="text-sm text-gray-500">
                <p>If the problem persists, please check back later.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key="blog-client" className="min-h-screen bg-[#f0f8ff] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section - Only show on main blog page */}
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
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight serif">
                Blog & Stories
              </h1>
              <p className="text-gray-600 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                Discover stories, inspiration, and insights from the world of
                Cowboy Kimono
              </p>
              {totalPosts > 0 && !isSearching && (
                <p className="text-sm text-gray-500 mt-4 font-medium">
                  Showing page {currentPage} of {totalPages} ({totalPosts} total
                  posts)
                </p>
              )}
              {isSearching && searchTotalResults > 0 && (
                <p className="text-sm text-gray-500 mt-4 font-medium">
                  Found {searchTotalResults} post
                  {searchTotalResults !== 1 ? 's' : ''} matching &ldquo;
                  {debouncedSearchTerm}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Main Content with Sidebar */}
          <div
            key="main-content"
            className="flex flex-col lg:flex-row gap-8 lg:gap-12"
          >
            {/* Main Content - Always Left */}
            <div key="main-posts" className="flex-1 lg:order-1 relative">
              {displayPosts.length === 0 && !isPageLoading ? (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="h-16 w-16 mx-auto"
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
                  <h3 className="text-xl font-semibold text-gray-600 mb-2 serif">
                    {isSearching ? 'No search results found' : 'No posts found'}
                  </h3>
                  <p className="text-gray-500">
                    {isSearching ? (
                      <>
                        No posts match &ldquo;{debouncedSearchTerm}&rdquo;. Try
                        a different search term.
                      </>
                    ) : (
                      'No blog posts found.'
                    )}
                  </p>
                  {isSearching && (
                    <button
                      onClick={clearSearch}
                      className="mt-4 px-4 py-2 bg-[#1e2939] text-white rounded-lg hover:bg-[#2a3441] transition-colors font-medium"
                    >
                      Clear search and view all posts
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className={`columns-1 md:columns-2 lg:columns-3 gap-6 lg:gap-8 space-y-6 lg:space-y-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
                  >
                    {Array.isArray(displayPosts) &&
                      displayPosts.map((post) => {
                        // Skip invalid posts
                        if (!post || !post.id || !post.slug) {
                          console.warn('Invalid post object:', post);
                          return null;
                        }

                        // Safe data extraction with null checks
                        const title = post?.title?.rendered || 'Untitled Post';
                        const date = post?.date || '';

                        // Use the safe excerpt processing function
                        const truncatedExcerpt = processExcerpt(
                          post?.excerpt,
                          180
                        );

                        // Additional safety check for excerpt
                        if (typeof truncatedExcerpt !== 'string') {
                          console.warn(
                            'BlogClient - truncatedExcerpt is not a string:',
                            typeof truncatedExcerpt,
                            truncatedExcerpt
                          );
                        }

                        return (
                          <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            className="block group break-inside-avoid mb-6 lg:mb-8"
                          >
                            <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer border border-gray-100 hover:border-gray-200">
                              {/* Featured Image - Natural aspect ratio */}
                              <div className="relative w-full overflow-hidden">
                                <WordPressImage
                                  post={post}
                                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                {/* Subtle overlay on hover */}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                              </div>
                              {/* Card Content */}
                              <div className="p-4 sm:p-6 lg:p-8">
                                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#1e2939] transition-colors duration-300 line-clamp-2 serif">
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: decodeHtmlEntities(title),
                                    }}
                                  />
                                </h2>

                                <p className="text-gray-500 text-sm mb-4 font-medium">
                                  {formatDate(date)}
                                </p>

                                <div
                                  className="text-gray-700 mb-6 line-clamp-4 leading-relaxed text-sm sm:text-base"
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      typeof truncatedExcerpt === 'string'
                                        ? truncatedExcerpt
                                        : '',
                                  }}
                                />

                                <div className="inline-flex items-center text-[#1e2939] group-hover:text-[#2a3441] font-semibold transition-all duration-300 text-sm sm:text-base">
                                  Read More
                                  <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">
                                    →
                                  </span>
                                </div>
                              </div>
                            </article>
                          </Link>
                        );
                      })}
                  </div>

                  {/* Pagination */}
                  {renderPagination()}
                </>
              )}

              {/* Simplified loading overlay - only show during transitions */}
              {isPageLoading && isTransitioning && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center space-x-3 text-gray-700 bg-white px-8 py-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e2939]"></div>
                    <span className="text-sm font-medium">
                      Loading new posts...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Always Right */}
            <div
              key="sidebar"
              className={`w-full lg:w-80 lg:order-2 space-y-8 ${isSidebarSticky ? 'lg:sticky lg:top-24 lg:self-start' : ''} lg:z-10`}
            >
              {/* Search Bar - Moved to top of sidebar */}
              <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 serif">
                  Search Blog
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search blog posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#1e2939] focus:border-transparent outline-none transition-all duration-300 bg-white placeholder-gray-800"
                    aria-label="Search blog posts"
                    aria-describedby="search-results"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                {searchTerm && (
                  <p className="text-sm text-gray-500 mt-2" id="search-results">
                    Found {searchTotalResults} post
                    {searchTotalResults !== 1 ? 's' : ''} matching &ldquo;
                    {debouncedSearchTerm}&rdquo;
                  </p>
                )}
                {/* Clear search button */}
                {(searchTerm || isSearching) && (
                  <button
                    onClick={clearSearch}
                    className="mt-3 text-sm text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors duration-300 flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear search
                  </button>
                )}
              </div>

              {/* Recent Posts */}
              {recentPosts.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 serif">
                    Recent Posts
                  </h3>
                  <div className="space-y-6">
                    {Array.isArray(recentPosts) &&
                      recentPosts.slice(0, 4).map((post) => {
                        // Skip invalid posts
                        if (!post || !post.id || !post.slug) {
                          return null;
                        }

                        // Safe data extraction with null checks
                        const title = post?.title?.rendered || 'Untitled Post';
                        const date = post?.date || '';

                        return (
                          <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            className="block group"
                          >
                            <div className="flex space-x-4 group">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                                <WordPressImage
                                  post={post}
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                {/* Subtle overlay on hover */}
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors duration-300 leading-tight serif">
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: decodeHtmlEntities(title),
                                    }}
                                  />
                                </h4>
                                <p className="text-xs text-gray-500 mt-2 font-medium">
                                  {formatDate(date)}
                                </p>
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
                <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 serif">
                    Categories
                  </h3>
                  <div className="space-y-4">
                    {Array.isArray(categories) &&
                      categories.map((category) => {
                        // Skip invalid categories
                        if (
                          !category ||
                          !category.id ||
                          !category.slug ||
                          !category.name
                        ) {
                          return null;
                        }

                        return (
                          <Link
                            key={category.id}
                            href={`/blog/category/${category.slug}`}
                            className="block text-gray-600 hover:text-[#1e2939] transition-colors duration-300 text-sm font-medium hover:font-semibold group"
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {decodeHtmlEntities(String(category.name))}
                              </span>
                              <span className="text-gray-400 group-hover:text-gray-600 transition-colors duration-300">
                                ({category.count || 0})
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 serif">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Array.isArray(tags) &&
                      (showAllTags ? tags : tags.slice(0, 8)).map((tag) => {
                        // Skip invalid tags
                        if (!tag || !tag.id || !tag.slug || !tag.name) {
                          return null;
                        }

                        return (
                          <Link
                            key={tag.id}
                            href={`/blog/tag/${tag.slug}`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 hover:shadow-md"
                          >
                            {decodeHtmlEntities(String(tag.name))}
                          </Link>
                        );
                      })}
                  </div>
                  {tags.length > 8 && (
                    <button
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="mt-4 text-sm text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors duration-300 flex items-center gap-1"
                    >
                      {showAllTags ? (
                        <>
                          Show Less
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </>
                      ) : (
                        <>
                          Show More ({tags.length - 8} more)
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering BlogClient:', error);
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 serif">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-6 text-lg">
            An error occurred while rendering the blog.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1e2939] text-white px-6 py-3 rounded-lg hover:bg-[#2a3441] transition-colors font-medium"
            >
              Try Again
            </button>
            <div className="text-sm text-gray-500">
              <p>If the problem persists, please check back later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default BlogClient;
