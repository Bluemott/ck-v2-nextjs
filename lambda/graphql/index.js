const { graphql, buildSchema } = require('graphql');
const { Client } = require('pg');

// GraphQL Schema for WordPress blog
const schema = buildSchema(`
  type Author {
    id: ID!
    name: String!
    slug: String!
    avatar: String
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

  type FeaturedImage {
    id: ID!
    sourceUrl: String!
    altText: String
    width: Int
    height: Int
  }

  type SEO {
    title: String
    metaDesc: String
    canonical: String
    opengraphTitle: String
    opengraphDescription: String
    opengraphImage: String
    twitterTitle: String
    twitterDescription: String
    twitterImage: String
    focuskw: String
    metaKeywords: String
    metaRobotsNoindex: String
    metaRobotsNofollow: String
    opengraphType: String
    opengraphUrl: String
    opengraphSiteName: String
    opengraphAuthor: String
    opengraphPublishedTime: String
    opengraphModifiedTime: String
    schema: String
  }

  type Post {
    id: ID!
    databaseId: Int!
    date: String!
    modified: String!
    slug: String!
    status: String!
    title: String!
    content: String!
    excerpt: String!
    author: Author!
    featuredImage: FeaturedImage
    categories: [Category!]!
    tags: [Tag!]!
    seo: SEO
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
    posts(
      first: Int = 10
      after: String
      categoryName: String
      tagName: String
      search: String
    ): PostsConnection!
    
    post(slug: String!): Post
    
    categories(first: Int = 100): [Category!]!
    category(slug: String!): Category
    
    tags(first: Int = 100): [Tag!]!
    tag(slug: String!): Tag
  }
`);

// Database connection helper
async function getDbClient() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

