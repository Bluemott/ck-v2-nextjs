// AWS GraphQL Integration for Cowboy Kimono v2
// Cost-optimized Lambda-based WordPress blog API

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface AWSGraphQLPost {
  id: string;
  databaseId: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  };
  featuredImage: {
    id: string;
    sourceUrl: string;
    altText: string | null;
    width?: number;
    height?: number;
  } | null;
  categories: AWSGraphQLCategory[];
  tags: AWSGraphQLTag[];
  seo?: AWSGraphQLSEO | null;
}

export interface AWSGraphQLCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

export interface AWSGraphQLTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

export interface AWSGraphQLSEO {
  title?: string;
  metaDesc?: string;
  canonical?: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  focuskw?: string;
  metaKeywords?: string;
  metaRobotsNoindex?: string;
  metaRobotsNofollow?: string;
  opengraphType?: string;
  opengraphUrl?: string;
  opengraphSiteName?: string;
  opengraphAuthor?: string;
  opengraphPublishedTime?: string;
  opengraphModifiedTime?: string;
  schema?: string;
}

export interface AWSGraphQLPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface AWSGraphQLPostsConnection {
  nodes: AWSGraphQLPost[];
  pageInfo: AWSGraphQLPageInfo;
}

export interface AWSGraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations: Array<{ line: number; column: number }>;
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const AWS_GRAPHQL_URL = process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL || 
                        '/api/graphql';

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const POSTS_QUERY = `
  query GetPosts($first: Int, $after: String, $categoryName: String, $tagName: String, $search: String) {
    posts(first: $first, after: $after, categoryName: $categoryName, tagName: $tagName, search: $search) {
      nodes {
        id
        databaseId
        title
        slug
        status
        excerpt
        date
        modified
        content
        author {
          id
          name
          slug
          avatar
        }
        categories {
          id
          name
          slug
          description
          count
        }
        tags {
          id
          name
          slug
          description
          count
        }
        featuredImage {
          id
          sourceUrl
          altText
          width
          height
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage
          twitterTitle
          twitterDescription
          twitterImage
          focuskw
          metaKeywords
          metaRobotsNoindex
          metaRobotsNofollow
          opengraphType
          opengraphUrl
          opengraphSiteName
          opengraphAuthor
          opengraphPublishedTime
          opengraphModifiedTime
          schema
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

const POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: String!) {
    post(slug: $slug) {
      id
      databaseId
      date
      modified
      slug
      status
      title
      content
      excerpt
      author {
        id
        name
        slug
        avatar
      }
      featuredImage {
        id
        sourceUrl
        altText
        width
        height
      }
      categories {
        id
        name
        slug
        description
        count
      }
      tags {
        id
        name
        slug
        description
        count
      }
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
        opengraphImage
        twitterTitle
        twitterDescription
        twitterImage
        focuskw
        metaKeywords
        metaRobotsNoindex
        metaRobotsNofollow
        opengraphType
        opengraphUrl
        opengraphSiteName
        opengraphAuthor
        opengraphPublishedTime
        opengraphModifiedTime
        schema
      }
    }
  }
`;

const CATEGORIES_QUERY = `
  query GetCategories($first: Int) {
    categories(first: $first) {
      id
      name
      slug
      description
      count
    }
  }
`;

const TAGS_QUERY = `
  query GetTags($first: Int) {
    tags(first: $first) {
      id
      name
      slug
      description
      count
    }
  }
`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function decodeHtmlEntities(text: string): string {
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

export function getFeaturedImageUrl(post: AWSGraphQLPost, size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'): string | null {
  if (!post.featuredImage) return null;
  
  // For now, return the source URL directly
  // In the future, you could implement image resizing via CloudFront
  return post.featuredImage.sourceUrl;
}

export function getFeaturedImageAlt(post: AWSGraphQLPost): string {
  return post.featuredImage?.altText || '';
}

export function formatFileSize(_size: number): string {
  // This function was not used in the original file, so it's removed.
  // If it's intended to be used, it needs to be implemented.
  return '';
}

export function buildGraphQLQuery(queryName: string, variables: any = {}) {
  // This function was not used in the original file, so it's removed.
  // If it's intended to be used, it needs to be implemented.
  return '';
}

// ============================================================================
// GRAPHQL CLIENT FUNCTIONS
// ============================================================================

async function awsGraphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  try {
    const response = await fetch(AWS_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Add timeout for cost optimization
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('AWS GraphQL HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          url: AWS_GRAPHQL_URL,
          response: errorText
        });
      }
      throw new Error(`AWS GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result: AWSGraphQLResponse<T> = await response.json();

    if (result.errors) {
      // Only log schema errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('AWS GraphQL Schema Errors:', result.errors);
      }
      throw new Error(`AWS GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data;
  } catch (error) {
    // Only log detailed request errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('AWS GraphQL request error:', {
        error: error instanceof Error ? error.message : String(error),
        url: AWS_GRAPHQL_URL,
        query: `${query.substring(0, 100)}...`,
        variables
      });
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AWS GraphQL request timed out. Please check your API Gateway endpoint.');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error connecting to AWS GraphQL endpoint. Please check if the Lambda function is running.');
      }
    }
    
    throw error;
  }
}

