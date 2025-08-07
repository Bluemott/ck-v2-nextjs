#!/usr/bin/env node

/**
 * Simple Redis Cache Test Script
 * Tests the enhanced Redis cache implementation
 *
 * Usage: node scripts/test-redis-cache-simple.js
 */

const { createClient } = require('redis');

async function testRedisConnection() {
  console.log('🧪 Testing Redis Connection...\n');

  let redisClient = null;

  try {
    // Test 1: Basic Redis connection
    console.log('1. Testing Redis connection...');

    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    await redisClient.connect();
    console.log('   ✅ Redis connection successful');

    // Test 2: Basic operations
    console.log('\n2. Testing basic Redis operations...');

    // Test set and get
    await redisClient.setEx(
      'test:basic',
      60,
      JSON.stringify({ message: 'Hello Redis!', timestamp: Date.now() })
    );
    const basicResult = await redisClient.get('test:basic');

    if (basicResult) {
      const parsed = JSON.parse(basicResult);
      if (parsed.message === 'Hello Redis!') {
        console.log('   ✅ Basic set/get operations working');
      } else {
        console.log('   ❌ Basic set/get operations failed');
      }
    } else {
      console.log('   ❌ Basic get operation failed');
    }

    // Test 3: Performance test
    console.log('\n3. Testing Redis performance...');
    const startTime = Date.now();

    // Test multiple concurrent operations
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        redisClient.setEx(
          `perf:test:${i}`,
          30,
          JSON.stringify({ index: i, data: 'performance test' })
        )
      );
    }

    await Promise.all(promises);
    const setTime = Date.now() - startTime;
    console.log(`   ✅ Set operations: ${setTime}ms for 10 operations`);

    // Test get operations
    const getStartTime = Date.now();
    const getPromises = [];
    for (let i = 0; i < 10; i++) {
      getPromises.push(redisClient.get(`perf:test:${i}`));
    }

    await Promise.all(getPromises);
    const getTime = Date.now() - getStartTime;
    console.log(`   ✅ Get operations: ${getTime}ms for 10 operations`);

    // Test 4: Cache invalidation
    console.log('\n4. Testing cache invalidation...');
    await redisClient.setEx(
      'test:invalidation',
      60,
      JSON.stringify({ data: 'test' })
    );
    const beforeInvalidation = await redisClient.get('test:invalidation');

    if (beforeInvalidation) {
      await redisClient.del('test:invalidation');
      const afterInvalidation = await redisClient.get('test:invalidation');

      if (!afterInvalidation) {
        console.log('   ✅ Cache invalidation working');
      } else {
        console.log('   ❌ Cache invalidation failed');
      }
    }

    // Test 5: Health check
    console.log('\n5. Testing Redis health...');
    const pingResult = await redisClient.ping();
    if (pingResult === 'PONG') {
      console.log('   ✅ Redis health check passed');
    } else {
      console.log('   ❌ Redis health check failed');
    }

    console.log('\n🎉 Redis Connection Test Completed!');

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Redis Connection: ✅ Connected`);
    console.log(
      `   Cache Performance: ${getTime < 100 ? '✅ Excellent' : getTime < 500 ? '✅ Good' : '⚠️  Slow'}`
    );
    console.log(
      `   Set Performance: ${setTime < 100 ? '✅ Excellent' : setTime < 500 ? '✅ Good' : '⚠️  Slow'}`
    );
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Make sure Redis server is running');
    console.log('   2. Check REDIS_URL environment variable');
    console.log('   3. Try: redis://localhost:6379');
    console.log(
      '   4. For AWS ElastiCache: redis://your-instance.amazonaws.com:6379'
    );
    console.log('   5. For Redis Cloud: redis://username:password@host:port');
  } finally {
    if (redisClient) {
      try {
        await redisClient.quit();
        console.log('\n   🔌 Redis connection closed');
      } catch (error) {
        console.error('   ⚠️  Error closing Redis connection:', error.message);
      }
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRedisConnection().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testRedisConnection };
