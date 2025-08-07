'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  decodeHtmlEntities,
  fetchCategories,
  fetchPosts,
  fetchTags,
  type BlogPost,
  type WPRestCategory,
  type WPRestTag,
} from '../lib/api';
import PostNavigation from './PostNavigation';
import SocialShare from './SocialShare';
import WordPressImage from './WordPressImage';

interface BlogPostFooterProps {
  postTitle: string;
  postUrl: string;
  currentPostSlug?: string;
  previousPost?: BlogPost | null;
  nextPost?: BlogPost | null;
}

const BlogPostFooter = ({
  postTitle,
  postUrl,
  currentPostSlug,
  previousPost,
  nextPost,
}: BlogPostFooterProps) => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<WPRestCategory[]>([]);
  const [tags, setTags] = useState<WPRestTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [recentData, categoriesData, tagsData] = await Promise.all([
          fetchPosts({
            per_page: 10,
          }), // Fetch more to account for filtering
          fetchCategories(),
          fetchTags(),
        ]);

        // Filter out the current post and take exactly 4
        const filteredPosts = recentData
          .filter((post) => post.slug !== currentPostSlug)
          .slice(0, 4);

        setRecentPosts(filteredPosts);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch {
        // Remove console.error for production - footer data failure is non-critical
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPostSlug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="border-t border-gray-200 pt-10 mt-12">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Social Share and Post Navigation */}
        <div className="p-6 lg:p-8 border-b border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Social Share */}
            <div>
              <SocialShare postTitle={postTitle} postUrl={postUrl} />
            </div>

            {/* Post Navigation */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-800 serif">
                More posts
              </h3>
              <PostNavigation
                previousPost={previousPost || null}
                nextPost={nextPost || null}
              />
            </div>
          </div>
        </div>

        {/* Categories and Tags */}
        <div className="p-6 lg:p-8 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 serif">
                  Browse Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/blog/category/${category.slug}`}
                      className="px-3 py-2 bg-[#1e2939] text-white rounded-full text-sm font-medium hover:bg-[#2a3441] transition-all duration-300 hover:shadow-md"
                    >
                      {decodeHtmlEntities(category.name)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 serif">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog/tag/${tag.slug}`}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 hover:shadow-md"
                    >
                      {decodeHtmlEntities(tag.name)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 serif">
              Recent Posts
            </h3>
            <Link
              href="/blog"
              className="text-sm font-medium text-[#1e2939] hover:text-[#2a3441] transition-colors"
            >
              View all posts →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:-translate-y-1">
                    {/* Featured Image */}
                    <div className="relative h-48 overflow-hidden">
                      {post._embedded?.['wp:featuredmedia']?.[0] ? (
                        <WordPressImage
                          post={post}
                          size="medium"
                          fill={true}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          onError={() => {
                            console.warn(
                              'BlogPostFooter - Image failed to load for post:',
                              {
                                postId: post.id,
                                postTitle: post.title?.rendered,
                                hasEmbedded: !!post._embedded,
                                hasFeaturedMedia:
                                  !!post._embedded?.['wp:featuredmedia'],
                              }
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Subtle overlay on hover */}
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#1e2939] line-clamp-2 transition-colors leading-tight serif mb-2">
                        {decodeHtmlEntities(post.title?.rendered || 'Untitled')}
                      </h4>
                      <p className="text-sm text-gray-500 font-medium">
                        {formatDate(post.date)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostFooter;
