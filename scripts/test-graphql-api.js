const https = require('https');

const GRAPHQL_URL = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';

const testQuery = {
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
          author {
            name
          }
          categories {
            name
            slug
          }
          tags {
            name
            slug
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  `
};

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: '0m6piyoypi.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: '/prod/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testGraphQL() {
  try {
    console.log('🧪 Testing GraphQL API...');
    console.log(`📡 URL: ${GRAPHQL_URL}`);
    
    const result = await makeRequest(testQuery);
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.data?.posts?.nodes) {
      console.log(`\n📊 Found ${result.data.posts.nodes.length} posts`);
      result.data.posts.nodes.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title} (${post.slug})`);
      });
    } else {
      console.log('❌ No posts found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing GraphQL API:', error.message);
  }
}

testGraphQL(); 