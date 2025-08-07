#!/usr/bin/env node

/**
 * Enhanced CloudFront Configuration Test Script
 * Tests security headers, error pages, and logging functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const TEST_URLS = [
  'https://cowboykimono.com',
  'https://cowboykimono.com/blog',
  'https://cowboykimono.com/api/posts',
  'https://cowboykimono.com/wp-content/uploads/test.jpg',
];

const EXPECTED_SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-embedder-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
];

const EXPECTED_API_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
];

console.log('🔍 Testing Enhanced CloudFront Configuration...\n');

/**
 * Make HTTP request and return response
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test security headers
 */
function testSecurityHeaders(headers, url) {
  console.log(`\n🔒 Testing Security Headers for: ${url}`);

  const missingHeaders = [];
  const presentHeaders = [];

  EXPECTED_SECURITY_HEADERS.forEach((header) => {
    if (headers[header]) {
      presentHeaders.push(header);
      console.log(`  ✅ ${header}: ${headers[header]}`);
    } else {
      missingHeaders.push(header);
      console.log(`  ❌ ${header}: Missing`);
    }
  });

  if (url.includes('/api/')) {
    console.log('\n🔗 Testing API-specific headers:');
    EXPECTED_API_HEADERS.forEach((header) => {
      if (headers[header]) {
        presentHeaders.push(header);
        console.log(`  ✅ ${header}: ${headers[header]}`);
      } else {
        missingHeaders.push(header);
        console.log(`  ❌ ${header}: Missing`);
      }
    });
  }

  return {
    present: presentHeaders,
    missing: missingHeaders,
    score:
      (presentHeaders.length /
        (EXPECTED_SECURITY_HEADERS.length +
          (url.includes('/api/') ? EXPECTED_API_HEADERS.length : 0))) *
      100,
  };
}

/**
 * Test error pages
 */
async function testErrorPages() {
  console.log('\n🚨 Testing Error Pages...');

  try {
    // Test 404 page
    const notFoundResponse = await makeRequest(
      'https://cowboykimono.com/nonexistent-page'
    );
    console.log(`  📄 404 Response Status: ${notFoundResponse.statusCode}`);

    if (notFoundResponse.statusCode === 200) {
      console.log('  ✅ 404 page is working (custom error page served)');
    } else {
      console.log('  ⚠️ 404 page may not be configured properly');
    }
  } catch (error) {
    console.log(`  ❌ Error testing 404 page: ${error.message}`);
  }
}

/**
 * Test cache headers
 */
function testCacheHeaders(headers, url) {
  console.log(`\n💾 Testing Cache Headers for: ${url}`);

  const cacheHeaders = ['cache-control', 'etag', 'last-modified'];
  cacheHeaders.forEach((header) => {
    if (headers[header]) {
      console.log(`  ✅ ${header}: ${headers[header]}`);
    } else {
      console.log(`  ⚠️ ${header}: Not present`);
    }
  });
}

/**
 * Main test function
 */
async function runTests() {
  const results = [];

  for (const url of TEST_URLS) {
    try {
      console.log(`\n🌐 Testing: ${url}`);
      const response = await makeRequest(url);

      console.log(`  📊 Status Code: ${response.statusCode}`);
      console.log(`  📏 Content Length: ${response.data.length} bytes`);

      // Test security headers
      const securityResult = testSecurityHeaders(response.headers, url);
      results.push({
        url,
        statusCode: response.statusCode,
        securityScore: securityResult.score,
        securityHeaders: securityResult.present.length,
        missingHeaders: securityResult.missing.length,
      });

      // Test cache headers
      testCacheHeaders(response.headers, url);
    } catch (error) {
      console.log(`  ❌ Error testing ${url}: ${error.message}`);
      results.push({
        url,
        error: error.message,
        securityScore: 0,
      });
    }
  }

  // Test error pages
  await testErrorPages();

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');

  const successfulTests = results.filter((r) => !r.error);
  const averageSecurityScore =
    successfulTests.length > 0
      ? successfulTests.reduce((sum, r) => sum + r.securityScore, 0) /
        successfulTests.length
      : 0;

  console.log(
    `✅ Successful Tests: ${successfulTests.length}/${TEST_URLS.length}`
  );
  console.log(`🔒 Average Security Score: ${averageSecurityScore.toFixed(1)}%`);
  console.log(
    `📈 Average Security Headers: ${successfulTests.length > 0 ? (successfulTests.reduce((sum, r) => sum + r.securityHeaders, 0) / successfulTests.length).toFixed(1) : 0}`
  );

  if (averageSecurityScore >= 90) {
    console.log(
      '\n🎉 Enhanced CloudFront configuration is working excellently!'
    );
  } else if (averageSecurityScore >= 70) {
    console.log(
      '\n⚠️ Enhanced CloudFront configuration needs some improvements.'
    );
  } else {
    console.log(
      '\n❌ Enhanced CloudFront configuration has significant issues.'
    );
  }

  console.log('\n🔍 Next Steps:');
  console.log('1. Check CloudWatch logs for any errors');
  console.log('2. Verify CloudFront distribution settings in AWS Console');
  console.log('3. Test error pages manually in browser');
  console.log('4. Monitor performance metrics');
}

// Run tests
runTests().catch(console.error);
