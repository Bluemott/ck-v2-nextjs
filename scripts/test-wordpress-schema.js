const https = require('https');

const WORDPRESS_GRAPHQL_URL = 'https://api.cowboykimono.com/graphql';

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

async function testWordPressSchema() {
  console.log('🔍 Testing WordPress GraphQL Schema...\n');
  
  const testQueries = [
    {
      query: `
        query TestPosts {
          posts(first: 1) {
            nodes {
              id
              title
              slug
              content
              excerpt
              date
            }
          }
        }
      `,
      description: 'Posts with nodes'
    },
    {
      query: `
        query TestPostsDirect {
          posts(first: 1) {
            id
            title
            slug
          }
        }
      `,
      description: 'Posts direct (no nodes)'
    },
    {
      query: `
        query TestCategories {
          categories(first: 1) {
            nodes {
              id
              name
              slug
            }
          }
        }
      `,
      description: 'Categories with nodes'
    },
    {
      query: `
        query TestCategoriesDirect {
          categories(first: 1) {
            id
            name
            slug
          }
        }
      `,
      description: 'Categories direct (no nodes)'
    }
  ];

  for (const testQuery of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testQuery.description}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const response = await makeRequest(WORDPRESS_GRAPHQL_URL, {
        method: 'POST',
        body: JSON.stringify({ query: testQuery.query })
      });

      console.log(`📊 Response Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        
        if (data.errors) {
          console.error('❌ GraphQL Errors:', data.errors);
        } else {
          console.log('✅ Query successful');
          console.log('📊 Response structure:', JSON.stringify(data.data, null, 2).substring(0, 500) + '...');
        }
      } else {
        console.error('❌ HTTP Error:', response.body);
      }
      
    } catch (error) {
      console.error('❌ Request error:', error.message);
    }
  }
}

testWordPressSchema().catch(console.error); 