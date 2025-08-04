#!/usr/bin/env node

/**
 * Production API Testing Script
 * Tests all API endpoints to ensure they're working correctly for production
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://cowboykimono.com';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.cowboykimono.com';

// Test endpoints
const ENDPOINTS = [
  // Next.js API Routes
  { path: '/api/posts', method: 'GET', name: 'Posts API' },
  { path: '/api/posts?per_page=3', method: 'GET', name: 'Posts API with pagination' },
  { path: '/api/categories', method: 'GET', name: 'Categories API' },
  { path: '/api/tags', method: 'GET', name: 'Tags API' },
  { path: '/api/search?q=test', method: 'GET', name: 'Search API' },
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/docs', method: 'GET', name: 'API Documentation' },
  
  // WordPress REST API
  { path: '/wp-json/wp/v2/posts?per_page=3', method: 'GET', name: 'WordPress Posts API', baseUrl: API_BASE_URL },
  { path: '/wp-json/wp/v2/categories', method: 'GET', name: 'WordPress Categories API', baseUrl: API_BASE_URL },
  { path: '/wp-json/wp/v2/tags', method: 'GET', name: 'WordPress Tags API', baseUrl: API_BASE_URL },
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  responseTime: 3000, // 3 seconds
  statusCode: 200,
  contentLength: 100, // Minimum content length
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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
        'User-Agent': 'Production-API-Test/1.0',
        'Accept': 'application/json',
        ...options.headers,
      },
      timeout: 10000, // 10 second timeout
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
          responseTime: Date.now() - startTime,
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

    const startTime = Date.now();
    req.end();
  });
}

async function testEndpoint(endpoint) {
  const url = `${endpoint.baseUrl || BASE_URL}${endpoint.path}`;
  
  try {
    log(`Testing ${endpoint.name}...`, 'blue');
    log(`URL: ${url}`, 'cyan');
    
    const startTime = Date.now();
    const response = await makeRequest(url, { method: endpoint.method });
    const totalTime = Date.now() - startTime;
    
    // Validate response
    const isValid = validateResponse(response, endpoint);
    
    if (isValid) {
      log(`✅ ${endpoint.name} - PASSED`, 'green');
      log(`   Status: ${response.statusCode}`, 'green');
      log(`   Time: ${totalTime}ms`, 'green');
      log(`   Size: ${response.data.length} bytes`, 'green');
    } else {
      log(`❌ ${endpoint.name} - FAILED`, 'red');
    }
    
    return {
      name: endpoint.name,
      url,
      success: isValid,
      statusCode: response.statusCode,
      responseTime: totalTime,
      contentLength: response.data.length,
      data: response.data,
    };
    
  } catch (error) {
    log(`❌ ${endpoint.name} - ERROR: ${error.message}`, 'red');
    return {
      name: endpoint.name,
      url,
      success: false,
      error: error.message,
    };
  }
}

function validateResponse(response, endpoint) {
  // Check status code
  if (response.statusCode !== PERFORMANCE_THRESHOLDS.statusCode) {
    log(`   ❌ Status code: ${response.statusCode} (expected ${PERFORMANCE_THRESHOLDS.statusCode})`, 'red');
    return false;
  }
  
  // Check response time
  if (response.responseTime > PERFORMANCE_THRESHOLDS.responseTime) {
    log(`   ❌ Response time: ${response.responseTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.responseTime}ms)`, 'red');
    return false;
  }
  
  // Check content length
  if (response.data.length < PERFORMANCE_THRESHOLDS.contentLength) {
    log(`   ❌ Content length: ${response.data.length} bytes (minimum: ${PERFORMANCE_THRESHOLDS.contentLength} bytes)`, 'red');
    return false;
  }
  
  // Check for JSON response
  try {
    const jsonData = JSON.parse(response.data);
    if (!jsonData) {
      log(`   ❌ Invalid JSON response`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ Response is not valid JSON: ${error.message}`, 'red');
    return false;
  }
  
  return true;
}

async function runTests() {
  log('🚀 Starting Production API Tests', 'bright');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log(`API Base URL: ${API_BASE_URL}`, 'cyan');
  log('', 'reset');
  
  const results = [];
  const startTime = Date.now();
  
  // Run tests sequentially to avoid overwhelming the server
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const totalTime = Date.now() - startTime;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = results.filter(r => !r.success).length;
  
  // Summary
  log('', 'reset');
  log('📊 Test Summary', 'bright');
  log(`Total Tests: ${results.length}`, 'cyan');
  log(`Passed: ${successfulTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Total Time: ${totalTime}ms`, 'cyan');
  
  // Failed tests details
  if (failedTests > 0) {
    log('', 'reset');
    log('❌ Failed Tests:', 'red');
    results.filter(r => !r.success).forEach(result => {
      log(`   ${result.name}: ${result.error || `Status ${result.statusCode}`}`, 'red');
    });
  }
  
  // Performance summary
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length;
  
  log('', 'reset');
  log('⚡ Performance Summary', 'bright');
  log(`Average Response Time: ${Math.round(avgResponseTime)}ms`, 'cyan');
  
  const slowEndpoints = results.filter(r => r.responseTime > PERFORMANCE_THRESHOLDS.responseTime);
  if (slowEndpoints.length > 0) {
    log('🐌 Slow Endpoints:', 'yellow');
    slowEndpoints.forEach(endpoint => {
      log(`   ${endpoint.name}: ${endpoint.responseTime}ms`, 'yellow');
    });
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Production API Testing Script', 'bright');
  log('', 'reset');
  log('Usage: node test-production-apis.js [options]', 'cyan');
  log('', 'reset');
  log('Options:', 'bright');
  log('  --base-url <url>     Base URL for testing (default: https://cowboykimono.com)', 'cyan');
  log('  --api-base-url <url> API Base URL for testing (default: https://api.cowboykimono.com)', 'cyan');
  log('  --help, -h           Show this help message', 'cyan');
  log('', 'reset');
  log('Environment Variables:', 'bright');
  log('  BASE_URL             Base URL for testing', 'cyan');
  log('  API_BASE_URL         API Base URL for testing', 'cyan');
  process.exit(0);
}

// Parse command line arguments
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  const nextArg = process.argv[i + 1];
  
  if (arg === '--base-url' && nextArg) {
    process.env.BASE_URL = nextArg;
    i++;
  } else if (arg === '--api-base-url' && nextArg) {
    process.env.API_BASE_URL = nextArg;
    i++;
  }
}

// Run the tests
runTests().catch(error => {
  log(`❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
}); 