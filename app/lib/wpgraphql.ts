// WPGraphQL Integration for Cowboy Kimono v2
// Modern GraphQL-based WordPress headless CMS integration

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface WPGraphQLPost {
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
    node: {
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      avatar: {
        url: string;
      };
    };
  };
  featuredImage: {
    node: {
      id: string;
      databaseId: number;
      sourceUrl: string;
      altText: string;
      mediaDetails: {
        width: number;
        height: number;
        sizes: Array<{
          name: string;
          sourceUrl: string;
          width: number;
          height: number;
        }>;
      };
    };
  } | null;
  categories: {
    nodes: Array<{
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      count: number;
    }>;
  };
  tags: {
    nodes: Array<{
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      count: number;
    }>;
  };
  // SEO fields are optional and require WPGraphQL for Yoast SEO plugin
  seo?: {
    title: string;
    metaDesc: string;
    canonical: string;
    opengraphTitle: string;
    opengraphDescription: string;
    opengraphImage: {
      sourceUrl: string;
    } | null;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: {
      sourceUrl: string;
    } | null;
    focuskw: string;
    metaKeywords: string;
    metaRobotsNoindex: string;
    metaRobotsNofollow: string;
    opengraphType: string;
    opengraphUrl: string;
    opengraphSiteName: string;
    opengraphAuthor: string;
    opengraphPublishedTime: string;
    opengraphModifiedTime: string;
    schema: {
      raw: string;
    } | null;
  } | null;
  // Related posts scoring fields (added by fetchRelatedPosts)
  _relatedScore?: number;
  _relatedReasons?: string[];
}

export interface WPGraphQLCategory {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  posts: {
    nodes: WPGraphQLPost[];
  };
}

export interface WPGraphQLTag {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  posts: {
    nodes: WPGraphQLPost[];
  };
}

export interface WPGraphQLAuthor {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  avatar: {
    url: string;
  };
}

export interface WPGraphQLMedia {
  id: string;
  databaseId: number;
  sourceUrl: string;
  altText: string;
  title: string;
  description: string;
  mediaDetails: {
    width: number;
    height: number;
    sizes: Array<{
      name: string;
      sourceUrl: string;
      width: number;
      height: number;
    }>;
  };
}

export interface WPGraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations: Array<{ line: number; column: number }>;
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const WPGRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || 
                     'https://api.cowboykimono.com/graphql';



// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

// Simplified posts query without complex where arguments
const POSTS_QUERY = `
  query GetPosts($first: Int, $after: String, $categorySlug: String, $searchQuery: String) {
    posts(
      first: $first
      after: $after
      where: {
        categoryName: $categorySlug
        search: $searchQuery
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        excerpt
        date
        modified
        author {
          node {
            name
            slug
          }
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
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes {
                name
                sourceUrl
                width
                height
              }
            }
          }
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
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
          schema {
            raw
          }
        }
      }
    }
  }
`;

// Query for posts by category ID
const POSTS_BY_CATEGORY_ID_QUERY = `
  query GetPostsByCategoryId($categoryId: ID!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { categoryIn: [$categoryId] }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        modified
        content
        author {
          node {
            id
            databaseId
            name
            slug
            avatar {
              url
            }
          }
        }
        categories {
          nodes {
            id
            databaseId
            name
            slug
            count
          }
        }
        tags {
          nodes {
            id
            databaseId
            name
            slug
            count
          }
        }
        featuredImage {
          node {
            id
            databaseId
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes {
                name
                sourceUrl
                width
                height
              }
            }
          }
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
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
          schema {
            raw
          }
        }
      }
    }
  }
`;

// Query for posts by tag ID
const POSTS_BY_TAG_ID_QUERY = `
  query GetPostsByTagId($tagId: ID!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { tagIn: [$tagId] }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        modified
        content
        author {
          node {
            id
            databaseId
            name
            slug
            avatar {
              url
            }
          }
        }
        categories {
          nodes {
            id
            databaseId
            name
            slug
            count
          }
        }
        tags {
          nodes {
            id
            databaseId
            name
            slug
            count
          }
        }
        featuredImage {
          node {
            id
            databaseId
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes {
                name
                sourceUrl
                width
                height
              }
            }
          }
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
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
          schema {
            raw
          }
        }
      }
    }
  }
`;

