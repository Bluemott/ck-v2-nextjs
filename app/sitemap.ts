import { MetadataRoute } from 'next'
import { fetchPosts, fetchCategories, fetchTags } from './lib/api'
import { env } from './lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  // Fetch blog post slugs from WordPress REST API
  let blogUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  let tagUrls: MetadataRoute.Sitemap = [];
  
  try {
    // Fetch posts - only include published posts
    const posts = await fetchPosts({ per_page: 100 });
    if (posts && Array.isArray(posts)) {
      blogUrls = posts
        .filter(post => post && post.status === 'publish') // Only include published posts
        .map((post) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: new Date(post.modified || post.date).toISOString(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching posts for sitemap:', error);
    }
    // Continue with empty blogUrls array
  }

  try {
    // Fetch categories
    const categories = await fetchCategories();
    if (categories && Array.isArray(categories)) {
      categoryUrls = categories
        .filter(cat => cat && cat.count > 0) // Only include categories with posts
        .map((category) => ({
          url: `${baseUrl}/blog/category/${category.slug}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }));
    }
  } catch (error) {
    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching categories for sitemap:', error);
    }
    // Continue with empty categoryUrls array
  }

  try {
    // Fetch tags
    const tags = await fetchTags();
    if (tags && Array.isArray(tags)) {
      tagUrls = tags
        .filter(tag => tag && tag.count > 0) // Only include tags with posts
        .map((tag) => ({
          url: `${baseUrl}/blog/tag/${tag.slug}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        }));
    }
  } catch (error) {
    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching tags for sitemap:', error);
    }
    // Continue with empty tagUrls array
  }

  // Statically known downloads (add more as needed)
  const downloadUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/downloads`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Add more download URLs if you have dynamic download pages
  ];

  // Core site pages - only include pages that actually exist and have content
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  return [
    ...corePages,
    ...blogUrls,
    ...categoryUrls,
    ...tagUrls,
    ...downloadUrls,
  ];
}
