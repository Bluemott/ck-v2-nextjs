// Redirect Manager for Dynamic Slug Changes
// This utility manages redirects that can be updated without rebuilding the entire Next.js config

export interface RedirectEntry {
  source: string;
  destination: string;
  permanent: boolean;
}

export interface SlugChangeData {
  oldSlug: string;
  newSlug: string;
  postId: number;
  postTitle: string;
}

// In-memory redirect storage (in production, this could be a database)
let dynamicRedirects: RedirectEntry[] = [];

/**
 * Add a new redirect for a slug change
 */
export function addSlugRedirect(oldSlug: string, newSlug: string): void {
  const redirect: RedirectEntry = {
    source: `/blog/${oldSlug}`,
    destination: `/blog/${newSlug}`,
    permanent: true,
  };
  
  // Remove any existing redirect for the old slug
  dynamicRedirects = dynamicRedirects.filter(r => r.source !== redirect.source);
  
  // Add the new redirect
  dynamicRedirects.push(redirect);
  
  console.log(`Added redirect: ${redirect.source} → ${redirect.destination}`);
}

/**
 * Get all dynamic redirects
 */
export function getDynamicRedirects(): RedirectEntry[] {
  return [...dynamicRedirects];
}

/**
 * Remove a redirect
 */
export function removeRedirect(source: string): void {
  dynamicRedirects = dynamicRedirects.filter(r => r.source !== source);
  console.log(`Removed redirect: ${source}`);
}

/**
 * Handle a slug change by adding the redirect
 */
export function handleSlugChange(data: SlugChangeData): void {
  const { oldSlug, newSlug, postId, postTitle } = data;
  
  console.log(`Handling slug change for post "${postTitle}" (ID: ${postId})`);
  console.log(`Old slug: ${oldSlug} → New slug: ${newSlug}`);
  
  addSlugRedirect(oldSlug, newSlug);
}

/**
 * Get redirects for Next.js config
 */
export function getRedirectsForNextConfig(): RedirectEntry[] {
  return [
    // Static redirects (from next.config.ts)
    {
      source: '/blog/how-to-create-a-hip-jackalope-display',
      destination: '/blog/jackalope-garden-display-diy',
      permanent: true,
    },
    // Dynamic redirects (from slug changes)
    ...dynamicRedirects
  ];
}

/**
 * Export redirects for use in Next.js config
 */
export function createRedirectsConfig() {
  return getRedirectsForNextConfig();
} 