// Posts query with category filtering
const POSTS_BY_CATEGORY_QUERY = `
  query GetPostsByCategory($categorySlug: String!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { categoryName: $categorySlug }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        excerpt
        date
        modified
        author {
          node {
            name
            slug
          }
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
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes {
                name
                sourceUrl
                width
                height
              }
            }
          }
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
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
          schema {
            raw
          }
        }
      }
    }
  }
`;

// Posts query with tag filtering
const POSTS_BY_TAG_QUERY = `
  query GetPostsByTag($tagSlug: String!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { tagSlugAnd: [$tagSlug] }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        excerpt
        date
        modified
        author {
          node {
            name
            slug
          }
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
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes {
                name
                sourceUrl
                width
                height
              }
            }
          }
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
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
          schema {
            raw
          }
        }
      }
    }
  }
`;

// Posts query with search
const POSTS_BY_SEARCH_QUERY = `
  query GetPostsBySearch($searchQuery: String!, $first: Int, $after: String) {
    posts(
      first: $first
      after: $after
      where: { search: $searchQuery }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        excerpt
        date
        modified
        author {
          node {
            name
            slug
          }
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
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes {
                name
                sourceUrl
                width
                height
              }
            }
          }
        }
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
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
          schema {
            raw
          }
        }
      }
    }
  }
`;

const POST_BY_SLUG_QUERY = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
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
        node {
          id
          databaseId
          name
          slug
          avatar {
            url
          }
        }
      }
      featuredImage {
        node {
          id
          databaseId
          sourceUrl
          altText
          mediaDetails {
            width
            height
            sizes {
              name
              sourceUrl
              width
              height
            }
          }
        }
      }
      categories {
        nodes {
          id
          databaseId
          name
          slug
          count
        }
      }
      tags {
        nodes {
          id
          databaseId
          name
          slug
          count
        }
      }
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
        }
        twitterTitle
        twitterDescription
        twitterImage {
          sourceUrl
        }
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
        schema {
          raw
        }
      }
    }
  }
`;

const CATEGORIES_QUERY = `
  query GetCategories($first: Int) {
    categories(first: $first) {
      nodes {
        id
        databaseId
        name
        slug
        description
        count
      }
    }
  }
`;

const TAGS_QUERY = `
  query GetTags($first: Int) {
    tags(first: $first) {
      nodes {
        id
        databaseId
        name
        slug
        description
        count
      }
    }
  }
`;

const CATEGORY_BY_SLUG_QUERY = `
  query GetCategoryBySlug($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      id
      name
      slug
      description
      count
      posts {
        nodes {
          id
          title
          slug
          excerpt
          date
          modified
          author {
            node {
              name
              slug
            }
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
          featuredImage {
            node {
              sourceUrl
              altText
              mediaDetails {
                width
                height
                sizes {
                  name
                  sourceUrl
                  width
                  height
                }
              }
            }
          }
          seo {
            title
            metaDesc
            canonical
            opengraphTitle
            opengraphDescription
            opengraphImage {
              sourceUrl
            }
            twitterTitle
            twitterDescription
            twitterImage {
              sourceUrl
            }
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
            schema {
              raw
            }
          }
        }
      }
    }
  }
