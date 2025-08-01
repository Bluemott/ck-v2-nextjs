#!/usr/bin/env node

/**
 * Test GraphQL Schema Compatibility
 * Verifies that the Lambda GraphQL schema matches WordPress GraphQL structure
 */

const https = require('https');

const AWS_GRAPHQL_URL = process.env.NEXT_PUBLIC_AWS_GRAPHQL_URL || 
                        'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';

const WORDPRESS_GRAPHQL_URL = process.env.NEXT_PUBLIC_WPGRAPHQL_URL || 
                              'https://api.cowboykimono.com/graphql';

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

async function testGraphQLQuery(url, query, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    console.log(`📡 URL: ${url}`);
    
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ query })
    });

    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}: ${response.body}`);
    }

    const data = JSON.parse(response.body);
    
    if (data.errors) {
      console.error('❌ GraphQL Errors:', data.errors);
      return false;
    }

    console.log('✅ Query successful');
    console.log('📊 Response structure:', JSON.stringify(data.data, null, 2).substring(0, 500) + '...');
    return true;

  } catch (error) {
    console.error(`❌ Error testing ${description}:`, error.message);
    return false;
  }
}

async function compareSchemas() {
  console.log('🔍 Comparing GraphQL Schemas...\n');

  // Test queries that should work with the actual schema
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
      description: 'Posts query with nodes'
    },
    {
      query: `
        query TestCategories {
          categories(first: 5) {
            nodes {
              id
              name
              slug
              description
              count
            }
          }
        }
      `,
      description: 'Categories query with nodes'
    },
    {
      query: `
        query TestTags {
          tags(first: 5) {
            nodes {
              id
              name
              slug
              description
              count
            }
          }
        }
      `,
      description: 'Tags query with nodes'
    }
  ];

  let awsSuccessCount = 0;
  let wordpressSuccessCount = 0;

  for (const testQuery of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testQuery.description}`);
    console.log(`${'='.repeat(60)}`);

    const awsSuccess = await testGraphQLQuery(
      AWS_GRAPHQL_URL, 
      testQuery.query, 
      'AWS GraphQL'
    );
    
    const wordpressSuccess = await testGraphQLQuery(
      WORDPRESS_GRAPHQL_URL, 
      testQuery.query, 
      'WordPress GraphQL'
    );

    if (awsSuccess) awsSuccessCount++;
    if (wordpressSuccess) wordpressSuccessCount++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 COMPARISON RESULTS');
  console.log(`${'='.repeat(60)}`);
  console.log(`AWS GraphQL: ${awsSuccessCount}/${testQueries.length} tests passed`);
  console.log(`WordPress GraphQL: ${wordpressSuccessCount}/${testQueries.length} tests passed`);

  if (awsSuccessCount === testQueries.length && wordpressSuccessCount === testQueries.length) {
    console.log('\n✅ SCHEMA COMPATIBILITY CONFIRMED');
    console.log('🎉 Both GraphQL endpoints return compatible data structures');
    console.log('🚀 Your Lambda function should work seamlessly with API Gateway');
  } else {
    console.log('\n⚠️ SCHEMA INCOMPATIBILITY DETECTED');
    console.log('🔧 Some queries failed - check the error messages above');
    console.log('📝 You may need to update the Lambda schema further');
  }
}

// Run the comparison
compareSchemas().catch(console.error); 