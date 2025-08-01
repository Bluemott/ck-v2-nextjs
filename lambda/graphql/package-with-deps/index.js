const { graphql, buildSchema } = require('graphql');

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

// Root resolver with mock data
const root = {
  posts: async ({ first = 10, after, categoryName, tagName, search }) => {
    console.log('🔍 Starting posts query...');
    console.log('📊 Returning mock data');
    
    // Return mock data
    const posts = [
      {
        id: 'post-1',
        databaseId: 1,
        date: '2025-07-31T00:00:00Z',
        modified: '2025-07-31T00:00:00Z',
        slug: 'test-post',
        status: 'publish',
        title: 'Test Post',
        content: 'This is a test post content.',
        excerpt: 'This is a test post excerpt.',
        author: {
          id: 'author-1',
          name: 'Test Author',
          slug: 'test-author',
          avatar: null
        },
        featuredImage: null,
        categories: [
          {
            id: 'category-1',
            name: 'Test Category',
            slug: 'test-category',
            description: 'A test category',
            count: 1
          }
        ],
        tags: [
          {
            id: 'tag-1',
            name: 'Test Tag',
            slug: 'test-tag',
            description: 'A test tag',
            count: 1
          }
        ],
        seo: null
      }
    ];
    
    const pageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'post-1',
      endCursor: 'post-1'
    };
    
    return {
      nodes: posts,
      pageInfo
    };
  },

  post: async ({ slug }) => {
    console.log(`🔍 Fetching post with slug: ${slug}`);
    
    if (slug === 'test-post') {
      return {
        id: 'post-1',
        databaseId: 1,
        date: '2025-07-31T00:00:00Z',
        modified: '2025-07-31T00:00:00Z',
        slug: 'test-post',
        status: 'publish',
        title: 'Test Post',
        content: 'This is a test post content.',
        excerpt: 'This is a test post excerpt.',
        author: {
          id: 'author-1',
          name: 'Test Author',
          slug: 'test-author',
          avatar: null
        },
        featuredImage: null,
        categories: [
          {
            id: 'category-1',
            name: 'Test Category',
            slug: 'test-category',
            description: 'A test category',
            count: 1
          }
        ],
        tags: [
          {
            id: 'tag-1',
            name: 'Test Tag',
            slug: 'test-tag',
            description: 'A test tag',
            count: 1
          }
        ],
        seo: null
      };
    }
    
    return null;
  },

  categories: async ({ first = 100 }) => {
    console.log('🔍 Fetching categories...');
    
    return [
      {
        id: 'category-1',
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category',
        count: 1
      }
    ];
  },

  category: async ({ slug }) => {
    console.log(`🔍 Fetching category with slug: ${slug}`);
    
    if (slug === 'test-category') {
      return {
        id: 'category-1',
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category',
        count: 1
      };
    }
    
    return null;
  },

  tags: async ({ first = 100 }) => {
    console.log('🔍 Fetching tags...');
    
    return [
      {
        id: 'tag-1',
        name: 'Test Tag',
        slug: 'test-tag',
        description: 'A test tag',
        count: 1
      }
    ];
  },

  tag: async ({ slug }) => {
    console.log(`🔍 Fetching tag with slug: ${slug}`);
    
    if (slug === 'test-tag') {
      return {
        id: 'tag-1',
        name: 'Test Tag',
        slug: 'test-tag',
        description: 'A test tag',
        count: 1
      };
    }
    
    return null;
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