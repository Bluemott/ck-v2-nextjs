'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BlogSidebar from '../components/BlogSidebar';
import { fetchPosts, type WordPressPost } from '../lib/wordpress';

const POSTS_PER_PAGE = 6;

const BlogClient = () => {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const fetchedPosts = await fetchPosts({
          per_page: POSTS_PER_PAGE,
          page: currentPage,
        });
        
        setPosts(fetchedPosts);
        
        // For now, we'll estimate total pages based on posts returned
        // In a real implementation, you might want to add a separate API call to get total count
        setTotalPosts(fetchedPosts.length * currentPage); // This is an approximation
        setTotalPages(Math.ceil(fetchedPosts.length / POSTS_PER_PAGE));
      } catch (err) {
        setError('Failed to load blog posts. Please try again later.');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

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
          className="px-3 py-2 mx-1 bg-white text-gray-600 border rounded hover:bg-gray-50 transition-colors"
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
          className={`px-3 py-2 mx-1 border rounded transition-colors ${
            i === currentPage
              ? 'bg-[#1e2939] text-white border-[#1e2939]'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 mx-1 bg-white text-gray-600 border rounded hover:bg-gray-50 transition-colors"
        >
          Next →
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-12">
        <div className="flex flex-wrap justify-center">
          {pages}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/CK_Logo_Blog.png"
              alt="Blog Header"
              width={400}
              height={100}
              className="max-w-full h-auto"
            />
          </div>
          <p className="text-gray-600 text-lg">
            Discover stories, inspiration, and insights from the world of Cowboy Kimono
          </p>
          {totalPosts > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing page {currentPage} of {totalPages} ({totalPosts} total posts)
            </p>
          )}
        </div>
        
        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No blog posts found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                      <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col">
                        {/* Featured Image - Using WordPress media URL */}
                        {post.featured_media && (
                          <div className="relative w-full overflow-hidden">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_URL}/${post.featured_media}.jpg`}
                              alt={post.title.rendered}
                              width={0}
                              height={0}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="w-full h-auto transition-transform duration-300 hover:scale-105"
                              style={{ width: '100%', height: 'auto' }}
                            />
                          </div>
                        )}
                        
                        {/* Content - Flexible Height */}
                        <div className="p-6 flex-1 flex flex-col">
                          <h2 className="text-xl font-semibold mb-3 text-gray-900 line-clamp-2 leading-tight serif"
                              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                          />
                          
                          <p className="text-gray-600 text-sm mb-3 font-medium">
                            {formatDate(post.date)}
                          </p>
                          
                          <div 
                            className="text-gray-900 mb-6 line-clamp-3 leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{ 
                              __html: post.excerpt.rendered.substring(0, 120) + '...'
                            }}
                          />
                          
                          <div className="inline-flex items-center text-[#1e2939] hover:text-[#2a3441] font-medium transition-colors group mt-auto">
                            Read More 
                            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
                
                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-80">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogClient;
