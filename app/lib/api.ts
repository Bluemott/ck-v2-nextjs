import { env, isAWSGraphQLEnabled, isDevelopment } from './env';
import { validateBlogPost, validateSearchParams, BlogPost, SearchParams } from './validation';
import { graphqlAdapter } from './graphql-adapter';
import { z } from 'zod';

// API Configuration with validated environment variables
const API_CONFIG = {
  AWS_GRAPHQL_URL: env.NEXT_PUBLIC_AWS_GRAPHQL_URL,
  WORDPRESS_URL: env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL,
  WORDPRESS_ADMIN_URL: env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL,
  WPGRAPHQL_URL: env.NEXT_PUBLIC_WPGRAPHQL_URL,
  USE_AWS_GRAPHQL: isAWSGraphQLEnabled,
  USE_TEMP_WORDPRESS: isDevelopment && !isAWSGraphQLEnabled,
};

// GraphQL Query Schema for API responses
const graphqlResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({
    message: z.string(),
    locations: z.array(z.object({
      line: z.number(),
      column: z.number()
    })).optional(),
    path: z.array(z.unknown()).optional(),
    extensions: z.record(z.string(), z.unknown()).optional()
  })).optional(),
  extensions: z.record(z.string(), z.unknown()).optional()
});

export type GraphQLResponse = z.infer<typeof graphqlResponseSchema>;

// Blog Post Response Schema
export type BlogPostsResponse = {
  posts: any[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
};

// Category Response Schema
export type CategoryResponse = {
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    count?: number;
  };
};

// Tag Response Schema
export type TagResponse = {
  tag?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    count?: number;
  };
};

/**
 * Fetch posts with validation using the GraphQL adapter
 */
