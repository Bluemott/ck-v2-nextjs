#!/usr/bin/env node

/**
 * Test CloudFront Fixes for Cowboy Kimono v2
 * This script tests the various endpoints to ensure they work correctly
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: 'https://cowboykimono.com',
  apiUrl: 'https://api.cowboykimono.com',
  adminUrl: 'https://admin.cowboykimono.com',
  timeout: 10000,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Cowboy-Kimono-Test-Script/1.0',
        ...options.headers,
      },
      timeout: CONFIG.timeout,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test function
async function runTest(name, testFunction) {
  results.total++;
  console.log(`${colors.cyan}🧪 Testing: ${name}${colors.reset}`);

  try {
    const result = await testFunction();
    if (result.success) {
      console.log(`${colors.green}✅ PASS: ${name}${colors.reset}`);
      results.passed++;
    } else {
      console.log(
        `${colors.red}❌ FAIL: ${name} - ${result.error}${colors.reset}`
      );
      results.failed++;
    }
  } catch (error) {
    console.log(
      `${colors.red}❌ ERROR: ${name} - ${error.message}${colors.reset}`
    );
    results.failed++;
  }
}

// Test cases
async function testWebVitalsEndpoint() {
  const response = await makeRequest(
    `${CONFIG.baseUrl}/api/analytics/web-vitals`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        LCP: 1200,
        FID: 50,
        CLS: 0.1,
        FCP: 800,
        TTFB: 200,
      }),
    }
  );

  return {
    success: response.statusCode === 200,
    error:
      response.statusCode !== 200 ? `Status: ${response.statusCode}` : null,
  };
}

async function testWebVitalsOptions() {
  const response = await makeRequest(
    `${CONFIG.baseUrl}/api/analytics/web-vitals`,
    {
      method: 'OPTIONS',
    }
  );

  return {
    success: response.statusCode === 200,
    error:
      response.statusCode !== 200 ? `Status: ${response.statusCode}` : null,
  };
}

async function testWordPressAPI() {
  const response = await makeRequest(
    `${CONFIG.apiUrl}/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc&_embed=1`
  );

  return {
    success: response.statusCode === 200,
    error:
      response.statusCode !== 200 ? `Status: ${response.statusCode}` : null,
  };
}

async function testWordPressAPIWithCORS() {
  const response = await makeRequest(`${CONFIG.apiUrl}/wp-json/wp/v2/posts`, {
    method: 'OPTIONS',
    headers: {
      Origin: CONFIG.baseUrl,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });

  return {
    success: response.statusCode === 200,
    error:
      response.statusCode !== 200 ? `Status: ${response.statusCode}` : null,
  };
}

async function testAdminAccess() {
  const response = await makeRequest(`${CONFIG.adminUrl}/wp-admin`);

  return {
    success: response.statusCode === 200 || response.statusCode === 302, // 302 is redirect to login
    error:
      response.statusCode !== 200 && response.statusCode !== 302
        ? `Status: ${response.statusCode}`
        : null,
  };
}

async function testMainSite() {
  const response = await makeRequest(CONFIG.baseUrl);

  return {
    success: response.statusCode === 200,
    error:
      response.statusCode !== 200 ? `Status: ${response.statusCode}` : null,
  };
}

async function testHealthEndpoint() {
  const response = await makeRequest(`${CONFIG.baseUrl}/api/health`);

  return {
    success: response.statusCode === 200,
    error:
      response.statusCode !== 200 ? `Status: ${response.statusCode}` : null,
  };
}

// Main test runner
async function runAllTests() {
  console.log(
    `${colors.bright}🚀 Starting CloudFront Fixes Test Suite${colors.reset}\n`
  );
  console.log(`${colors.yellow}Configuration:${colors.reset}`);
  console.log(`  Base URL: ${CONFIG.baseUrl}`);
  console.log(`  API URL: ${CONFIG.apiUrl}`);
  console.log(`  Admin URL: ${CONFIG.adminUrl}`);
  console.log(`  Timeout: ${CONFIG.timeout}ms\n`);

  // Run tests
  await runTest('Web Vitals POST Endpoint', testWebVitalsEndpoint);
  await runTest('Web Vitals OPTIONS Endpoint', testWebVitalsOptions);
  await runTest('WordPress REST API', testWordPressAPI);
  await runTest('WordPress API CORS', testWordPressAPIWithCORS);
  await runTest('Admin Access', testAdminAccess);
  await runTest('Main Site', testMainSite);
  await runTest('Health Endpoint', testHealthEndpoint);

  // Print results
  console.log(`\n${colors.bright}📊 Test Results:${colors.reset}`);
  console.log(`  Total: ${results.total}`);
  console.log(`  Passed: ${colors.green}${results.passed}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${results.failed}${colors.reset}`);
  console.log(
    `  Success Rate: ${colors.cyan}${((results.passed / results.total) * 100).toFixed(1)}%${colors.reset}`
  );

  if (results.failed === 0) {
    console.log(
      `\n${colors.green}🎉 All tests passed! CloudFront fixes are working correctly.${colors.reset}`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.red}❌ Some tests failed. Please check the configuration and deployment.${colors.reset}`
    );
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error(
    `${colors.red}Unhandled Rejection at:${colors.reset}`,
    promise,
    `${colors.red}reason:${colors.reset}`,
    reason
  );
  process.exit(1);
});

// Run the tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Test suite failed:${colors.reset}`, error);
  process.exit(1);
});
