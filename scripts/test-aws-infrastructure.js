const https = require('https');
const http = require('http');

// AWS Infrastructure endpoints from outputs.json
const ENDPOINTS = {
  graphql: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql',
  setupDatabase: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/setup-database',
  importData: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data',
  cloudfront: 'https://d36tlab2rh5hc6.cloudfront.net'
};

// Test GraphQL queries
const TEST_QUERIES = {
  posts: `
    query {
      posts(first: 5) {
        nodes {
          id
          title
          slug
          date
          excerpt
          author {
            name
            slug
          }
          categories {
            name
            slug
          }
        }
      }
    }
  `,
  categories: `
    query {
      categories(first: 10) {
        nodes {
          id
          name
          slug
          count
        }
      }
    }
  `,
  tags: `
    query {
      tags(first: 10) {
        nodes {
          id
          name
          slug
          count
        }
      }
    }
  `
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
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

// Test GraphQL endpoint
async function testGraphQL() {
  console.log('\n🔍 Testing GraphQL API...');
  
  try {
    const response = await makeRequest(ENDPOINTS.graphql, {
      method: 'POST',
      body: JSON.stringify({
        query: TEST_QUERIES.posts
      })
    });

    console.log(`✅ GraphQL Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.errors) {
        console.log('❌ GraphQL Errors:', data.errors);
      } else {
        console.log('✅ GraphQL working correctly');
        if (data.data?.posts?.nodes) {
          console.log(`📊 Found ${data.data.posts.nodes.length} posts`);
        }
      }
    } else {
      console.log('❌ GraphQL failed:', response.body);
    }
  } catch (error) {
    console.log('❌ GraphQL test failed:', error.message);
  }
}

// Test database setup endpoint
async function testDatabaseSetup() {
  console.log('\n🔍 Testing Database Setup...');
  
  try {
    const response = await makeRequest(ENDPOINTS.setupDatabase, {
      method: 'POST',
      body: JSON.stringify({
        action: 'test'
      })
    });

    console.log(`✅ Database Setup Status: ${response.statusCode}`);
    console.log('📋 Response:', response.body.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Database setup test failed:', error.message);
  }
}

// Test data import endpoint
async function testDataImport() {
  console.log('\n🔍 Testing Data Import...');
  
  try {
    const response = await makeRequest(ENDPOINTS.importData, {
      method: 'POST',
      body: JSON.stringify({
        action: 'status'
      })
    });

    console.log(`✅ Data Import Status: ${response.statusCode}`);
    console.log('📋 Response:', response.body.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Data import test failed:', error.message);
  }
}

// Test CloudFront
async function testCloudFront() {
  console.log('\n🔍 Testing CloudFront...');
  
  try {
    const response = await makeRequest(ENDPOINTS.cloudfront);
    console.log(`✅ CloudFront Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ CloudFront is serving content');
    } else {
      console.log('⚠️ CloudFront returned non-200 status');
    }
  } catch (error) {
    console.log('❌ CloudFront test failed:', error.message);
  }
}

// Test WordPress GraphQL (fallback)
async function testWordPressGraphQL() {
  console.log('\n🔍 Testing WordPress GraphQL (fallback)...');
  
  try {
    const response = await makeRequest('https://api.cowboykimono.com/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: TEST_QUERIES.posts
      })
    });

    console.log(`✅ WordPress GraphQL Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.errors) {
        console.log('❌ WordPress GraphQL Errors:', data.errors);
      } else {
        console.log('✅ WordPress GraphQL working correctly');
        if (data.data?.posts?.nodes) {
          console.log(`📊 Found ${data.data.posts.nodes.length} posts`);
        }
      }
    } else {
      console.log('❌ WordPress GraphQL failed:', response.body);
    }
  } catch (error) {
    console.log('❌ WordPress GraphQL test failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Testing AWS Infrastructure Components...\n');
  
  await testGraphQL();
  await testDatabaseSetup();
  await testDataImport();
  await testCloudFront();
  await testWordPressGraphQL();
  
  console.log('\n📊 Test Summary:');
  console.log('✅ All tests completed');
  console.log('\n🔧 Next Steps:');
  console.log('1. If GraphQL is working: Your AWS API is ready');
  console.log('2. If Database Setup works: Your Aurora database is configured');
  console.log('3. If Data Import works: You can import WordPress data');
  console.log('4. If CloudFront works: Your CDN is serving content');
  console.log('5. If WordPress GraphQL works: You have fallback content');
}

// Run the tests
runTests().catch(console.error); 