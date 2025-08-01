const https = require('https');

const WORDPRESS_GRAPHQL_URL = 'https://api.cowboykimono.com/graphql';

// WordPress GraphQL schema-compatible query
const TEST_QUERY = `
  query {
    posts(first: 5) {
      nodes {
        id
        title
        slug
        date
        excerpt
        author {
          node {
            name
            slug
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        tags {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testWordPressGraphQL() {
  console.log('🔍 Testing WordPress GraphQL API...\n');
  
  try {
    console.log('📤 Sending test query...');
    const response = await makeRequest(WORDPRESS_GRAPHQL_URL, {
      method: 'POST',
      body: JSON.stringify({
        query: TEST_QUERY
      })
    });

    console.log(`📊 Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        if (data.errors) {
          console.log('\n❌ GraphQL Errors:');
          data.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.message}`);
          });
        } else {
          console.log('\n✅ WordPress GraphQL working correctly!');
          if (data.data?.posts?.nodes) {
            console.log(`📊 Found ${data.data.posts.nodes.length} posts`);
            data.data.posts.nodes.forEach((post, index) => {
              console.log(`${index + 1}. ${post.title} (${post.slug})`);
            });
          }
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
      }
    } else {
      console.log('\n❌ HTTP Error - Response not 200');
      console.log('📋 Response:', response.body);
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testWordPressGraphQL(); 