`;

const TAG_BY_SLUG_QUERY = `
  query GetTagBySlug($slug: ID!) {
    tag(id: $slug, idType: SLUG) {
      id
      name
      slug
      description
      count
      posts {
        nodes {
          id
          title
          slug
          excerpt
          date
          modified
          author {
            node {
              name
              slug
            }
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
          featuredImage {
            node {
              sourceUrl
              altText
              mediaDetails {
                width
                height
                sizes {
                  name
                  sourceUrl
                  width
                  height
                }
              }
            }
          }
          seo {
            title
            metaDesc
            canonical
            opengraphTitle
            opengraphDescription
            opengraphImage {
              sourceUrl
            }
            twitterTitle
            twitterDescription
            twitterImage {
              sourceUrl
            }
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
            schema {
              raw
            }
          }
        }
      }
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

export function getWordPressAdminUrl(): string {
  return process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com';
}

export function getFeaturedImageUrl(post: WPGraphQLPost, size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'): string | null {
  if (!post.featuredImage?.node) return null;
  
  const { mediaDetails } = post.featuredImage.node;
  
  // Check if mediaDetails and sizes exist
  if (mediaDetails?.sizes && Array.isArray(mediaDetails.sizes)) {
    // Find the requested size
    const requestedSize = mediaDetails.sizes.find(s => s.name === size);
    if (requestedSize) {
      return requestedSize.sourceUrl;
    }
  }
  
  // Fallback to source URL if size not found or sizes is not available
  return post.featuredImage.node.sourceUrl;
}

export function getFeaturedImageAlt(post: WPGraphQLPost): string {
  return post.featuredImage?.node?.altText || '';
}

// ============================================================================
// GRAPHQL CLIENT FUNCTIONS
// ============================================================================

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  try {
    const response = await fetch(WPGRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('GraphQL HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          url: WPGRAPHQL_URL,
          response: errorText
        });
      }
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const result: WPGraphQLResponse<T> = await response.json();

    if (result.errors) {
      // Only log schema errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('GraphQL Schema Errors:', result.errors);
      }
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    return result.data;
  } catch (error) {
    // Only log detailed request errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GraphQL request error:', {
        error: error instanceof Error ? error.message : String(error),
        url: WPGRAPHQL_URL,
        query: query.substring(0, 100) + '...',
        variables
      });
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('GraphQL request timed out. Please check your WordPress GraphQL endpoint.');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error connecting to GraphQL endpoint. Please check if WordPress is running.');
      }
    }
    
    throw error;
  }
}

