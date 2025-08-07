/* eslint-disable no-console */
import { lambdaAPIClient } from './lambda-api';
import { fetchRecommendationsWithMetadata } from './api';

/**
 * Test Lambda API integration
 * This file can be used to test the Lambda API functionality
 */
export async function testLambdaAPI() {
  console.log('🧪 Testing Lambda API Integration...');
  
  try {
    // Test 1: Check Lambda API configuration
    console.log('\n📋 Lambda API Configuration:');
    const config = lambdaAPIClient.getConfig();
    console.log('Base URL:', config.baseUrl);
    console.log('Timeout:', config.timeout);
    console.log('Retry Attempts:', config.retryAttempts);
    
    // Test 2: Test recommendations with a known post ID
    console.log('\n🔍 Testing Recommendations API...');
    const testPostId = 3313; // Use a known post ID from your WordPress site
    
    const result = await fetchRecommendationsWithMetadata(testPostId, 3);
    
    console.log('✅ Recommendations Result:');
    console.log('Source:', result.source);
    console.log('Total Recommendations:', result.total);
    console.log('Recommendations Found:', result.recommendations.length);
    
    if (result.metadata) {
      console.log('📊 Metadata:');
      console.log('- Categories Found:', result.metadata.categoriesFound);
      console.log('- Tags Found:', result.metadata.tagsFound);
      console.log('- Posts Processed:', result.metadata.totalPostsProcessed);
      console.log('- Unique Posts:', result.metadata.uniquePostsFound);
    }
    
    // Test 3: Display recommendations
    if (result.recommendations.length > 0) {
      console.log('\n📝 Recommendations:');
      result.recommendations.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title?.rendered || 'Untitled'} (ID: ${post.id})`);
        const postWithScore = post as Record<string, unknown>;
        if (postWithScore.score !== undefined) {
          console.log(`   Score: ${postWithScore.score}, Categories: ${postWithScore.categoryOverlap || 0}, Tags: ${postWithScore.tagOverlap || 0}`);
        }
      });
    }
    
    // Test 4: Test error handling with invalid post ID
    console.log('\n⚠️ Testing Error Handling...');
    try {
      await fetchRecommendationsWithMetadata(999999, 3);
      console.log('❌ Expected error for invalid post ID, but got success');
    } catch {
      console.log('✅ Error handling working correctly for invalid post ID');
    }
    
    console.log('\n🎉 Lambda API Integration Test Complete!');
    return {
      success: true,
      source: result.source,
      recommendationsCount: result.recommendations.length,
      metadata: result.metadata,
    };
    
  } catch (error) {
    console.error('❌ Lambda API Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Lambda API performance
 */
export async function testLambdaAPIPerformance() {
  console.log('⚡ Testing Lambda API Performance...');
  
  const testPostId = 3313;
  const iterations = 5;
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      await lambdaAPIClient.getRecommendations(testPostId, 3);
      const duration = Date.now() - startTime;
      results.push(duration);
      console.log(`Test ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.error(`Test ${i + 1} failed:`, error);
    }
  }
  
  if (results.length > 0) {
    const avgDuration = results.reduce((a, b) => a + b, 0) / results.length;
    const minDuration = Math.min(...results);
    const maxDuration = Math.max(...results);
    
    console.log('\n📊 Performance Results:');
    console.log('Average Response Time:', avgDuration.toFixed(2), 'ms');
    console.log('Min Response Time:', minDuration, 'ms');
    console.log('Max Response Time:', maxDuration, 'ms');
    
    return {
      success: true,
      averageDuration: avgDuration,
      minDuration,
      maxDuration,
      results,
    };
  }
  
  return {
    success: false,
    error: 'No successful tests completed',
  };
}

/**
 * Test fallback behavior
 */
export async function testFallbackBehavior() {
  console.log('🔄 Testing Fallback Behavior...');
  
  try {
    // Test with a post that might not have many related posts
    const testPostId = 1; // Usually the first post
    
    const result = await fetchRecommendationsWithMetadata(testPostId, 3);
    
    console.log('Fallback Test Result:');
    console.log('Source:', result.source);
    console.log('Recommendations Found:', result.recommendations.length);
    
    if (result.source === 'wordpress') {
      console.log('✅ Fallback to WordPress REST API working correctly');
    } else if (result.source === 'lambda') {
      console.log('✅ Lambda API working correctly');
    }
    
    return {
      success: true,
      source: result.source,
      recommendationsCount: result.recommendations.length,
    };
    
  } catch (error) {
    console.error('❌ Fallback Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export test functions for use in development
export const lambdaAPITests = {
  testLambdaAPI,
  testLambdaAPIPerformance,
  testFallbackBehavior,
}; 