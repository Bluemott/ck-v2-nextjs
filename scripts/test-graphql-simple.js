const https = require('https');

const GRAPHQL_ENDPOINT = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
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

async function testGraphQL() {
  console.log('🔍 Testing GraphQL API with simple query...');
  
  const query = {
    query: `
      query {
        posts(first: 5) {
          nodes {
            id
            title
            slug
          }
        }
      }
    `
  };
  
  try {
    const response = await makeRequest(GRAPHQL_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(query)
    });

    console.log(`📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('📋 Response Body:', response.body);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('\n✅ GraphQL query successful!');
      console.log('📊 Data:', JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ GraphQL query failed!');
    }
    
  } catch (error) {
    console.error('\n❌ GraphQL test error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testGraphQL(); 