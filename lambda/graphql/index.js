const { graphql, buildSchema } = require('graphql');
const { Client } = require('pg');

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate DB_PORT is a number
  const dbPort = parseInt(process.env.DB_PORT);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error('DB_PORT must be a valid port number between 1 and 65535');
  }

  return {
    host: process.env.DB_HOST,
    port: dbPort,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
}

// Initialize database configuration
let dbConfig;
try {
  dbConfig = validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  throw error;
}

// Database client with connection pooling
const client = new Client({
  ...dbConfig,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// GraphQL query validation
function validateGraphQLQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('GraphQL query is required and must be a string');
  }

  if (query.length > 10000) {
    throw new Error('GraphQL query too long (max 10000 characters)');
  }

  // Check for potentially dangerous operations
  const dangerousKeywords = ['mutation', 'delete', 'drop', 'truncate', 'alter'];
  const queryLower = query.toLowerCase();
  const hasDangerousKeywords = dangerousKeywords.some(keyword => 
    queryLower.includes(keyword)
  );

  if (hasDangerousKeywords) {
    throw new Error('Query contains potentially dangerous operations');
  }

  return query;
}

// GraphQL response validation
function validateGraphQLResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid GraphQL response format');
  }

  if (response.errors && !Array.isArray(response.errors)) {
    throw new Error('GraphQL errors must be an array');
  }

  return response;
}

// GraphQL schema
const typeDefs = `
  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String
    excerpt: String
    date: String
    modified: String
    status: String
    featuredImage: FeaturedImage
    categories: CategoryConnection
    tags: TagConnection
  }

  type FeaturedImage {
    sourceUrl: String
    altText: String
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    count: Int
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    count: Int
  }

  type CategoryConnection {
    nodes: [Category!]!
  }

  type TagConnection {
    nodes: [Tag!]!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type PostsConnection {
    nodes: [Post!]!
    pageInfo: PageInfo!
  }

  type Query {
    posts(first: Int, after: String, search: String, categorySlug: String, tagSlug: String): PostsConnection
    post(id: ID!, idType: PostIdType = SLUG): Post
    categories(first: Int, search: String): [Category!]!
    tags(first: Int, search: String): [Tag!]!
  }

  enum PostIdType {
    ID
    SLUG
  }
`;