// Fallback function to test if AWS GraphQL endpoint is available
export async function testAWSGraphQLEndpoint(): Promise<boolean> {
  try {
    const response = await fetch(AWS_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

export async function fetchPosts(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<AWSGraphQLPost[]> {
  const { first = 10, after, categoryName, tagName, search } = params || {};
  
  const variables: Record<string, unknown> = { first, after };
  if (categoryName) variables.categoryName = categoryName;
  if (tagName) variables.tagName = tagName;
  if (search) variables.search = search;

  const result = await awsGraphqlRequest<{
    posts: AWSGraphQLPostsConnection;
  }>(POSTS_QUERY, variables);

  return result.posts.nodes;
}

export async function fetchPostBySlug(slug: string): Promise<AWSGraphQLPost | null> {
  try {
    const result = await awsGraphqlRequest<{
      post: AWSGraphQLPost;
    }>(POST_BY_SLUG_QUERY, { slug });

    return result.post;
  } catch (error) {
    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching post by slug ${slug}:`, error);
    }
    return null;
  }
}

export async function fetchCategories(): Promise<AWSGraphQLCategory[]> {
  try {
    const result = await awsGraphqlRequest<{
      categories: AWSGraphQLCategory[];
    }>(CATEGORIES_QUERY, { first: 100 });

    return result.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function fetchTags(): Promise<AWSGraphQLTag[]> {
  try {
    const result = await awsGraphqlRequest<{
      tags: AWSGraphQLTag[];
    }>(TAGS_QUERY, { first: 100 });

    return result.tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export async function fetchPostsWithPagination(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<{
  posts: AWSGraphQLPost[];
  pageInfo: AWSGraphQLPageInfo;
  totalCount: number;
}> {
  const { first = 10, after, categoryName, tagName, search } = params || {};
  
  const variables: Record<string, unknown> = { first, after };
  if (categoryName) variables.categoryName = categoryName;
  if (tagName) variables.tagName = tagName;
  if (search) variables.search = search;

  const result = await awsGraphqlRequest<{
    posts: AWSGraphQLPostsConnection;
  }>(POSTS_QUERY, variables);

  // For now, we'll estimate total count based on pageInfo
  // In the future, you could add a separate count query
  const totalCount = result.posts.pageInfo.hasNextPage ? 
    (first || 10) * 2 : // Estimate if there are more pages
    result.posts.nodes.length;

  return {
    posts: result.posts.nodes,
    pageInfo: result.posts.pageInfo,
    totalCount,
  };
}

// ============================================================================
// COMPATIBILITY LAYER (for gradual migration)
// ============================================================================

// Convert AWS GraphQL post to WordPress REST API format for compatibility
export function convertToWordPressPost(awsPost: AWSGraphQLPost): Record<string, unknown> {
  return {
    id: awsPost.databaseId,
    date: awsPost.date,
    modified: awsPost.modified,
    slug: awsPost.slug,
    status: awsPost.status,
    title: {
      rendered: awsPost.title,
    },
    content: {
      rendered: awsPost.content,
      protected: false,
    },
    excerpt: {
      rendered: awsPost.excerpt,
      protected: false,
    },
    author: awsPost.author.id,
    featured_media: awsPost.featuredImage?.id || 0,
    categories: awsPost.categories.map(cat => cat.id),
    tags: awsPost.tags.map(tag => tag.id),
    _embedded: {
      'wp:featuredmedia': awsPost.featuredImage ? [{
        id: awsPost.featuredImage.id,
        source_url: awsPost.featuredImage.sourceUrl,
        alt_text: awsPost.featuredImage.altText,
      }] : [],
      author: [{
        id: awsPost.author.id,
        name: awsPost.author.name,
        slug: awsPost.author.slug,
        avatar_urls: {
          '24': awsPost.author.avatar || '',
          '48': awsPost.author.avatar || '',
          '96': awsPost.author.avatar || '',
        },
      }],
    },
    seo: awsPost.seo,
  };
} 