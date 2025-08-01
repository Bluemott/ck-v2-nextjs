import { env, isDevelopment } from './env';
import { validateGraphQLQuery, GraphQLQuery } from './validation';
import { z } from 'zod';

// AWS GraphQL Configuration with validated environment variables
const AWS_GRAPHQL_URL = env.NEXT_PUBLIC_AWS_GRAPHQL_URL;

// GraphQL Query Response Schema
const graphqlResponseSchema = z.object({
  data: z.any().optional(),
  errors: z.array(z.object({
    message: z.string(),
    locations: z.array(z.object({
      line: z.number(),
      column: z.number()
    })).optional(),
    path: z.array(z.any()).optional(),
    extensions: z.record(z.any()).optional()
  })).optional(),
  extensions: z.record(z.any()).optional()
});

export type GraphQLResponse = z.infer<typeof graphqlResponseSchema>;

// Blog Post Schema for AWS GraphQL
const awsBlogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  date: z.string().optional(),
  modified: z.string().optional(),
  status: z.enum(['publish', 'draft', 'private']).optional(),
  featuredImage: z.object({
    sourceUrl: z.string().url('Invalid URL format').optional(),
    altText: z.string().optional(),
  }).optional(),
  categories: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
    })),
  }).optional(),
  tags: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
    })),
  }).optional(),
});

export type AWSBlogPost = z.infer<typeof awsBlogPostSchema>;

/**
 * Execute GraphQL query against AWS GraphQL endpoint with validation
 */
export async function executeGraphQLQuery(query: string, variables: any = {}): Promise<GraphQLResponse> {
  try {
    // Validate the GraphQL query structure
    const validatedQuery: GraphQLQuery = validateGraphQLQuery({
      query,
      variables,
    });

    // Additional security checks
    const queryText = validatedQuery.query.toLowerCase();
    
    // Check for potentially dangerous operations
    const dangerousKeywords = ['mutation', 'delete', 'drop', 'truncate', 'alter'];
    const hasDangerousKeywords = dangerousKeywords.some(keyword => 
      queryText.includes(keyword)
    );
    
    if (hasDangerousKeywords) {
      throw new Error('Query contains potentially dangerous operations');
    }

    // Check query length
    if (query.length > 10000) {
      throw new Error('Query too long');
    }

    // Execute the query
    const response = await fetch(AWS_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedQuery),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    const validatedResponse = graphqlResponseSchema.parse(data);
    
    if (isDevelopment) {
      console.log('AWS GraphQL Response:', {
        url: AWS_GRAPHQL_URL,
        query: query.substring(0, 100) + '...',
        variables,
        hasErrors: !!validatedResponse.errors,
        errorCount: validatedResponse.errors?.length || 0,
      });
    }

    return validatedResponse;
  } catch (error) {
    console.error('AWS GraphQL query error:', error);
    throw error;
  }
}

/**
 * Fetch posts from AWS GraphQL with validation
 */
export async function fetchAWSPosts(params: {
  first?: number;
  after?: string;
  search?: string;
  categorySlug?: string;
  tagSlug?: string;
} = {}): Promise<AWSBlogPost[]> {
  try {
    const query = `
      query GetPosts($first: Int, $after: String, $search: String, $categorySlug: String, $tagSlug: String) {
        posts(
          first: $first
          after: $after
          where: {
            search: $search
            categoryName: $categorySlug
            tagSlugAnd: [$tagSlug]
            orderby: { field: DATE, order: DESC }
          }
        ) {
          nodes {
            id
            title
            slug
            excerpt
            date
            modified
            status
            featuredImage {
              sourceUrl
              altText
            }
            categories {
              nodes {
                id
                name
                slug
              }
            }
            tags {
              nodes {
                id
                name
                slug
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const variables = {
      first: params.first || 12,
      after: params.after || null,
      search: params.search || null,
      categorySlug: params.categorySlug || null,
      tagSlug: params.tagSlug || null,
    };

    const response = await executeGraphQLQuery(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }

    const posts = response.data?.posts?.nodes || [];
    
    // Validate each post
    const validatedPosts = posts.map((post: unknown) => {
      try {
        return awsBlogPostSchema.parse(post);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('AWS Post validation error:', error.issues);
        }
        return null;
      }
    }).filter(Boolean) as AWSBlogPost[];

    return validatedPosts;
  } catch (error) {
    console.error('Error fetching AWS posts:', error);
    return [];
  }
}

/**
 * Fetch a single post by slug from AWS GraphQL with validation
 */
export async function fetchAWSPostBySlug(slug: string): Promise<AWSBlogPost | null> {
  try {
    if (!slug) {
      throw new Error('Slug is required');
    }

    const query = `
      query GetPostBySlug($slug: ID!) {
        post(id: $slug, idType: SLUG) {
          id
          title
          slug
          excerpt
          content
          date
          modified
          status
          featuredImage {
            sourceUrl
            altText
          }
          categories {
            nodes {
              id
              name
              slug
            }
          }
          tags {
            nodes {
              id
              name
              slug
            }
          }
        }
      }
    `;

    const response = await executeGraphQLQuery(query, { slug });
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }

    const post = response.data?.post;
    
    if (!post) {
      return null;
    }

    // Validate the post
    return awsBlogPostSchema.parse(post);
  } catch (error) {
    console.error('Error fetching AWS post by slug:', error);
    return null;
  }
}

/**
 * Fetch categories from AWS GraphQL with validation
 */
export async function fetchAWSCategories(params: {
  first?: number;
  search?: string;
} = {}): Promise<any[]> {
  try {
    const query = `
      query GetCategories($first: Int, $search: String) {
        categories(
          first: $first
          where: { search: $search }
          orderby: { field: NAME, order: ASC }
        ) {
          nodes {
            id
            name
            slug
            description
            count
          }
        }
      }
    `;

    const variables = {
      first: params.first || 100,
      search: params.search || null,
    };

    const response = await executeGraphQLQuery(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data?.categories?.nodes || [];
  } catch (error) {
    console.error('Error fetching AWS categories:', error);
    return [];
  }
}

/**
 * Fetch tags from AWS GraphQL with validation
 */
export async function fetchAWSTags(params: {
  first?: number;
  search?: string;
} = {}): Promise<any[]> {
  try {
    const query = `
      query GetTags($first: Int, $search: String) {
        tags(
          first: $first
          where: { search: $search }
          orderby: { field: NAME, order: ASC }
        ) {
          nodes {
            id
            name
            slug
            description
            count
          }
        }
      }
    `;

    const variables = {
      first: params.first || 100,
      search: params.search || null,
    };

    const response = await executeGraphQLQuery(query, variables);
    
    if (response.errors) {
      throw new Error(`GraphQL errors: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data?.tags?.nodes || [];
  } catch (error) {
    console.error('Error fetching AWS tags:', error);
    return [];
  }
}

/**
 * Get AWS GraphQL configuration for debugging
 */
export function getAWSGraphQLConfig() {
  return {
    url: isDevelopment ? '[REDACTED]' : AWS_GRAPHQL_URL,
    isDevelopment,
  };
} 