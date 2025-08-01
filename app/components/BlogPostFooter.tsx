'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPosts, fetchCategories, fetchTags, type BlogPost, type WPRestCategory, type WPRestTag, decodeHtmlEntities } from '../lib/api';
import WordPressImage from './WordPressImage';
import SocialShare from './SocialShare';
import PostNavigation from './PostNavigation';

interface BlogPostFooterProps {
  postTitle: string;
  postUrl: string;
  previousPost?: BlogPost | null;
  nextPost?: BlogPost | null;
}

const BlogPostFooter = ({ postTitle, postUrl, previousPost, nextPost }: BlogPostFooterProps) => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<WPRestCategory[]>([]);
  const [tags, setTags] = useState<WPRestTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [recentData, categoriesData, tagsData] = await Promise.all([
          fetchPosts({ first: 4 }),
          fetchCategories(),
          fetchTags()
        ]);
        
        setRecentPosts(recentData);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch {
        // Remove console.error for production - footer data failure is non-critical
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
               <h3 className="text-lg font-bold mb-4 text-gray-800">More posts</h3>
               <PostNavigation previousPost={previousPost || null} nextPost={nextPost || null} />
             </div>
           </div>
         </div>

        {/* Categories and Tags */}
        <div className="p-6 lg:p-8 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800">Browse Categories</h3>
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
                <h3 className="text-lg font-bold mb-4 text-gray-800">Popular Tags</h3>
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
            <h3 className="text-lg font-bold text-gray-800">Recent Posts</h3>
            <Link 
              href="/blog"
              className="text-sm font-medium text-[#1e2939] hover:text-[#2a3441] transition-colors"
            >
              View all posts →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-32 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                  <article className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-gray-200">
                    {/* Featured Image */}
                    {post.featuredImage?.node && (
                      <div className="relative h-32 overflow-hidden">
                        <WordPressImage
                          post={post}
                          size="medium"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#1e2939] line-clamp-2 transition-colors leading-tight serif">
                        {decodeHtmlEntities(post.title)}
                      </h4>
                      <p className="text-xs text-gray-500 mt-2 font-medium">
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