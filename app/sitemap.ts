import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cowboykimono.com';

  // Fetch blog post slugs from WordPress
  let blogUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  let tagUrls: MetadataRoute.Sitemap = [];
  
  try {
    // Fetch posts
    const postsRes = await fetch('https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=100');
    if (postsRes.ok) {
      const posts: { slug: string; modified?: string; date: string }[] = await postsRes.json();
      blogUrls = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.modified || post.date).toISOString(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    }

    // Fetch categories
    const categoriesRes = await fetch('https://api.cowboykimono.com/wp-json/wp/v2/categories?per_page=100');
    if (categoriesRes.ok) {
      const categories: { slug: string; count: number }[] = await categoriesRes.json();
      categoryUrls = categories
        .filter(cat => cat.count > 0) // Only include categories with posts
        .map((category) => ({
          url: `${baseUrl}/blog/category/${category.slug}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.6,
        }));
    }

    // Fetch tags
    const tagsRes = await fetch('https://api.cowboykimono.com/wp-json/wp/v2/tags?per_page=100');
    if (tagsRes.ok) {
      const tags: { slug: string; count: number }[] = await tagsRes.json();
      tagUrls = tags
        .filter(tag => tag.count > 0) // Only include tags with posts
        .map((tag) => ({
          url: `${baseUrl}/blog/tag/${tag.slug}`,
          lastModified: new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.5,
        }));
    }
  } catch {
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

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.8,
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
    ...blogUrls,
    ...categoryUrls,
    ...tagUrls,
    ...downloadUrls,
  ];
}
