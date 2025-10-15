import { MetadataRoute } from 'next';
import { fetchCategories, fetchPosts, fetchTags } from './lib/api';

// Enhanced sitemap configuration
const SITEMAP_CONFIG = {
  MAX_POSTS: 100, // Reduced to avoid WordPress API limits
  MAX_CATEGORIES: 100,
  MAX_TAGS: 100,
  CACHE_TTL: 3600000, // 1 hour cache
  PRIORITY_DECAY: 0.1, // How much priority decreases for older posts
};

// Ensure canonical URL (non-www as per site redirects)
function getCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Force non-www domain to match site redirects
    parsed.hostname = parsed.hostname.replace(/^www\./, '');
    return parsed.toString();
  } catch {
    return url;
  }
}

// Enhanced sitemap generation with proper canonicalization
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Force canonical URL (non-www) regardless of environment variable
  // This ensures all sitemap URLs are non-www to prevent redirect loops
  // CRITICAL: Always use non-www to match site redirects and prevent SEO issues
  const baseUrl = 'https://cowboykimono.com';

  // High priority core pages
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/downloads`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/custom-kimonos`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Batch all API calls in parallel for faster generation
  let blogUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  let tagUrls: MetadataRoute.Sitemap = [];

  try {
    const [posts, categories, tags] = await Promise.all([
      fetchPosts({ per_page: SITEMAP_CONFIG.MAX_POSTS }),
      fetchCategories(),
      fetchTags(),
    ]);

    // Process blog posts
    if (posts && Array.isArray(posts)) {
      blogUrls = posts
        .filter((post) => post && post.status === 'publish')
        .map((post, index) => {
          // Calculate priority based on recency and importance
          const basePriority = 0.9;
          const recencyBonus = Math.max(0, 0.1 - index * 0.01); // Newer posts get higher priority
          const finalPriority = Math.max(
            0.3,
            basePriority - index * SITEMAP_CONFIG.PRIORITY_DECAY + recencyBonus
          );

          return {
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.modified || post.date),
            changeFrequency: 'monthly' as const,
            priority: finalPriority,
          };
        });
    }

    // Process categories
    if (categories && Array.isArray(categories)) {
      categoryUrls = categories
        .filter((cat) => cat && cat.count > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0)) // Sort by post count
        .map((category, index) => {
          // Calculate priority based on post count
          const postCount = category.count || 0;
          const priority = Math.max(
            0.4,
            0.8 - index * 0.05 + (postCount > 10 ? 0.1 : 0)
          );

          return {
            url: `${baseUrl}/blog/category/${category.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority,
          };
        });
    }

    // Process tags
    if (tags && Array.isArray(tags)) {
      tagUrls = tags
        .filter((tag) => tag && tag.count > 0)
        .sort((a, b) => (b.count || 0) - (a.count || 0)) // Sort by post count
        .map((tag, index) => {
          // Calculate priority based on post count
          const postCount = tag.count || 0;
          const priority = Math.max(
            0.3,
            0.7 - index * 0.05 + (postCount > 5 ? 0.1 : 0)
          );

          return {
            url: `${baseUrl}/blog/tag/${tag.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority,
          };
        });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching data for sitemap:', error);
    }
  }

  // Enhanced downloads section with specific download pages
  const downloadUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/downloads`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Add specific download category pages if they exist
    {
      url: `${baseUrl}/downloads/coloring-pages`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/downloads/craft-templates`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/downloads/diy-tutorials`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Combine all sitemap entries
  const allUrls = [
    ...corePages,
    ...blogUrls,
    ...categoryUrls,
    ...tagUrls,
    ...downloadUrls,
  ];

  // Ensure all URLs are canonical (non-www)
  const canonicalUrls = allUrls.map((entry) => ({
    ...entry,
    url: getCanonicalUrl(entry.url),
  }));

  // Log sitemap generation info in development
  if (process.env.NODE_ENV === 'development') {
    // Removed console.log statements for production readiness
  }

  return canonicalUrls;
}
