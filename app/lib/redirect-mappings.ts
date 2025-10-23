// Comprehensive Redirect Mappings for SEO Audit
// This file contains all redirects needed to fix 404 errors and improve indexation

export interface RedirectMapping {
  source: string;
  destination: string;
  permanent: boolean;
  category:
    | 'blog'
    | 'downloads'
    | 'wordpress-legacy'
    | 'canonical'
    | 'old-patterns';
  reason: string;
}

// Common WordPress legacy patterns that need redirects
const WORDPRESS_LEGACY_PATTERNS: RedirectMapping[] = [
  // Old WordPress date-based URLs
  {
    source: '/:year(\\d{4})/:month(\\d{2})/:slug',
    destination: '/blog/:slug',
    permanent: true,
    category: 'wordpress-legacy',
    reason: 'WordPress date-based URLs to blog structure',
  },
  // Old WordPress category URLs
  {
    source: '/category/:category',
    destination: '/blog/category/:category',
    permanent: true,
    category: 'wordpress-legacy',
    reason: 'WordPress category URLs to new structure',
  },
  // Old WordPress tag URLs
  {
    source: '/tag/:tag',
    destination: '/blog/tag/:tag',
    permanent: true,
    category: 'wordpress-legacy',
    reason: 'WordPress tag URLs to new structure',
  },
  // Old WordPress author URLs
  {
    source: '/author/:author',
    destination: '/blog',
    permanent: true,
    category: 'wordpress-legacy',
    reason: 'WordPress author URLs redirect to blog index',
  },
  // Old WordPress feed URLs
  {
    source: '/feed',
    destination: '/feed.xml',
    permanent: true,
    category: 'wordpress-legacy',
    reason: 'WordPress RSS feed to new feed.xml',
  },
  {
    source: '/feed/',
    destination: '/feed.xml',
    permanent: true,
    category: 'wordpress-legacy',
    reason: 'WordPress RSS feed to new feed.xml',
  },
];

// Known problematic URLs from robots.txt that might be causing issues
const BLOCKED_URLS_REDIRECTS: RedirectMapping[] = [
  // Redirect old shop URLs
  {
    source: '/shop-1',
    destination: '/shop',
    permanent: true,
    category: 'old-patterns',
    reason: 'Old shop URL to current shop page',
  },
  // Redirect old contact URLs
  {
    source: '/contact-2',
    destination: '/about',
    permanent: true,
    category: 'old-patterns',
    reason: 'Old contact URL to about page',
  },
  // Redirect old kimono builder
  {
    source: '/kimono-builder',
    destination: '/custom-kimonos',
    permanent: true,
    category: 'old-patterns',
    reason: 'Old kimono builder to custom kimonos page',
  },
];

// Common blog post redirects (these would be populated from GSC 404 data)
const BLOG_REDIRECTS: RedirectMapping[] = [
  // Example: Known blog post redirects
  {
    source: '/blog/how-to-create-a-hip-jackalope-display',
    destination: '/blog/jackalope-garden-display-diy',
    permanent: true,
    category: 'blog',
    reason: 'Blog post slug change',
  },
  // Add more blog redirects as needed from GSC data
];

// Download page redirects
const DOWNLOAD_REDIRECTS: RedirectMapping[] = [
  // Common download URL patterns
  {
    source: '/downloads/:category/:slug/',
    destination: '/downloads/:category/:slug',
    permanent: true,
    category: 'downloads',
    reason: 'Remove trailing slash from download URLs',
  },
];

// Canonical redirects (www to non-www)
const CANONICAL_REDIRECTS: RedirectMapping[] = [
  {
    source: '/:path*',
    destination: 'https://cowboykimono.com/:path*',
    permanent: true,
    category: 'canonical',
    reason: 'WWW to non-WWW canonical redirect',
  },
];

// Combine all redirect mappings
export const ALL_REDIRECT_MAPPINGS: RedirectMapping[] = [
  ...CANONICAL_REDIRECTS,
  ...WORDPRESS_LEGACY_PATTERNS,
  ...BLOCKED_URLS_REDIRECTS,
  ...BLOG_REDIRECTS,
  ...DOWNLOAD_REDIRECTS,
];

// Get redirects by category
export function getRedirectsByCategory(
  category: RedirectMapping['category']
): RedirectMapping[] {
  return ALL_REDIRECT_MAPPINGS.filter(
    (redirect) => redirect.category === category
  );
}

// Get all redirects formatted for Next.js
export function getNextJsRedirects() {
  return ALL_REDIRECT_MAPPINGS.map((redirect) => ({
    source: redirect.source,
    destination: redirect.destination,
    permanent: redirect.permanent,
  }));
}

// Add a new redirect mapping
export function addRedirectMapping(mapping: RedirectMapping): void {
  // Check if redirect already exists
  const exists = ALL_REDIRECT_MAPPINGS.some(
    (r) => r.source === mapping.source && r.destination === mapping.destination
  );

  if (!exists) {
    ALL_REDIRECT_MAPPINGS.push(mapping);
    console.warn(
      `Added redirect mapping: ${mapping.source} → ${mapping.destination} (${mapping.reason})`
    );
  }
}

// Remove a redirect mapping
export function removeRedirectMapping(source: string): void {
  const index = ALL_REDIRECT_MAPPINGS.findIndex((r) => r.source === source);
  if (index > -1) {
    const removed = ALL_REDIRECT_MAPPINGS.splice(index, 1)[0];
    if (removed) {
      console.warn(
        `Removed redirect mapping: ${removed.source} → ${removed.destination}`
      );
    }
  }
}

// Get redirect statistics
export function getRedirectStats() {
  const stats = {
    total: ALL_REDIRECT_MAPPINGS.length,
    byCategory: {} as Record<string, number>,
    permanent: 0,
    temporary: 0,
  };

  ALL_REDIRECT_MAPPINGS.forEach((redirect) => {
    // Count by category
    stats.byCategory[redirect.category] =
      (stats.byCategory[redirect.category] || 0) + 1;

    // Count permanent vs temporary
    if (redirect.permanent) {
      stats.permanent++;
    } else {
      stats.temporary++;
    }
  });

  return stats;
}

// Validate redirect mappings
export function validateRedirectMappings(): {
  valid: RedirectMapping[];
  invalid: RedirectMapping[];
} {
  const valid: RedirectMapping[] = [];
  const invalid: RedirectMapping[] = [];

  ALL_REDIRECT_MAPPINGS.forEach((redirect) => {
    // Basic validation
    if (!redirect.source || !redirect.destination) {
      invalid.push(redirect);
      return;
    }

    // Check for redirect loops
    if (redirect.source === redirect.destination) {
      invalid.push(redirect);
      return;
    }

    // Check for valid source patterns
    if (redirect.source.includes('**') && !redirect.source.includes('/**')) {
      invalid.push(redirect);
      return;
    }

    valid.push(redirect);
  });

  return { valid, invalid };
}

// Export for use in redirect-manager.ts
export default ALL_REDIRECT_MAPPINGS;