export async function fetchPosts(params: SearchParams = {}): Promise<BlogPost[]> {
  try {
    // Validate search parameters
    const validatedParams = validateSearchParams(params);
    
    // Simplified variables for AWS compatibility
    const variables = {
      first: validatedParams.perPage || 12,
    };

    const query = graphqlAdapter.getPostsQuery();
    
    if (isAWSGraphQLEnabled) {
      // AWS GraphQL returns direct array, not wrapped in nodes
      const response = await graphqlAdapter.executeQuery<{
        posts: any[];
      }>(query, variables);

      const posts = response.posts || [];
      
      // For AWS, add minimal structure to match expected format
      const formattedPosts = posts.map((post: any) => ({
        ...post,
        featuredImage: null, // Will be populated by SEO queries when needed
        categories: { nodes: [] },
        tags: { nodes: [] },
        seo: null,
        author: {
          node: {
            id: '1',
            name: 'Cowboy Kimono',
            slug: 'cowboy-kimono',
            avatar: { url: '' }
          }
        }
      }));
      
      // Validate each post
      const validatedPosts = formattedPosts.map((post: unknown) => {
        try {
          return validateBlogPost(post);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Post validation error:', error.issues);
          }
          return null;
        }
      }).filter(Boolean) as BlogPost[];

      return validatedPosts;
    } else {
      // WordPress GraphQL returns wrapped in nodes
      const response = await graphqlAdapter.executeQuery<{
        posts: {
          nodes: any[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
        };
      }>(query, variables);

      const posts = response.posts.nodes || [];
      
      // Validate each post
      const validatedPosts = posts.map((post: unknown) => {
        try {
          return validateBlogPost(post);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Post validation error:', error.issues);
          }
          return null;
        }
      }).filter(Boolean) as BlogPost[];

      return validatedPosts;
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Fetch posts with pagination
 */
export async function fetchPostsWithPagination(params: SearchParams = {}): Promise<{
  posts: BlogPost[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}> {
  const posts = await fetchPosts(params);
  return {
    posts,
    pageInfo: {
      hasNextPage: posts.length === (params.perPage || 12),
      hasPreviousPage: false,
      startCursor: posts.length > 0 ? posts[0].id || null : null,
      endCursor: posts.length > 0 ? posts[posts.length - 1].id || null : null,
    },
    totalCount: posts.length,
  };
}

/**
 * Fetch a single post by slug with validation (hybrid approach for SEO data)
 */
export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (!slug) {
      throw new Error('Slug is required');
    }

    let post: any;

    if (isAWSGraphQLEnabled) {
      // Use hybrid approach: AWS for basic data + WordPress for SEO
      post = await graphqlAdapter.executeHybridPostQuery(slug);
    } else {
      // Use WordPress GraphQL directly
      const query = graphqlAdapter.getPostBySlugQuery();
      const response = await graphqlAdapter.executeQuery<{
        post: any;
      }>(query, { slug });
      post = response.post;
    }
    
    if (!post) {
      return null;
    }

    // Validate the post
    return validateBlogPost(post);
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * Fetch category by slug with validation
 */
export async function fetchCategoryBySlug(slug: string): Promise<any> {
  try {
    if (!slug) {
      throw new Error('Category slug is required');
    }

    const query = `
      query GetCategoryBySlug($slug: ID!) {
        category(id: $slug, idType: SLUG) {
          id
          name
          slug
          description
          count
        }
      }
    `;

    const response = await graphqlAdapter.executeQuery<{
      category: any;
    }>(query, { slug });

    return response.category || null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

/**
 * Fetch tag by slug with validation
 */
export async function fetchTagBySlug(slug: string): Promise<any> {
  try {
    if (!slug) {
      throw new Error('Tag slug is required');
    }

    const query = `
      query GetTagBySlug($slug: ID!) {
        tag(id: $slug, idType: SLUG) {
          id
          name
          slug
          description
          count
        }
      }
    `;

    const response = await graphqlAdapter.executeQuery<{
      tag: any;
    }>(query, { slug });

    return response.tag || null;
  } catch (error) {
    console.error('Error fetching tag by slug:', error);
    return null;
  }
}

/**
 * Fetch categories
 */
export async function fetchCategories(): Promise<any[]> {
  try {
    const query = graphqlAdapter.getCategoriesQuery();
    
    if (isAWSGraphQLEnabled) {
      // AWS GraphQL returns direct array
      const response = await graphqlAdapter.executeQuery<{
        categories: any[];
      }>(query, { first: 100 });

      return response.categories || [];
    } else {
      // WordPress GraphQL returns wrapped in nodes
      const response = await graphqlAdapter.executeQuery<{
        categories: {
          nodes: any[];
        };
      }>(query, { first: 100 });

      return response.categories.nodes || [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch tags
 */
export async function fetchTags(): Promise<any[]> {
  try {
    const query = graphqlAdapter.getTagsQuery();
    
    if (isAWSGraphQLEnabled) {
      // AWS GraphQL returns direct array
      const response = await graphqlAdapter.executeQuery<{
        tags: any[];
      }>(query, { first: 100 });

      return response.tags || [];
    } else {
      // WordPress GraphQL returns wrapped in nodes
      const response = await graphqlAdapter.executeQuery<{
        tags: {
          nodes: any[];
        };
      }>(query, { first: 100 });

      return response.tags.nodes || [];
    }
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Fetch related posts
 */
export async function fetchRelatedPosts(slug: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    const posts = await fetchPosts({ perPage: limit });
    return posts.filter(post => post.slug !== slug).slice(0, limit);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

/**
 * Fetch adjacent posts
 */
export async function fetchAdjacentPosts(slug: string): Promise<{
  previous: BlogPost | null;
  next: BlogPost | null;
}> {
  try {
    const posts = await fetchPosts({ perPage: 100 });
    const currentIndex = posts.findIndex(post => post.slug === slug);
    
    if (currentIndex === -1) {
      return { previous: null, next: null };
    }
    
    return {
      previous: currentIndex > 0 ? posts[currentIndex - 1] : null,
      next: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
    };
  } catch (error) {
    console.error('Error fetching adjacent posts:', error);
    return { previous: null, next: null };
  }
}

/**
 * Decode HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') return '';
  
  // Check if we're in a browser environment
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  
  // Server-side fallback: basic HTML entity decoding
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Get featured image URL
 */
export function getFeaturedImageUrl(post: any): string | null {
  if (!post?.featuredImage?.node?.sourceUrl) {
    return null;
  }
  return post.featuredImage.node.sourceUrl;
}

/**
 * Get featured image alt text
 */
export function getFeaturedImageAlt(post: any): string {
  if (!post?.featuredImage?.node?.altText) {
    return '';
  }
  return post.featuredImage.node.altText;
}

/**
 * Convert to S3 URL
 */
export function convertToS3Url(url: string): string {
  // Implementation for S3 URL conversion
  return url;
}

/**
 * Debug URL conversion
 */
export function debugUrlConversion(url: string): any {
  return {
    original: url,
    converted: convertToS3Url(url),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Test API endpoint
 */
export async function testAPIEndpoint(): Promise<any> {
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
    });
    
    return {
      success: response.ok,
      status: response.status,
      data: await response.json(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get WordPress admin URL with validation
 */
export function getWordPressAdminUrl(): string {
  return API_CONFIG.WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com';
}

/**
 * Get API configuration for debugging
 */
export function getApiConfig() {
  return {
    ...API_CONFIG,
    // Don't expose sensitive URLs in development
    AWS_GRAPHQL_URL: isDevelopment ? '[REDACTED]' : API_CONFIG.AWS_GRAPHQL_URL,
    WORDPRESS_URL: isDevelopment ? '[REDACTED]' : API_CONFIG.WORDPRESS_URL,
    graphqlAdapter: graphqlAdapter.getConfig(),
  };
} 