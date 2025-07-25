'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchPosts, type WordPressPost, decodeHtmlEntities, getFeaturedImageUrl, getFeaturedImageAlt } from '../lib/wordpress';

interface WordPressBlogProps {
  initialPosts?: WordPressPost[];
  postsPerPage?: number;
  showPagination?: boolean;
  initialPage?: number;
  initialSearch?: string;
}

export default function WordPressBlog({ 
  initialPosts = [], 
  postsPerPage = 6,
  showPagination = true,
  initialPage = 1,
  initialSearch = ''
}: WordPressBlogProps) {
  const [posts, setPosts] = useState<WordPressPost[]>(initialPosts);
  const [featuredPosts, setFeaturedPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(!initialPosts.length);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchResults, setSearchResults] = useState<WordPressPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const router = useRouter();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load posts if not provided as props
        if (!initialPosts.length) {
          const fetchedPosts = await fetchPosts({
            per_page: postsPerPage,
            page: currentPage,
            _embed: true,
          });
          setPosts(fetchedPosts);
          setTotalPages(Math.ceil(fetchedPosts.length / postsPerPage));
        }

        // Load featured posts (first 3 posts)
        const featured = await fetchPosts({
          per_page: 3,
          page: 1,
          _embed: true,
        });
        setFeaturedPosts(featured);
      } catch (err) {
        console.error('Error loading blog data:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, postsPerPage, initialPosts.length]);

  // Update URL with current state
  const updateURL = useCallback((page: number, search: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (search.trim()) params.set('search', search.trim());
    
    const newURL = params.toString() ? `/blog?${params.toString()}` : '/blog';
    router.push(newURL);
  }, [router]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      updateURL(currentPage, '');
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const results = await fetchPosts({
        per_page: 10,
        search: query,
        _embed: true,
      });
      setSearchResults(results);
      updateURL(currentPage, query);
    } catch (err) {
      console.error('Error searching posts:', err);
      setError('Failed to search posts. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [currentPage, updateURL]);

  // Handle initial search if provided
  useEffect(() => {
    if (initialSearch.trim()) {
      handleSearch(initialSearch);
    }
  }, [initialSearch, handleSearch]);

  // Handle page change
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    updateURL(page, searchQuery);
    
    try {
      setLoading(true);
      setError(null);
      const fetchedPosts = await fetchPosts({
        per_page: postsPerPage,
        page,
        _embed: true,
      });
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error loading page:', err);
      setError('Failed to load page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading && !posts.length) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(postsPerPage)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#1e2939] text-white px-6 py-2 rounded hover:bg-[#2a3441] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine which posts to display
  const displayPosts = searchQuery.trim() ? searchResults : posts;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              
              {/* Search */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Posts</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search all posts..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2939] focus:border-transparent"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1e2939]"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Results Info */}
              {searchQuery.trim() && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link 
                    href="/blog" 
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    All Posts
                  </Link>
                  <Link 
                    href="/shop" 
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Shop
                  </Link>
                  <Link 
                    href="/about" 
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    About
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            
            {/* Featured Posts Section */}
            {!searchQuery.trim() && featuredPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 serif">Featured Posts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="relative aspect-square">
                          {(() => {
                            const imageUrl = getFeaturedImageUrl(post);
                            const imageAlt = getFeaturedImageAlt(post);
                            
                            if (imageUrl && imageUrl !== '/images/placeholder.svg') {
                              return (
                                <Image
                                  src={imageUrl}
                                  alt={imageAlt}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                />
                              );
                            } else {
                              return (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <div className="p-4">
                          <time className="text-sm text-gray-500 mb-2 block">
                            {formatDate(post.date)}
                          </time>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {decodeHtmlEntities(post.title.rendered)}
                          </h3>
                          <div 
                            className="text-gray-600 line-clamp-3 text-sm"
                            dangerouslySetInnerHTML={{ 
                              __html: decodeHtmlEntities(post.excerpt.rendered) 
                            }}
                          />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Grid */}
            {displayPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {displayPosts.map((post) => (
                    <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="relative aspect-square">
                          {(() => {
                            const imageUrl = getFeaturedImageUrl(post);
                            const imageAlt = getFeaturedImageAlt(post);
                            
                            if (imageUrl && imageUrl !== '/images/placeholder.svg') {
                              return (
                                <Image
                                  src={imageUrl}
                                  alt={imageAlt}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              );
                            } else {
                              return (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <div className="p-6">
                          <time className="text-sm text-gray-500 mb-2 block">
                            {formatDate(post.date)}
                          </time>
                          <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                            {decodeHtmlEntities(post.title.rendered)}
                          </h2>
                          <div 
                            className="text-gray-600 line-clamp-3"
                            dangerouslySetInnerHTML={{ 
                              __html: decodeHtmlEntities(post.excerpt.rendered) 
                            }}
                          />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Pagination - Only show for regular posts, not search results */}
                {showPagination && !searchQuery.trim() && totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      {currentPage > 1 && (
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Previous
                        </button>
                      )}
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 text-sm font-medium rounded-md ${
                            page === currentPage
                              ? 'bg-[#1e2939] text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      {currentPage < totalPages && (
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Next
                        </button>
                      )}
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">
                    {searchQuery.trim() ? 'No search results found' : 'No posts found'}
                  </p>
                  <p className="text-sm">
                    {searchQuery.trim() 
                      ? 'Try adjusting your search terms or browse all posts.'
                      : 'Try adjusting your filters or check back later.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 