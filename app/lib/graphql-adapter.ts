import { env, isAWSGraphQLEnabled } from './env';

// GraphQL Schema Adapter for AWS vs WordPress compatibility
export class GraphQLAdapter {
  private isAWS: boolean;
  private awsEndpoint: string;
  private wpEndpoint: string;

  constructor() {
    this.isAWS = isAWSGraphQLEnabled;
    this.awsEndpoint = env.NEXT_PUBLIC_AWS_GRAPHQL_URL || 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';
    this.wpEndpoint = env.NEXT_PUBLIC_WPGRAPHQL_URL || 'https://api.cowboykimono.com/graphql';
  }

  private get endpoint(): string {
    return this.isAWS ? this.awsEndpoint : this.wpEndpoint;
  }

  // WordPress-style queries (compatible with WordPress GraphQL)
  getPostsQuery() {
    if (this.isAWS) {
      // Use AWS-specific query
      return this.getAWSPostsQuery();
    }

    return `
      query GetPosts($first: Int, $after: String, $categorySlug: String, $searchQuery: String) {
        posts(
          first: $first
          after: $after
          where: {
            categoryName: $categorySlug
            search: $searchQuery
            status: PUBLISH
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
            content
            author {
              node {
                id
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
                name
                slug
                count
              }
            }
            tags {
              nodes {
                id
                name
                slug
                count
              }
            }
            featuredImage {
              node {
                id
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
  }

  getPostBySlugQuery() {
    if (this.isAWS) {
      // Use AWS-specific query
      return this.getAWSPostBySlugQuery();
    }

    return `
      query GetPostBySlug($slug: ID!) {
        post(id: $slug, idType: SLUG) {
          id
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
              name
              slug
              count
            }
          }
          tags {
            nodes {
              id
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
  }

  getCategoriesQuery() {
    if (this.isAWS) {
      // Use AWS-specific query
      return this.getAWSCategoriesQuery();
    }

    return `
      query GetCategories($first: Int) {
        categories(first: $first) {
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
  }

  getTagsQuery() {
    if (this.isAWS) {
      // Use AWS-specific query
      return this.getAWSTagsQuery();
    }

    return `
      query GetTags($first: Int) {
        tags(first: $first) {
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
  }

  // AWS-specific queries (simplified to match actual AWS schema)
  getAWSPostsQuery() {
    return `
      query GetPosts($first: Int) {
        posts(first: $first) {
          id
          title
          slug
          excerpt
          date
        }
      }
    `;
  }

  getAWSPostBySlugQuery() {
    return `
      query GetPostBySlug($slug: String!) {
        post(slug: $slug) {
          id
          title
          slug
          excerpt
          content
          date
        }
      }
    `;
  }

  getAWSCategoriesQuery() {
    return `
      query GetCategories($first: Int) {
        categories(first: $first) {
          id
          name
          slug
        }
      }
    `;
  }

  getAWSTagsQuery() {
    return `
      query GetTags($first: Int) {
        tags(first: $first) {
          id
          name
          slug
        }
      }
    `;
  }

  // Execute GraphQL query with proper error handling
  async executeQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    try {
      // Skip execution during build time
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL) {
        console.warn('Skipping GraphQL execution during build time');
        return {} as T;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GraphQL HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          url: this.endpoint,
          response: errorText
        });
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error('GraphQL Schema Errors:', result.errors);
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL request error:', {
        error: error instanceof Error ? error.message : String(error),
        url: this.endpoint,
        query: `${query.substring(0, 100)}...`,
        variables,
        isAWS: this.isAWS
      });
      
      throw error;
    }
  }

  // Hybrid method: Get basic post data from AWS, SEO data from WordPress
  async executeHybridPostQuery(slug: string): Promise<any> {
    try {
      // Skip execution during build time
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL) {
        console.warn('Skipping hybrid post query during build time');
        return null;
      }

      // Get basic post data from AWS (fast)
      const basicQuery = `
        query GetPostBySlug($slug: String!) {
          post(slug: $slug) {
            id
            title
            slug
            excerpt
            content
            date
          }
        }
      `;
      
      const basicResponse = await this.executeQueryWithEndpoint<{ post: any }>(
        this.awsEndpoint,
        basicQuery,
        { slug }
      );

      if (!basicResponse.post) {
        return null;
      }

      // Get SEO data from WordPress (for metadata)
      const seoQuery = `
        query GetPostSEO($slug: ID!) {
          post(id: $slug, idType: SLUG) {
            featuredImage {
              node {
                id
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
                name
                slug
                count
              }
            }
            tags {
              nodes {
                id
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

      try {
        const seoResponse = await this.executeQueryWithEndpoint<{ post: any }>(
          this.wpEndpoint,
          seoQuery,
          { slug }
        );

        // Merge AWS basic data with WordPress SEO data
        return {
          ...basicResponse.post,
          featuredImage: seoResponse.post?.featuredImage || null,
          categories: seoResponse.post?.categories || { nodes: [] },
          tags: seoResponse.post?.tags || { nodes: [] },
          seo: seoResponse.post?.seo || null,
        };
      } catch (seoError) {
        console.warn('SEO data fetch failed, using basic data only:', seoError);
        // Return basic data even if SEO fetch fails
        return {
          ...basicResponse.post,
          featuredImage: null,
          categories: { nodes: [] },
          tags: { nodes: [] },
          seo: null,
        };
      }
    } catch (error) {
      console.error('Hybrid post query failed:', error);
      throw error;
    }
  }

  // Execute query with specific endpoint
  private async executeQueryWithEndpoint<T>(
    endpoint: string,
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL query error:', {
        error: error instanceof Error ? error.message : String(error),
        endpoint,
        query: `${query.substring(0, 100)}...`,
        variables
      });
      throw error;
    }
  }

  // Get configuration for debugging
  getConfig() {
    return {
      endpoint: this.endpoint,
      awsEndpoint: this.awsEndpoint,
      wpEndpoint: this.wpEndpoint,
      isAWS: this.isAWS,
      isBuildTime: typeof window === 'undefined' && process.env.NODE_ENV === 'production'
    };
  }
}

// Export singleton instance
export const graphqlAdapter = new GraphQLAdapter(); 