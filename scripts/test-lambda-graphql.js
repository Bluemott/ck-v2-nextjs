const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

const testEvent = {
  body: JSON.stringify({
    query: `
      query {
        posts(first: 5) {
          nodes {
            id
            databaseId
            title
            slug
            date
            excerpt
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `
  })
};

async function testLambda() {
  try {
    console.log('🧪 Testing Lambda function directly...');
    
    const command = new InvokeCommand({
      FunctionName: 'WordPressBlogStack-WordPressGraphQLC0771999-wnF0kY4NTVtm',
      Payload: JSON.stringify(testEvent)
    });
    
    const response = await lambda.send(command);
    
    console.log('✅ Lambda response:');
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log(JSON.stringify(payload, null, 2));
    
    if (payload.body) {
      const body = JSON.parse(payload.body);
      console.log('\n📊 GraphQL response:');
      console.log(JSON.stringify(body, null, 2));
      
      if (body.data?.posts?.nodes) {
        console.log(`\n📝 Found ${body.data.posts.nodes.length} posts`);
      } else {
        console.log('\n❌ No posts found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Lambda:', error.message);
  }
}

testLambda(); 