const https = require('https');

// Configuration
const CONFIG = {
  graphqlEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql'
};

// Utility function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
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
          body: data,
          headers: res.headers
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

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection via GraphQL API...');
  
  // Test query to check if database is accessible
  const testQuery = {
    query: `
      query {
        posts(first: 1) {
          nodes {
            id
            title
          }
        }
      }
    `
  };

  try {
    console.log('📤 Sending test query to GraphQL API...');
    
    const response = await makeRequest(CONFIG.graphqlEndpoint, {
      method: 'POST',
      body: JSON.stringify(testQuery)
    });

    console.log(`📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Body:', response.body);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.data?.posts?.nodes) {
        console.log('✅ Database connection working!');
        console.log(`📊 Found ${data.data.posts.nodes.length} posts in database`);
      } else {
        console.log('⚠️  Database connected but no posts found');
      }
    } else {
      console.log('❌ Database connection failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing database connection:', error.message);
  }
}

testDatabaseConnection(); 