// Fallback function to test if GraphQL endpoint is available
export async function testGraphQLEndpoint(): Promise<boolean> {
  try {
    const response = await fetch(WPGRAPHQL_URL, {
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
}): Promise<WPGraphQLPost[]> {
  const { first = 10, after, categoryName, tagName, search } = params || {};
  
  let query: string;
  const variables: Record<string, unknown> = { first, after };

  if (categoryName) {
    query = POSTS_BY_CATEGORY_QUERY;
    variables.categorySlug = categoryName;
  } else if (tagName) {
    query = POSTS_BY_TAG_QUERY;
    variables.tagSlug = tagName;
  } else if (search) {
    query = POSTS_BY_SEARCH_QUERY;
    variables.searchQuery = search;
  } else {
    query = POSTS_QUERY;
  }

  const result = await graphqlRequest<{
    posts: {
      nodes: WPGraphQLPost[];
    };
  }>(query, variables);

  return result.posts.nodes;
}

export async function fetchPostBySlug(slug: string): Promise<WPGraphQLPost | null> {
  try {
    const result = await graphqlRequest<{
      post: WPGraphQLPost;
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

export async function fetchCategories(): Promise<WPGraphQLCategory[]> {
  try {
    const result = await graphqlRequest<{
      categories: {
        nodes: WPGraphQLCategory[];
      };
    }>(CATEGORIES_QUERY, { first: 100 });

    return result.categories.nodes;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function fetchTags(): Promise<WPGraphQLTag[]> {
  try {
    const result = await graphqlRequest<{
      tags: {
        nodes: WPGraphQLTag[];
      };
    }>(TAGS_QUERY, { first: 100 });

    return result.tags.nodes;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<WPGraphQLCategory | null> {
  try {
    const result = await graphqlRequest<{
      category: WPGraphQLCategory;
    }>(CATEGORY_BY_SLUG_QUERY, { slug });

    return result.category;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    return null;
  }
}

export async function fetchTagBySlug(slug: string): Promise<WPGraphQLTag | null> {
  try {
    const result = await graphqlRequest<{
      tag: WPGraphQLTag;
    }>(TAG_BY_SLUG_QUERY, { slug });

    return result.tag;
  } catch (error) {
    console.error(`Error fetching tag by slug ${slug}:`, error);
    return null;
  }
}

export async function fetchPostsWithPagination(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<{
  posts: WPGraphQLPost[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
}> {
  const { first = 10, after, categoryName, tagName, search } = params || {};
  
  let query: string;
  const variables: Record<string, unknown> = { first, after };

  if (categoryName) {
    query = POSTS_BY_CATEGORY_QUERY;
    variables.categorySlug = categoryName;
  } else if (tagName) {
    query = POSTS_BY_TAG_QUERY;
    variables.tagSlug = tagName;
  } else if (search) {
    query = POSTS_BY_SEARCH_QUERY;
    variables.searchQuery = search;
  } else {
    query = POSTS_QUERY;
  }

  const result = await graphqlRequest<{
    posts: {
      nodes: WPGraphQLPost[];
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string;
        endCursor: string;
      };
    };
  }>(query, variables);

  return {
    posts: result.posts.nodes,
    pageInfo: result.posts.pageInfo,
  };
}

// Helper function to fetch posts by category ID
async function fetchPostsByCategoryId(categoryId: string, first: number = 20): Promise<WPGraphQLPost[]> {
  try {
    const result = await graphqlRequest<{
      posts: {
        nodes: WPGraphQLPost[];
      };
    }>(POSTS_BY_CATEGORY_ID_QUERY, { categoryId, first });

    return result.posts.nodes;
  } catch (error) {
    console.error(`Error fetching posts by category ID ${categoryId}:`, error);
    return [];
  }
}

// Helper function to fetch posts by tag ID
async function fetchPostsByTagId(tagId: string, first: number = 20): Promise<WPGraphQLPost[]> {
  try {
    const result = await graphqlRequest<{
      posts: {
        nodes: WPGraphQLPost[];
      };
    }>(POSTS_BY_TAG_ID_QUERY, { tagId, first });

    return result.posts.nodes;
  } catch (error) {
    console.error(`Error fetching posts by tag ID ${tagId}:`, error);
    return [];
  }
}

// Helper function to calculate content similarity
function calculateContentSimilarity(content1: string, content2: string): number {
  // Handle null/undefined content
  if (!content1 || !content2 || typeof content1 !== 'string' || typeof content2 !== 'string') {
    return 0;
  }

  try {
    // Remove HTML tags and normalize
    const cleanContent1 = content1.replace(/<[^>]+>/g, '').toLowerCase();
    const cleanContent2 = content2.replace(/<[^>]+>/g, '').toLowerCase();
    
    // Return 0 if either content is empty after cleaning
    if (!cleanContent1.trim() || !cleanContent2.trim()) {
      return 0;
    }
    
    // Extract words (filter out common words and short words)
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an', 'as', 'so', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'you', 'your', 'yours', 'yourself', 'yourselves']);
    
    const words1 = cleanContent1.split(/\s+/).filter(word => 
      word.length > 3 && !commonWords.has(word) && /^[a-zA-Z]+$/.test(word)
    );
    const words2 = cleanContent2.split(/\s+/).filter(word => 
      word.length > 3 && !commonWords.has(word) && /^[a-zA-Z]+$/.test(word)
    );
    
    // Return 0 if no meaningful words found
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    // Calculate intersection
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    // Jaccard similarity
    return union.length > 0 ? intersection.length / union.length : 0;
  } catch (error) {
    console.error('Error calculating content similarity:', error);
    return 0;
  }
}

// Helper function to calculate title similarity
function calculateTitleSimilarity(title1: string, title2: string): number {
  // Handle null/undefined titles
  if (!title1 || !title2 || typeof title1 !== 'string' || typeof title2 !== 'string') {
    return 0;
  }

  try {
    const cleanTitle1 = title1.replace(/<[^>]+>/g, '').toLowerCase();
    const cleanTitle2 = title2.replace(/<[^>]+>/g, '').toLowerCase();
    
    // Return 0 if either title is empty after cleaning
    if (!cleanTitle1.trim() || !cleanTitle2.trim()) {
      return 0;
    }
    
    const words1 = cleanTitle1.split(/\s+/).filter(word => word.length > 2);
    const words2 = cleanTitle2.split(/\s+/).filter(word => word.length > 2);
    
    // Return 0 if no meaningful words found
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  } catch (error) {
    console.error('Error calculating title similarity:', error);
    return 0;
  }
}

export async function fetchRelatedPosts(
  currentPost: WPGraphQLPost,
  categoryIds: string[],
  tagIds: string[],
  limit: number = 3
): Promise<WPGraphQLPost[]> {
  try {
    // Validate current post has required fields
    if (!currentPost || !currentPost.databaseId) {
      console.error('Invalid current post provided to fetchRelatedPosts');
      return [];
    }

    // Enhanced related posts algorithm focusing on content diversity
    const usedPostIds = new Set<number>([currentPost.databaseId]);
    const scoredPosts = new Map<number, { 
      post: WPGraphQLPost; 
      score: number; 
      reasons: string[];
      diversityFactors: Set<string>;
    }>();
    
    // Get comprehensive content pool for analysis
    const allPosts = await fetchPosts({ first: 150 }); // Increased pool for better diversity
    const currentPostDate = new Date(currentPost.date);

    // Helper function to add or update a post's score
    const updatePostScore = (
      post: WPGraphQLPost, 
      additionalScore: number, 
      reason: string,
      diversityFactor?: string
    ) => {
      if (usedPostIds.has(post.databaseId)) return;
      
      const existingEntry = scoredPosts.get(post.databaseId);
      if (existingEntry) {
        existingEntry.score += additionalScore;
        existingEntry.reasons.push(reason);
        if (diversityFactor) {
          existingEntry.diversityFactors.add(diversityFactor);
        }
      } else {
        const diversityFactors = new Set<string>();
        if (diversityFactor) diversityFactors.add(diversityFactor);
        
        scoredPosts.set(post.databaseId, {
          post,
          score: additionalScore,
          reasons: [reason],
          diversityFactors
        });
      }
    };

    // Strategy 1: Exact Tag Matches with Diversity Bonus
    if (tagIds.length > 0) {
      const tagDiversityBonus = new Map<string, number>();
      
      for (const tagId of tagIds) {
        const tagPosts = await fetchPostsByTagId(tagId, 30);
        
        tagPosts.forEach(post => {
          if (!usedPostIds.has(post.databaseId)) {
            const matchingTags = post.tags.nodes.filter(tag => 
              tagIds.includes(tag.databaseId.toString())
            );
            
            matchingTags.forEach(tag => {
              const baseScore = 15; // High base score for exact matches
              const diversityBonus = tagDiversityBonus.get(tag.slug) || 0;
              const score = Math.max(baseScore - diversityBonus, 5); // Diminishing returns
              
              updatePostScore(post, score, `Tag: ${tag.name}`, `tag-${tag.slug}`);
              tagDiversityBonus.set(tag.slug, diversityBonus + 3);
            });
          }
        });
      }
    }

    // Strategy 2: Category Matches with Cross-Category Diversity
    if (categoryIds.length > 0) {
      const categoryDiversityBonus = new Map<string, number>();
      
      for (const categoryId of categoryIds) {
        const categoryPosts = await fetchPostsByCategoryId(categoryId, 30);
        
        categoryPosts.forEach(post => {
          if (!usedPostIds.has(post.databaseId)) {
            const matchingCategories = post.categories.nodes.filter(cat => 
              categoryIds.includes(cat.databaseId.toString())
            );
            
            matchingCategories.forEach(category => {
              const baseScore = 12;
              const diversityBonus = categoryDiversityBonus.get(category.slug) || 0;
              const score = Math.max(baseScore - diversityBonus, 4);
              
              updatePostScore(post, score, `Category: ${category.name}`, `category-${category.slug}`);
              categoryDiversityBonus.set(category.slug, diversityBonus + 2);
            });
          }
        });
      }
    }

    // Strategy 3: Cross-Category Exploration (NEW)
    // Actively seek content from different categories to showcase site diversity
    const currentPostCategories = currentPost.categories.nodes.map(c => c.databaseId);
    const exploreCategories = await fetchCategories();
    
    exploreCategories.forEach(category => {
      if (!currentPostCategories.includes(category.databaseId)) {
        // Give bonus points to posts from entirely different categories
        allPosts.forEach(post => {
          if (!usedPostIds.has(post.databaseId)) {
            const hasThisCategory = post.categories.nodes.some(c => 
              c.databaseId === category.databaseId
            );
            if (hasThisCategory) {
              updatePostScore(post, 6, `Content diversity: ${category.name}`, `explore-${category.slug}`);
            }
          }
        });
      }
    });

    // Strategy 4: Temporal Diversity (NEW)
    // Spread recommendations across different time periods
    const timeRanges = [
      { name: 'Recent', days: 30, bonus: 8 },
      { name: 'Past Month', days: 60, bonus: 6 },
      { name: 'Past Quarter', days: 90, bonus: 4 },
      { name: 'Archive', days: Infinity, bonus: 3 }
    ];
    
    const timeDistribution = new Map<string, number>();
    
    allPosts.forEach(post => {
      if (!usedPostIds.has(post.databaseId)) {
        const postDate = new Date(post.date);
        const daysDiff = Math.abs((currentPostDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
        
        for (const range of timeRanges) {
          if (daysDiff <= range.days) {
            const usageCount = timeDistribution.get(range.name) || 0;
            const score = Math.max(range.bonus - usageCount, 1);
            
            updatePostScore(post, score, `${range.name} content`, `time-${range.name.toLowerCase()}`);
            timeDistribution.set(range.name, usageCount + 1);
            break;
          }
        }
      }
    });

    // Strategy 5: Content Similarity (Refined)
    allPosts.forEach(post => {
      if (!usedPostIds.has(post.databaseId) && post.content && post.title) {
        const contentSimilarity = calculateContentSimilarity(currentPost.content, post.content);
        const titleSimilarity = calculateTitleSimilarity(currentPost.title, post.title);
        
        // Balanced similarity scoring
        const totalSimilarity = (contentSimilarity * 0.6) + (titleSimilarity * 0.4);
        
        if (totalSimilarity > 0.04) { // Lowered threshold for more inclusivity
          const score = Math.round(totalSimilarity * 20);
          updatePostScore(post, score, `Content similarity: ${Math.round(totalSimilarity * 100)}%`, 'similarity');
        }
      }
    });

    // Strategy 6: Tag Ecosystem Exploration (NEW)
    // Find posts with related but different tags to expand content variety
    const currentPostTagNames = currentPost.tags.nodes.map(t => t.name.toLowerCase());
    const allTags = await fetchTags();
    
    allTags.forEach(tag => {
      const tagName = tag.name.toLowerCase();
      const isRelated = currentPostTagNames.some(currentTag => 
        tagName.includes(currentTag.split(' ')[0]) || 
        currentTag.includes(tagName.split(' ')[0]) ||
        (tagName.length > 4 && currentTag.length > 4 && 
         (tagName.startsWith(currentTag.substring(0, 4)) || 
          currentTag.startsWith(tagName.substring(0, 4))))
      );
      
      if (isRelated && !tagIds.includes(tag.databaseId.toString())) {
        allPosts.forEach(post => {
          if (!usedPostIds.has(post.databaseId)) {
            const hasRelatedTag = post.tags.nodes.some(t => t.databaseId === tag.databaseId);
            if (hasRelatedTag) {
              updatePostScore(post, 5, `Related tag: ${tag.name}`, `related-tag-${tag.slug}`);
            }
          }
        });
      }
    });

    // Strategy 7: Content Length Diversity (NEW)
    // Ensure variety in content length/type
    const contentLengths = new Map<string, number>();
    
    allPosts.forEach(post => {
      if (!usedPostIds.has(post.databaseId) && post.content) {
        const contentLength = post.content.replace(/<[^>]+>/g, '').length;
        let lengthCategory = '';
        let bonus = 0;
        
        if (contentLength < 500) {
          lengthCategory = 'short';
          bonus = 3;
        } else if (contentLength < 1500) {
          lengthCategory = 'medium';
          bonus = 4;
        } else {
          lengthCategory = 'long';
          bonus = 3;
        }
        
        const categoryCount = contentLengths.get(lengthCategory) || 0;
        const score = Math.max(bonus - categoryCount, 1);
        
        updatePostScore(post, score, `${lengthCategory} content`, `length-${lengthCategory}`);
        contentLengths.set(lengthCategory, categoryCount + 1);
      }
    });

    // Strategy 8: Featured Content Boost (NEW)
    // Give slight preference to posts with featured images for visual appeal
    allPosts.forEach(post => {
      if (!usedPostIds.has(post.databaseId) && post.featuredImage?.node) {
        updatePostScore(post, 2, 'Featured image', 'visual');
      }
    });

    // Convert scored posts to array and sort by comprehensive score
    const candidatePosts = Array.from(scoredPosts.values())
      .map(item => {
        // Diversity bonus: posts with more diversity factors get extra points
        const diversityBonus = Math.min(item.diversityFactors.size * 2, 8);
        return {
          ...item,
          finalScore: item.score + diversityBonus
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    // Select posts with guaranteed diversity
    const selectedPosts: (WPGraphQLPost & { _relatedScore: number; _relatedReasons: string[] })[] = [];
    const usedCategories = new Set<number>();
    const usedTags = new Set<number>();
    
    // First pass: Select highest scoring posts while ensuring diversity
    for (const candidate of candidatePosts) {
      if (selectedPosts.length >= limit) break;
      
      const post = candidate.post;
      let shouldInclude = selectedPosts.length < Math.ceil(limit * 0.6); // Fill 60% with top scores
      
      if (!shouldInclude) {
        // For remaining slots, prioritize diversity
        const hasNewCategory = post.categories.nodes.some(c => !usedCategories.has(c.databaseId));
        const hasNewTag = post.tags.nodes.some(t => !usedTags.has(t.databaseId));
        shouldInclude = hasNewCategory || hasNewTag;
      }
      
      if (shouldInclude) {
        selectedPosts.push({
          ...post,
          _relatedScore: candidate.finalScore,
          _relatedReasons: candidate.reasons
        });
        
        // Track used categories and tags for diversity
        post.categories.nodes.forEach(c => usedCategories.add(c.databaseId));
        post.tags.nodes.forEach(t => usedTags.add(t.databaseId));
        usedPostIds.add(post.databaseId);
      }
    }

    // Fallback: Fill remaining slots with diverse recent content
    if (selectedPosts.length < limit) {
      const remainingSlots = limit - selectedPosts.length;
      const fallbackPosts = allPosts
        .filter(post => !usedPostIds.has(post.databaseId))
        .slice(0, remainingSlots * 3) // Get more candidates
        .sort((a, b) => {
          // Sort by category/tag diversity first, then by date
          const aHasNewCategory = a.categories.nodes.some(c => !usedCategories.has(c.databaseId));
          const bHasNewCategory = b.categories.nodes.some(c => !usedCategories.has(c.databaseId));
          
          if (aHasNewCategory && !bHasNewCategory) return -1;
          if (!aHasNewCategory && bHasNewCategory) return 1;
          
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, remainingSlots);

      fallbackPosts.forEach(post => {
        selectedPosts.push({
          ...post,
          _relatedScore: 2,
          _relatedReasons: ['Content diversity (fallback)']
        });
        post.categories.nodes.forEach(c => usedCategories.add(c.databaseId));
        post.tags.nodes.forEach(t => usedTags.add(t.databaseId));
        usedPostIds.add(post.databaseId);
      });
    }

    // Final verification: Ensure no duplicates (should be impossible now, but safety check)
    const finalResults = selectedPosts
      .filter((post, index, array) => 
        array.findIndex(p => p.databaseId === post.databaseId) === index
      )
      .slice(0, limit);

    return finalResults;

  } catch (error) {
    console.error('Error fetching related posts:', error);
    
    // Emergency fallback: Return diverse recent posts
    try {
      const fallbackPosts = await fetchPosts({ first: limit * 2 });
      const uniqueFallback = fallbackPosts
        .filter(post => post.databaseId !== currentPost.databaseId)
        .filter((post, index, array) => 
          array.findIndex(p => p.databaseId === post.databaseId) === index
        )
        .slice(0, limit);

      return uniqueFallback.map(post => ({
        ...post,
        _relatedScore: 1,
        _relatedReasons: ['Emergency fallback content']
      }));
    } catch (fallbackError) {
      console.error('Emergency fallback error:', fallbackError);
      return [];
    }
  }
}

// ============================================================================
// ADJACENT POSTS NAVIGATION
// ============================================================================

export async function fetchAdjacentPosts(currentPostSlug: string): Promise<{
  previousPost: WPGraphQLPost | null;
  nextPost: WPGraphQLPost | null;
}> {
  try {
    // Get all published posts ordered by date (newest first)
    const allPosts = await fetchPosts({ first: 1000 }); // Get a large number to ensure we have enough posts
    
    // Find the current post's index
    const currentPostIndex = allPosts.findIndex(post => post.slug === currentPostSlug);
    
    if (currentPostIndex === -1) {
      return { previousPost: null, nextPost: null };
    }
    
    // Get previous post (newer post, higher index)
    const previousPost = currentPostIndex < allPosts.length - 1 ? allPosts[currentPostIndex + 1] : null;
    
    // Get next post (older post, lower index)
    const nextPost = currentPostIndex > 0 ? allPosts[currentPostIndex - 1] : null;
    
    return { previousPost, nextPost };
  } catch (error) {
    console.error('Error fetching adjacent posts:', error);
    return { previousPost: null, nextPost: null };
  }
}

// ============================================================================
// COMPATIBILITY LAYER (for gradual migration)
// ============================================================================

// Convert WPGraphQL post to WordPress REST API format for compatibility
export function convertToWordPressPost(graphqlPost: WPGraphQLPost): Record<string, unknown> {
  return {
    id: graphqlPost.databaseId,
    date: graphqlPost.date,
    modified: graphqlPost.modified,
    slug: graphqlPost.slug,
    status: graphqlPost.status,
    title: {
      rendered: graphqlPost.title,
    },
    content: {
      rendered: graphqlPost.content,
      protected: false,
    },
    excerpt: {
      rendered: graphqlPost.excerpt,
      protected: false,
    },
    author: graphqlPost.author.node.databaseId,
    featured_media: graphqlPost.featuredImage?.node?.databaseId || 0,
    categories: graphqlPost.categories.nodes.map(cat => cat.databaseId),
    tags: graphqlPost.tags.nodes.map(tag => tag.databaseId),
    _embedded: {
      'wp:featuredmedia': graphqlPost.featuredImage?.node ? [{
        id: graphqlPost.featuredImage.node.databaseId,
        source_url: graphqlPost.featuredImage.node.sourceUrl,
        alt_text: graphqlPost.featuredImage.node.altText,
      }] : [],
      author: [{
        id: graphqlPost.author.node.databaseId,
        name: graphqlPost.author.node.name,
        slug: graphqlPost.author.node.slug,
        avatar_urls: {
          '24': graphqlPost.author.node.avatar.url,
          '48': graphqlPost.author.node.avatar.url,
          '96': graphqlPost.author.node.avatar.url,
        },
      }],
    },
    seo: graphqlPost.seo,
  };
}

 