// Root resolver with database queries
const root = {
  posts: async ({ first = 10, after, categoryName, tagName, search }) => {
    console.log('🔍 Starting posts query...');
    
    try {
      const client = await getDbClient();
      
      let query = `
        SELECT 
          id, wordpress_id, post_title, post_content, post_excerpt,
          post_status, post_name, post_date, post_modified,
          wordpress_data
        FROM wp_posts 
        WHERE post_status = 'publish'
      `;
      
      const params = [];
      
      if (search) {
        query += ` AND (post_title ILIKE $1 OR post_content ILIKE $1)`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY post_date DESC LIMIT $${params.length + 1}`;
      params.push(first);
      
      console.log('📊 Executing query:', query);
      const result = await client.query(query, params);
      
      const posts = result.rows.map(row => {
        const wordpressData = row.wordpress_data || {};
        return {
          id: `post-${row.wordpress_id}`,
          databaseId: row.wordpress_id,
          date: row.post_date,
          modified: row.post_modified,
          slug: row.post_name,
          status: row.post_status,
          title: row.post_title || '',
          content: row.post_content || '',
          excerpt: row.post_excerpt || '',
          author: {
            id: 'author-1',
            name: 'Cowboy Kimono',
            slug: 'cowboy-kimono',
            avatar: null
          },
          featuredImage: null,
          categories: [],
          tags: [],
          seo: null
        };
      });
      
      await client.end();
      
      const pageInfo = {
        hasNextPage: posts.length === first,
        hasPreviousPage: false,
        startCursor: posts.length > 0 ? posts[0].id : null,
        endCursor: posts.length > 0 ? posts[posts.length - 1].id : null
      };
      
      console.log(`✅ Found ${posts.length} posts`);
      return {
        nodes: posts,
        pageInfo
      };
      
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      return {
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null
        }
      };
    }
  },

  post: async ({ slug }) => {
    console.log(`🔍 Fetching post with slug: ${slug}`);
    
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT 
          id, wordpress_id, post_title, post_content, post_excerpt,
          post_status, post_name, post_date, post_modified,
          wordpress_data
        FROM wp_posts 
        WHERE post_name = $1 AND post_status = 'publish'
      `;
      
      const result = await client.query(query, [slug]);
      await client.end();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const wordpressData = row.wordpress_data || {};
      
      return {
        id: `post-${row.wordpress_id}`,
        databaseId: row.wordpress_id,
        date: row.post_date,
        modified: row.post_modified,
        slug: row.post_name,
        status: row.post_status,
        title: row.post_title || '',
        content: row.post_content || '',
        excerpt: row.post_excerpt || '',
        author: {
          id: 'author-1',
          name: 'Cowboy Kimono',
          slug: 'cowboy-kimono',
          avatar: null
        },
        featuredImage: null,
        categories: [],
        tags: [],
        seo: null
      };
      
    } catch (error) {
      console.error('❌ Error fetching post:', error);
      return null;
    }
  },

  categories: async ({ first = 100 }) => {
    console.log('🔍 Fetching categories...');
    
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT cat_ID, cat_name, category_nicename, category_description, wordpress_data
        FROM wp_categories 
        ORDER BY cat_name 
        LIMIT $1
      `;
      
      const result = await client.query(query, [first]);
      await client.end();
      
      const categories = result.rows.map(row => {
        const wordpressData = row.wordpress_data || {};
        return {
          id: `category-${row.cat_ID}`,
          name: row.cat_name || '',
          slug: row.category_nicename || '',
          description: row.category_description || '',
          count: wordpressData.count || 0
        };
      });
      
      console.log(`✅ Found ${categories.length} categories`);
      return categories;
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return [];
    }
  },

  category: async ({ slug }) => {
    console.log(`🔍 Fetching category with slug: ${slug}`);
    
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT cat_ID, cat_name, category_nicename, category_description, wordpress_data
        FROM wp_categories 
        WHERE category_nicename = $1
      `;
      
      const result = await client.query(query, [slug]);
      await client.end();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const wordpressData = row.wordpress_data || {};
      
      return {
        id: `category-${row.cat_ID}`,
        name: row.cat_name || '',
        slug: row.category_nicename || '',
        description: row.category_description || '',
        count: wordpressData.count || 0
      };
      
    } catch (error) {
      console.error('❌ Error fetching category:', error);
      return null;
    }
  },

  tags: async ({ first = 100 }) => {
    console.log('🔍 Fetching tags...');
    
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT tag_ID, tag_name, tag_slug, tag_description, wordpress_data
        FROM wp_tags 
        ORDER BY tag_name 
        LIMIT $1
      `;
      
      const result = await client.query(query, [first]);
      await client.end();
      
      const tags = result.rows.map(row => {
        const wordpressData = row.wordpress_data || {};
        return {
          id: `tag-${row.tag_ID}`,
          name: row.tag_name || '',
          slug: row.tag_slug || '',
          description: row.tag_description || '',
          count: wordpressData.count || 0
        };
      });
      
      console.log(`✅ Found ${tags.length} tags`);
      return tags;
      
    } catch (error) {
      console.error('❌ Error fetching tags:', error);
      return [];
    }
  },

  tag: async ({ slug }) => {
    console.log(`🔍 Fetching tag with slug: ${slug}`);
    
    try {
      const client = await getDbClient();
      
      const query = `
        SELECT tag_ID, tag_name, tag_slug, tag_description, wordpress_data
        FROM wp_tags 
        WHERE tag_slug = $1
      `;
      
      const result = await client.query(query, [slug]);
      await client.end();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const wordpressData = row.wordpress_data || {};
      
      return {
        id: `tag-${row.tag_ID}`,
        name: row.tag_name || '',
        slug: row.tag_slug || '',
        description: row.tag_description || '',
        count: wordpressData.count || 0
      };
      
    } catch (error) {
      console.error('❌ Error fetching tag:', error);
      return null;
    }
  }
};

// Lambda handler
exports.handler = async (event) => {
  try {
    console.log('🚀 Lambda function started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Parse the GraphQL query from the request
    const body = JSON.parse(event.body || '{}');
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

    console.log('📝 GraphQL query:', query);

    // Execute the GraphQL query
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
    console.error('❌ GraphQL handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        errors: [{ message: 'Internal server error', details: error.message }]
      })
    };
  }
}; 