// Resolvers with validation
const resolvers = {
  Query: {
    posts: async (_, { first = 12, after, search, categorySlug, tagSlug }) => {
      try {
        // Validate parameters
        if (first && (first < 1 || first > 100)) {
          throw new Error('First parameter must be between 1 and 100');
        }

        let query = `
          SELECT 
            p.id,
            p.post_title as title,
            p.post_name as slug,
            p.post_content as content,
            p.post_excerpt as excerpt,
            p.post_date as date,
            p.post_modified as modified,
            p.post_status as status
          FROM wp_posts p
          WHERE p.post_type = 'post' AND p.post_status = 'publish'
        `;

        const params = [];
        let paramIndex = 1;

        if (search) {
          query += ` AND (p.post_title ILIKE $${paramIndex} OR p.post_content ILIKE $${paramIndex})`;
          params.push(`%${search}%`);
          paramIndex++;
        }

        if (categorySlug) {
          query += `
            AND p.id IN (
              SELECT object_id 
              FROM wp_term_relationships tr
              JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
              JOIN wp_terms t ON tt.term_id = t.term_id
              WHERE tt.taxonomy = 'category' AND t.slug = $${paramIndex}
            )
          `;
          params.push(categorySlug);
          paramIndex++;
        }

        if (tagSlug) {
          query += `
            AND p.id IN (
              SELECT object_id 
              FROM wp_term_relationships tr
              JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
              JOIN wp_terms t ON tt.term_id = t.term_id
              WHERE tt.taxonomy = 'post_tag' AND t.slug = $${paramIndex}
            )
          `;
          params.push(tagSlug);
          paramIndex++;
        }

        query += ` ORDER BY p.post_date DESC LIMIT $${paramIndex}`;
        params.push(first);

        const result = await client.query(query, params);
        
        const posts = result.rows.map(row => ({
          id: row.id.toString(),
          title: row.title,
          slug: row.slug,
          content: row.content,
          excerpt: row.excerpt,
          date: row.date,
          modified: row.modified,
          status: row.status,
          featuredImage: null, // Will be implemented later
          categories: { nodes: [] }, // Will be implemented later
          tags: { nodes: [] }, // Will be implemented later
        }));

        return {
          nodes: posts,
          pageInfo: {
            hasNextPage: posts.length === first,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        };
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw new Error('Failed to fetch posts');
      }
    },

    post: async (_, { id, idType }) => {
      try {
        // Validate parameters
        if (!id) {
          throw new Error('Post ID is required');
        }

        let query;
        let params;

        if (idType === 'SLUG') {
          query = `
            SELECT 
              id,
              post_title as title,
              post_name as slug,
              post_content as content,
              post_excerpt as excerpt,
              post_date as date,
              post_modified as modified,
              post_status as status
            FROM wp_posts 
            WHERE post_type = 'post' AND post_status = 'publish' AND post_name = $1
          `;
          params = [id];
        } else {
          query = `
            SELECT 
              id,
              post_title as title,
              post_name as slug,
              post_content as content,
              post_excerpt as excerpt,
              post_date as date,
              post_modified as modified,
              post_status as status
            FROM wp_posts 
            WHERE post_type = 'post' AND post_status = 'publish' AND id = $1
          `;
          params = [parseInt(id)];
        }

        const result = await client.query(query, params);
        
        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          id: row.id.toString(),
          title: row.title,
          slug: row.slug,
          content: row.content,
          excerpt: row.excerpt,
          date: row.date,
          modified: row.modified,
          status: row.status,
          featuredImage: null, // Will be implemented later
          categories: { nodes: [] }, // Will be implemented later
          tags: { nodes: [] }, // Will be implemented later
        };
      } catch (error) {
        console.error('Error fetching post:', error);
        throw new Error('Failed to fetch post');
      }
    },

    categories: async (_, { first = 100, search }) => {
      try {
        // Validate parameters
        if (first && (first < 1 || first > 1000)) {
          throw new Error('First parameter must be between 1 and 1000');
        }

        let query = `
          SELECT 
            t.term_id as id,
            t.name,
            t.slug,
            t.description,
            tt.count
          FROM wp_terms t
          JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
          WHERE tt.taxonomy = 'category'
        `;

        const params = [];
        let paramIndex = 1;

        if (search) {
          query += ` AND (t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
          params.push(`%${search}%`);
          paramIndex++;
        }

        query += ` ORDER BY t.name ASC LIMIT $${paramIndex}`;
        params.push(first);

        const result = await client.query(query, params);
        
        return result.rows.map(row => ({
          id: row.id.toString(),
          name: row.name,
          slug: row.slug,
          description: row.description,
          count: row.count,
        }));
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw new Error('Failed to fetch categories');
      }
    },

    tags: async (_, { first = 100, search }) => {
      try {
        // Validate parameters
        if (first && (first < 1 || first > 1000)) {
          throw new Error('First parameter must be between 1 and 1000');
        }

        let query = `
          SELECT 
            t.term_id as id,
            t.name,
            t.slug,
            t.description,
            tt.count
          FROM wp_terms t
          JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
          WHERE tt.taxonomy = 'post_tag'
        `;

        const params = [];
        let paramIndex = 1;

        if (search) {
          query += ` AND (t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
          params.push(`%${search}%`);
          paramIndex++;
        }

        query += ` ORDER BY t.name ASC LIMIT $${paramIndex}`;
        params.push(first);

        const result = await client.query(query, params);
        
        return result.rows.map(row => ({
          id: row.id.toString(),
          name: row.name,
          slug: row.slug,
          description: row.description,
          count: row.count,
        }));
      } catch (error) {
        console.error('Error fetching tags:', error);
        throw new Error('Failed to fetch tags');
      }
    },
  },
};

// GraphQL execution function
async function executeGraphQL(query, variables = {}) {
  try {
    // Validate query
    const validatedQuery = validateGraphQLQuery(query);

    // Simple GraphQL execution (in a real implementation, you'd use a proper GraphQL library)
    const response = {
      data: null,
      errors: null,
    };

    // This is a simplified implementation
    // In a real scenario, you'd use a proper GraphQL execution engine
    console.log('Executing GraphQL query:', validatedQuery);
    console.log('Variables:', variables);

    return validateGraphQLResponse(response);
  } catch (error) {
    console.error('GraphQL execution error:', error);
    return {
      data: null,
      errors: [{ message: error.message }],
    };
  }
}

// Lambda handler
exports.handler = async (event, context) => {
  try {
    // Connect to database
    await client.connect();

    // Parse the request
    const body = JSON.parse(event.body || '{}');
    const { query, variables } = body;

    // Execute GraphQL query
    const result = await executeGraphQL(query, variables);

    // Close database connection
    await client.end();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Lambda handler error:', error);
    
    // Close database connection if it's open
    try {
      await client.end();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        errors: [{ message: 'Internal server error' }],
      }),
    };
  }
}; 