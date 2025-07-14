import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimonos.com';

  // Fetch blog post slugs from WordPress
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch('https://cowboykimono.com/blog.html/wp-json/wp/v2/posts?per_page=100');
    if (res.ok) {
      const posts: { slug: string; modified?: string; date: string }[] = await res.json();
      blogUrls = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.modified || post.date,
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    }
  } catch {
    // Fallback: do nothing
  }

  // Statically known downloads (add more as needed)
  const downloadUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/downloads`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Add more download URLs if you have dynamic download pages
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...blogUrls,
    ...downloadUrls,
  ];
}
