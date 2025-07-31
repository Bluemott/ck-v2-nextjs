import { MetadataRoute } from 'next'
import { fetchPosts, fetchCategories, fetchTags } from './lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cowboykimono.com';

  // Fetch blog post slugs from WPGraphQL
  let blogUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  let tagUrls: MetadataRoute.Sitemap = [];
  
  try {
    // Fetch posts - only include published posts
    const posts = await fetchPosts({ first: 100 });
    blogUrls = posts
      .filter(post => post.status === 'publish') // Only include published posts
      .map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.modified || post.date).toISOString(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));

    // Fetch categories
    const categories = await fetchCategories();
    categoryUrls = categories
      .filter(cat => cat.count > 0) // Only include categories with posts
      .map((category) => ({
        url: `${baseUrl}/blog/category/${category.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

    // Fetch tags
    const tags = await fetchTags();
    tagUrls = tags
      .filter(tag => tag.count > 0) // Only include tags with posts
      .map((tag) => ({
        url: `${baseUrl}/blog/tag/${tag.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.5,
      }));
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Fallback: do nothing
  }

  // Statically known downloads (add more as needed)
  const downloadUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/downloads`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Add more download URLs if you have dynamic download pages
  ];

  // Core site pages - only include pages that actually exist and have content
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
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
