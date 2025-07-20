'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPosts, fetchCategories, type WordPressPost } from '../lib/wordpress';

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

interface WordPressBlogProps {
  initialPosts?: WordPressPost[];
  postsPerPage?: number;
}

export default function WordPressBlog({ initialPosts = [], postsPerPage = 6 }: WordPressBlogProps) {
  const [posts, setPosts] = useState<WordPressPost[]>(initialPosts);
  const [loading, setLoading] = useState(!initialPosts.length);
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load posts if not provided as props
        if (!initialPosts.length) {
          const fetchedPosts = await fetchPosts({
            per_page: postsPerPage,
            page: currentPage,
            categories: selectedCategory ? [selectedCategory] : undefined,
          });
          setPosts(fetchedPosts);
        }

        // Load categories
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories as unknown as WordPressCategory[]);
      } catch (error) {
        console.error('Error loading blog data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, selectedCategory, initialPosts.length, postsPerPage]);

  const handleCategoryChange = async (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    
    try {
      setLoading(true);
      const fetchedPosts = await fetchPosts({
        per_page: postsPerPage,
        page: 1,
        categories: categoryId ? [categoryId] : undefined,
      });
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error filtering posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    
    try {
      setLoading(true);
      const fetchedPosts = await fetchPosts({
        per_page: postsPerPage,
        page,
        categories: selectedCategory ? [selectedCategory] : undefined,
      });
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(postsPerPage)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 serif">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-[#1e2939] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Posts
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[#1e2939] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Featured Image */}
            {post.featured_media && (
              <div className="aspect-square relative">
                <Image
                  src={`https://api.cowboykimono.com/wp-content/uploads/${post.featured_media}.jpg`}
                  alt={post.title.rendered}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-t-lg transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
            
            {/* Post Content */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 serif line-clamp-2">
                    <Link href={`/blog/${post.slug}`} className="text-[#1e2939] hover:text-[#2a3441]">
                      {post.title.rendered}
                    </Link>
                  </h2>
              
              <div className="text-gray-600 text-sm mb-3">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              
              <div 
                className="text-gray-700 mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
              />
              
              <Link 
                href={`/blog/${post.slug}`} 
                className="text-[#1e2939] hover:text-[#2a3441] font-medium"
              >
                Read More →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {posts.length === postsPerPage && (
        <div className="mt-12 flex justify-center">
          <div className="flex space-x-2">
            {currentPage > 1 && (
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-4 py-2 bg-[#1e2939] text-white rounded hover:bg-[#2a3441] transition-colors"
              >
                Previous
              </button>
            )}
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded">
              Page {currentPage}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 bg-[#1e2939] text-white rounded hover:bg-[#2a3441] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-2 serif">No posts found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
} 