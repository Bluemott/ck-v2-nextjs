const { graphql, buildSchema } = require('graphql');
const { Client } = require('pg');

// Enhanced GraphQL Schema for WordPress blog
const schema = buildSchema(`
  type Query {
    health: String!
    dbStatus: String!
    posts(first: Int = 10): [Post!]!
    post(slug: String!): Post
    categories(first: Int = 100): [Category!]!
    tags(first: Int = 100): [Tag!]!
  }
  
  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    excerpt: String!
    date: String!
  }
  
  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    count: Int!
  }
  
  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    count: Int!
  }
`);

// Enhanced database connection with retry logic
async function createDbClient() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 1 // Single connection for Lambda
  };
  
  console.log('🔌 Connecting to database:', {
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user,
    port: dbConfig.port
  });
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Test database connectivity
async function testDatabaseConnection() {
  let client;
  try {
    client = await createDbClient();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('📊 Database test result:', result.rows[0]);
    return 'Database connection successful';
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return `Database connection failed: ${error.message}`;
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error('Error closing client:', e);
      }
    }
  }
}

// Enhanced root resolver with error handling
const root = {
  health: () => {
    return 'GraphQL API is healthy!';
  },
  
  dbStatus: async () => {
    return await testDatabaseConnection();
  },
  
  posts: async ({ first = 10 }) => {
    console.log(`🔍 Fetching ${first} posts...`);
    let client;
    
    try {
      client = await createDbClient();
      
      // Simple query to start with - fix the wordpress_id field
      const query = `
        SELECT 
          id,
          COALESCE(wordpress_id, id) as database_id,
          post_title as title,
          post_name as slug,
          post_content as content,
          post_excerpt as excerpt,
          post_date as date
        FROM wp_posts 
        WHERE post_status = 'publish' 
        ORDER BY post_date DESC 
        LIMIT $1
      `;
      
      console.log('📝 Executing query with limit:', first);
      const result = await client.query(query, [first]);
      
      console.log(`📈 Found ${result.rows.length} posts`);
      
      const posts = result.rows.map(row => ({
        id: `post-${row.database_id}`,
        title: row.title || 'Untitled',
        slug: row.slug || '',
        content: row.content || '',
        excerpt: row.excerpt || '',
        date: row.date || new Date().toISOString()
      }));
      
      return posts;
      
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      // Return empty array instead of throwing
      return [];
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  },
  
  post: async ({ slug }) => {
    console.log(`🔍 Fetching post with slug: ${slug}`);
    let client;
    
    try {
      client = await createDbClient();
      
      const query = `
        SELECT 
          id,
          COALESCE(wordpress_id, id) as database_id,
          post_title as title,
          post_name as slug,
          post_content as content,
          post_excerpt as excerpt,
          post_date as date
        FROM wp_posts 
        WHERE post_name = $1 AND post_status = 'publish'
      `;
      
      const result = await client.query(query, [slug]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: `post-${row.database_id}`,
        title: row.title || 'Untitled',
        slug: row.slug || '',
        content: row.content || '',
        excerpt: row.excerpt || '',
        date: row.date || new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error fetching post:', error);
      return null;
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  },
  
  categories: async ({ first = 100 }) => {
    console.log(`🔍 Fetching ${first} categories...`);
    let client;
    
    try {
      client = await createDbClient();
      
      // Query to get categories from WordPress term taxonomy
      const query = `
        SELECT 
          t.term_id as id,
          t.name,
          t.slug,
          t.description,
          tt.count
        FROM wp_terms t
        INNER JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
        WHERE tt.taxonomy = 'category'
        AND tt.count > 0
        ORDER BY t.name
        LIMIT $1
      `;
      
      console.log('📝 Executing categories query with limit:', first);
      const result = await client.query(query, [first]);
      
      console.log(`📈 Found ${result.rows.length} categories`);
      
      const categories = result.rows.map(row => ({
        id: `category-${row.id}`,
        name: row.name || 'Untitled Category',
        slug: row.slug || '',
        description: row.description || null,
        count: parseInt(row.count) || 0
      }));
      
      return categories;
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return [];
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  },
  
  tags: async ({ first = 100 }) => {
    console.log(`🔍 Fetching ${first} tags...`);
    let client;
    
    try {
      client = await createDbClient();
      
      // Query to get tags from WordPress term taxonomy
      const query = `
        SELECT 
          t.term_id as id,
          t.name,
          t.slug,
          t.description,
          tt.count
        FROM wp_terms t
        INNER JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
        WHERE tt.taxonomy = 'post_tag'
        AND tt.count > 0
        ORDER BY t.name
        LIMIT $1
      `;
      
      console.log('📝 Executing tags query with limit:', first);
      const result = await client.query(query, [first]);
      
      console.log(`📈 Found ${result.rows.length} tags`);
      
      const tags = result.rows.map(row => ({
        id: `tag-${row.id}`,
        name: row.name || 'Untitled Tag',
        slug: row.slug || '',
        description: row.description || null,
        count: parseInt(row.count) || 0
      }));
      
      return tags;
      
    } catch (error) {
      console.error('❌ Error fetching tags:', error);
      return [];
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }
    }
  }
};

// Enhanced Lambda handler with comprehensive error handling
exports.handler = async (event) => {
  console.log('🚀 GraphQL Lambda Function Started');
  console.log('📋 Event:', JSON.stringify(event, null, 2));
  console.log('🌍 Environment Variables:');
  console.log('  - DB_HOST:', process.env.DB_HOST);
  console.log('  - DB_NAME:', process.env.DB_NAME);
  console.log('  - DB_USER:', process.env.DB_USER);
  console.log('  - DB_PORT:', process.env.DB_PORT);
  console.log('  - NODE_ENV:', process.env.NODE_ENV);

  try {
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ message: 'CORS preflight response' })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('❌ Body parsing error:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          errors: [{ message: 'Invalid JSON in request body' }]
        })
      };
    }

    const { query, variables } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          errors: [{ message: 'No GraphQL query provided' }]
        })
      };
    }

    console.log('📝 GraphQL Query:', query);
    console.log('📊 Variables:', variables);

    // Execute GraphQL query
    const result = await graphql({
      schema,
      source: query,
      rootValue: root,
      variableValues: variables
    });

    console.log('✅ GraphQL execution completed');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Lambda handler error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        errors: [{ 
          message: 'Internal server error',
          details: error.message,
          timestamp: new Date().toISOString()
        }]
      })
    };
  }
};