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

// Re-export media URL conversion functions
export { convertToS3Url, debugUrlConversion } from './wpgraphql';

// Feature flag to switch between WordPress and AWS GraphQL
const USE_AWS_GRAPHQL = process.env.NEXT_PUBLIC_USE_AWS_GRAPHQL === 'true';
const USE_TEMP_WORDPRESS = process.env.NODE_ENV === 'development' && !USE_AWS_GRAPHQL;

// Debug logging
// console.log('🔧 API Configuration:', {
//   USE_AWS_GRAPHQL,
//   AWS_GRAPHQL_URL: process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL,
//   WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL
// });

// Dynamically import the appropriate API functions
let apiFunctions: any = null;

export async function fetchPosts(params?: any): Promise<any[]> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      // console.log('🔗 Using temporary WordPress data (development)');
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      // console.log('🔗 Using AWS GraphQL API');
      apiFunctions = await import('./aws-graphql');
    } else {
      // console.log('🔗 Using WordPress GraphQL API');
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchPosts(params);
}

export async function fetchPostBySlug(slug: string): Promise<any | null> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchPostBySlug(slug);
}

export async function fetchCategories(): Promise<any[]> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchCategories();
}

export async function fetchTags(): Promise<any[]> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchTags();
}

export async function fetchPostsWithPagination(params?: any): Promise<any> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchPostsWithPagination(params);
}

export async function fetchCategoryBySlug(slug: string): Promise<any | null> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchCategoryBySlug(slug);
}

export async function fetchTagBySlug(slug: string): Promise<any | null> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchTagBySlug(slug);
}

export async function fetchAdjacentPosts(slug: string): Promise<any> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchAdjacentPosts(slug);
}

export async function fetchRelatedPosts(slug: string, categoryIds: string[], tagIds: string[]): Promise<any[]> {
  if (!apiFunctions) {
    if (USE_TEMP_WORDPRESS) {
      apiFunctions = await import('./temp-wordpress');
    } else if (USE_AWS_GRAPHQL) {
      apiFunctions = await import('./aws-graphql');
    } else {
      apiFunctions = await import('./wpgraphql');
    }
  }
  
  return apiFunctions.fetchRelatedPosts(slug, categoryIds, tagIds);
}

export function getWordPressAdminUrl(): string {
  return process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com';
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

export function getFeaturedImageUrl(post: any): string | null {
  // This function should work the same for both APIs
  if (post.featuredImage?.node?.sourceUrl) {
    return post.featuredImage.node.sourceUrl;
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

export async function fetchWordPressData(query: string, variables: any = {}) {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching WordPress data:', error);
    throw error;
  }
}

export function formatFileSize(_size: number): string {
  // This function should work the same for both APIs
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = _size;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
} 