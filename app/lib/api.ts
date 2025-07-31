// Unified API Layer for WordPress Blog
// Conditionally uses WordPress GraphQL or AWS GraphQL based on feature flag

// Re-export types for compatibility
export type { 
  WPGraphQLPost, 
  WPGraphQLCategory, 
  WPGraphQLTag
} from './wpgraphql';

export type {
  AWSGraphQLPost,
  AWSGraphQLCategory,
  AWSGraphQLTag,
  AWSGraphQLPostsConnection,
  AWSGraphQLPageInfo
} from './aws-graphql';

// Feature flag to switch between WordPress and AWS GraphQL
const USE_AWS_GRAPHQL = process.env.NEXT_PUBLIC_USE_AWS_GRAPHQL === 'true';
const USE_TEMP_WORDPRESS = process.env.NODE_ENV === 'development' && !USE_AWS_GRAPHQL;

// Debug logging
console.log('🔧 API Configuration:', {
  USE_AWS_GRAPHQL,
  AWS_GRAPHQL_URL: process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL,
  WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL
});

// Dynamically import the appropriate API functions
let apiFunctions: Record<string, unknown> | null = null;

async function getAPIFunctions() {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      console.log('🔗 Using temporary WordPress data (development)');
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      console.log('🔗 Using AWS GraphQL API');
      apiFunctions = await import('./aws-graphql');
    } else {
      console.log('🔗 Using WordPress GraphQL API');
      apiFunctions = await import('./wpgraphql');
    }
  }
  return apiFunctions;
}

// Unified interface functions that work with both APIs
export async function fetchPosts(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<any[]> {
  const api = await getAPIFunctions();
  return api.fetchPosts(params);
}

export async function fetchPostBySlug(slug: string): Promise<any | null> {
  const api = await getAPIFunctions();
  return api.fetchPostBySlug(slug);
}

export async function fetchCategories(): Promise<any[]> {
  const api = await getAPIFunctions();
  return api.fetchCategories();
}

export async function fetchTags(): Promise<any[]> {
  const api = await getAPIFunctions();
  return api.fetchTags();
}

export async function fetchPostsWithPagination(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<{
  posts: any[];
  pageInfo: any;
  totalCount: number;
}> {
  const api = await getAPIFunctions();
  return api.fetchPostsWithPagination(params);
}

export async function fetchCategoryBySlug(slug: string): Promise<any | null> {
  const api = await getAPIFunctions();
  return api.fetchCategoryBySlug(slug);
}

export async function fetchTagBySlug(slug: string): Promise<any | null> {
  const api = await getAPIFunctions();
  return api.fetchTagBySlug(slug);
}

export async function fetchAdjacentPosts(slug: string): Promise<any[]> {
  const api = await getAPIFunctions();
  return api.fetchAdjacentPosts(slug);
}

export function getWordPressAdminUrl(): string {
  return process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com';
}

export async function fetchRelatedPosts(currentPostSlug: string, limit: number = 3): Promise<any[]> {
  const api = await getAPIFunctions();
  return api.fetchRelatedPosts(currentPostSlug, limit);
}

// Utility functions that work with both APIs
export function decodeHtmlEntities(text: string): string {
  // This function should work the same for both APIs
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function getFeaturedImageUrl(post: any, size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'): string | null {
  // Handle both WordPress and AWS GraphQL post structures
  if (post.featuredImage) {
    return post.featuredImage.sourceUrl;
  }
  return null;
}

export function getFeaturedImageAlt(post: any): string {
  // Handle both WordPress and AWS GraphQL post structures
  if (post.featuredImage) {
    return post.featuredImage.altText || '';
  }
  return '';
}

// Test function to verify which API is being used
export async function testAPIEndpoint(): Promise<{ api: string; url: string }> {
  const api = await getAPIFunctions();
  
  if (USE_AWS_GRAPHQL) {
    return {
      api: 'AWS GraphQL',
      url: process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL || 'Not configured'
    };
  } else {
    return {
      api: 'WordPress GraphQL',
      url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'Not configured'
    };
  }
} 