const { graphql, buildSchema } = require('graphql');

// GraphQL Schema for WordPress blog
const schema = buildSchema(`
  type Post {
    id: ID!
    title: String!
    slug: String!
  }

  type PostsConnection {
    nodes: [Post!]!
  }

  type Query {
    posts(first: Int = 10): PostsConnection!
  }
`);

// Root resolver with simple mock data
const root = {
  posts: async ({ first = 10 }) => {
    console.log('🔍 Starting posts query...');
    
    const posts = [
      {
        id: 'post-1',
        title: 'Test Post',
        slug: 'test-post'
      }
    ];
    
    console.log(`✅ Found ${posts.length} posts`);
    return {
      nodes: posts
    };
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