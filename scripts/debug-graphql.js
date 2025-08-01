const https = require('https');

const GRAPHQL_ENDPOINT = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';

// Simple test query
const TEST_QUERY = `
  query {
    posts(first: 1) {
      nodes {
        id
        title
        slug
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

async function debugGraphQL() {
  console.log('🔍 Debugging AWS GraphQL API...\n');
  
  try {
    console.log('📤 Sending test query...');
    const response = await makeRequest(GRAPHQL_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        query: TEST_QUERY
      })
    });

    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log(`📋 Headers:`, response.headers);
    console.log(`📄 Response Body:`, response.body);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        if (data.errors) {
          console.log('\n❌ GraphQL Errors:');
          data.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.message}`);
            if (error.locations) {
              console.log(`   Location: ${JSON.stringify(error.locations)}`);
            }
          });
        } else {
          console.log('\n✅ GraphQL query successful!');
          console.log('📊 Data:', JSON.stringify(data, null, 2));
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
      }
    } else {
      console.log('\n❌ HTTP Error - Response not 200');
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

debugGraphQL(); 