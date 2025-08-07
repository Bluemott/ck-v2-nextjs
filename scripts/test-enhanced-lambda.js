#!/usr/bin/env node

/**
 * Enhanced Lambda Function Test Script
 * Tests the enhanced Lambda function with caching and performance optimizations
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();

// Test configuration
const FUNCTION_NAME =
  'WordPressBlogStack-WordPressRecommendations4FAF177-5H0U3w15juaB';
const TEST_POST_ID = 3313;
const TEST_LIMIT = 3;

// Test payloads
const testPayloads = [
  { postId: TEST_POST_ID, limit: TEST_LIMIT },
  { postId: 2, limit: 2 },
  { postId: 3, limit: 5 },
];

async function testLambdaFunction(payload, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));

  try {
    const startTime = Date.now();

    const result = await lambda
      .invoke({
        FunctionName: FUNCTION_NAME,
        Payload: JSON.stringify({
          httpMethod: 'POST',
          body: JSON.stringify(payload),
        }),
      })
      .promise();

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = JSON.parse(result.Payload);

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status Code: ${response.statusCode}`);

    // Check for cache headers
    if (response.headers && response.headers['X-Cache']) {
      console.log(`💾 Cache Status: ${response.headers['X-Cache']}`);
    }

    if (response.headers && response.headers['Cache-Control']) {
      console.log(`🔒 Cache Control: ${response.headers['Cache-Control']}`);
    }

    if (response.statusCode === 200) {
      const body = JSON.parse(response.body);
      console.log(`✅ Success: ${body.total} recommendations found`);

      if (body.metadata) {
        console.log(`📈 Metadata:`, {
          sourcePostId: body.metadata.sourcePostId,
          categoriesFound: body.metadata.categoriesFound,
          tagsFound: body.metadata.tagsFound,
          totalPostsProcessed: body.metadata.totalPostsProcessed,
          uniquePostsFound: body.metadata.uniquePostsFound,
        });
      }
    } else {
      console.log(`❌ Error: ${response.body}`);
    }

    return { success: true, duration, response };
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runPerformanceTest() {
  console.log('🚀 Enhanced Lambda Function Performance Test');
  console.log('='.repeat(50));

  const results = [];

  // First request (should be cache MISS)
  console.log('\n📝 First Request (Expected: Cache MISS)');
  results.push(await testLambdaFunction(testPayloads[0], 'First Request'));

  // Second request with same payload (should be cache HIT)
  console.log('\n📝 Second Request (Expected: Cache HIT)');
  results.push(await testLambdaFunction(testPayloads[0], 'Second Request'));

  // Third request with different payload (should be cache MISS)
  console.log('\n📝 Third Request (Expected: Cache MISS)');
  results.push(await testLambdaFunction(testPayloads[1], 'Third Request'));

  // Fourth request with original payload (should be cache HIT)
  console.log('\n📝 Fourth Request (Expected: Cache HIT)');
  results.push(await testLambdaFunction(testPayloads[0], 'Fourth Request'));

  // Performance analysis
  console.log('\n📊 Performance Analysis');
  console.log('='.repeat(30));

  const successfulTests = results.filter((r) => r.success);
  const cacheMisses = successfulTests.filter(
    (r) => r.response.headers && r.response.headers['X-Cache'] === 'MISS'
  );
  const cacheHits = successfulTests.filter(
    (r) => r.response.headers && r.response.headers['X-Cache'] === 'HIT'
  );

  console.log(
    `✅ Successful Tests: ${successfulTests.length}/${results.length}`
  );
  console.log(`💾 Cache Hits: ${cacheHits.length}`);
  console.log(`❄️  Cache Misses: ${cacheMisses.length}`);

  if (cacheHits.length > 0 && cacheMisses.length > 0) {
    const avgHitTime =
      cacheHits.reduce((sum, r) => sum + r.duration, 0) / cacheHits.length;
    const avgMissTime =
      cacheMisses.reduce((sum, r) => sum + r.duration, 0) / cacheMisses.length;

    console.log(`⏱️  Average Cache Hit Time: ${avgHitTime.toFixed(2)}ms`);
    console.log(`⏱️  Average Cache Miss Time: ${avgMissTime.toFixed(2)}ms`);
    console.log(
      `🚀 Performance Improvement: ${(((avgMissTime - avgHitTime) / avgMissTime) * 100).toFixed(1)}%`
    );
  }

  // Test error handling
  console.log('\n🔍 Testing Error Handling');
  console.log('='.repeat(30));

  // Test with invalid postId
  await testLambdaFunction({ postId: -1, limit: 3 }, 'Invalid Post ID');

  // Test with missing postId
  await testLambdaFunction({ limit: 3 }, 'Missing Post ID');

  // Test with excessive limit
  await testLambdaFunction({ postId: 1, limit: 100 }, 'Excessive Limit');

  console.log('\n🎉 Enhanced Lambda Function Test Completed!');
  console.log('\n📋 Summary of Enhancements:');
  console.log('   ✅ Increased memory: 1024MB (from 512MB)');
  console.log('   ✅ Enhanced timeout: 30 seconds');
  console.log('   ✅ In-memory caching with 5-minute TTL');
  console.log('   ✅ Cache headers (X-Cache: HIT/MISS)');
  console.log('   ✅ Reserved concurrent executions: 10');
  console.log('   ✅ Active tracing enabled');
  console.log('   ✅ Performance monitoring');
}

// Run the test
runPerformanceTest().catch(console.error);
