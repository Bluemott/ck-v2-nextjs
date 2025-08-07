#!/usr/bin/env node

/**
 * Redis Cache Test Script
 * Tests the enhanced Redis cache implementation
 *
 * Usage: node scripts/test-redis-cache.js
 */

// Dynamic import for TypeScript modules
async function loadCacheModule() {
  try {
    const cacheModule = await import('../app/lib/cache.ts');
    return cacheModule;
  } catch (error) {
    console.error('Failed to load cache module:', error);
    throw error;
  }
}

async function testRedisCache() {
  console.log('🧪 Testing Redis Cache Implementation...\n');

  try {
    // Load cache module
    const { enhancedCache, checkCacheHealthWithRedis } =
      await loadCacheModule();

    // Test 1: Basic Redis connection
    console.log('1. Testing Redis connection...');
    const health = await checkCacheHealthWithRedis();
    console.log(`   Redis Status: ${health.redisStatus}`);
    console.log(`   Cache Status: ${health.status}`);

    if (health.redisStatus === 'connected') {
      console.log('   ✅ Redis connection successful');
    } else {
      console.log('   ⚠️  Redis not available, falling back to memory cache');
    }

    // Test 2: Basic cache operations
    console.log('\n2. Testing basic cache operations...');

    // Test set and get
    await enhancedCache.setWithRedis(
      'test:basic',
      { message: 'Hello Redis!', timestamp: Date.now() },
      60000
    );
    const basicResult = await enhancedCache.getWithRedis('test:basic');

    if (basicResult && basicResult.message === 'Hello Redis!') {
      console.log('   ✅ Basic set/get operations working');
    } else {
      console.log('   ❌ Basic set/get operations failed');
    }

    // Test 3: WordPress-specific cache methods
    console.log('\n3. Testing WordPress-specific cache methods...');

    // Test categories cache
    try {
      const categories = await enhancedCache.getCachedCategoriesWithRedis();
      console.log(
        `   ✅ Categories cache: ${categories.length} categories loaded`
      );
    } catch (error) {
      console.log(`   ⚠️  Categories cache test failed: ${error.message}`);
    }

    // Test tags cache
    try {
      const tags = await enhancedCache.getCachedTagsWithRedis();
      console.log(`   ✅ Tags cache: ${tags.length} tags loaded`);
    } catch (error) {
      console.log(`   ⚠️  Tags cache test failed: ${error.message}`);
    }

    // Test 4: Cache warming
    console.log('\n4. Testing cache warming...');
    try {
      await enhancedCache.warmCacheWithRedis();
      console.log('   ✅ Cache warming completed');
    } catch (error) {
      console.log(`   ⚠️  Cache warming failed: ${error.message}`);
    }

    // Test 5: Cache invalidation
    console.log('\n5. Testing cache invalidation...');
    try {
      await enhancedCache.setWithRedis(
        'test:invalidation',
        { data: 'test' },
        60000
      );
      const beforeInvalidation =
        await enhancedCache.getWithRedis('test:invalidation');

      if (beforeInvalidation) {
        // Invalidate specific key
        await enhancedCache['redisClient']?.del('test:invalidation');
        const afterInvalidation =
          await enhancedCache.getWithRedis('test:invalidation');

        if (!afterInvalidation) {
          console.log('   ✅ Cache invalidation working');
        } else {
          console.log('   ❌ Cache invalidation failed');
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Cache invalidation test failed: ${error.message}`);
    }

    // Test 6: Performance test
    console.log('\n6. Testing cache performance...');
    const startTime = Date.now();

    // Test multiple concurrent operations
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        enhancedCache.setWithRedis(
          `perf:test:${i}`,
          { index: i, data: 'performance test' },
          30000
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
      getPromises.push(enhancedCache.getWithRedis(`perf:test:${i}`));
    }

    await Promise.all(getPromises);
    const getTime = Date.now() - getStartTime;
    console.log(`   ✅ Get operations: ${getTime}ms for 10 operations`);

    // Test 7: Memory usage and statistics
    console.log('\n7. Testing cache statistics...');
    const stats = enhancedCache.getStats();
    console.log(`   Memory Usage: ${stats.memoryUsage}`);
    console.log(`   Cache Size: ${stats.cacheSize}/${stats.maxSize}`);
    console.log(`   Hit Rate: ${stats.hitRate}`);
    console.log(`   Eviction Count: ${stats.evictionCount}`);

    // Test 8: Health check
    console.log('\n8. Final health check...');
    const finalHealth = await checkCacheHealthWithRedis();
    console.log(`   Overall Status: ${finalHealth.status}`);
    console.log(`   Redis Status: ${finalHealth.redisStatus}`);

    if (finalHealth.issues.length > 0) {
      console.log('   Issues found:');
      finalHealth.issues.forEach((issue) => console.log(`     - ${issue}`));
    }

    if (finalHealth.recommendations.length > 0) {
      console.log('   Recommendations:');
      finalHealth.recommendations.forEach((rec) =>
        console.log(`     - ${rec}`)
      );
    }

    console.log('\n🎉 Redis Cache Test Completed!');

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(
      `   Redis Connection: ${health.redisStatus === 'connected' ? '✅ Connected' : '⚠️  Not Available'}`
    );
    console.log(
      `   Cache Performance: ${getTime < 100 ? '✅ Excellent' : getTime < 500 ? '✅ Good' : '⚠️  Slow'}`
    );
    console.log(`   Memory Usage: ${stats.memoryUsage}`);
    console.log(`   Hit Rate: ${stats.hitRate}`);
  } catch (error) {
    console.error('❌ Redis cache test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRedisCache().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testRedisCache };
