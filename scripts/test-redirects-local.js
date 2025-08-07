#!/usr/bin/env node

/**
 * Test script for Redirect Configuration
 * Tests redirects locally to understand the current setup
 */

const https = require('https');
const http = require('http');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com';
const LOCAL_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;

    const requestOptions = {
      method: 'GET',
      timeout: 5000,
      followRedirect: false, // Don't follow redirects to see the redirect response
      ...options,
    };

    const req = client.request(url, requestOptions, (res) => {
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

    req.end();
  });
}

async function testRedirects() {
  log('\n🔄 Testing Redirect Configuration', 'bold');
  log('='.repeat(60), 'blue');

  const testCases = [
    {
      name: 'Production www to non-www',
      url: 'https://www.cowboykimono.com',
      expectedStatus: 301,
      expectedLocation: 'https://cowboykimono.com',
    },
    {
      name: 'Production www blog redirect',
      url: 'https://www.cowboykimono.com/blog',
      expectedStatus: 301,
      expectedLocation: 'https://cowboykimono.com/blog',
    },
    {
      name: 'Local development (no www)',
      url: 'http://localhost:3000',
      expectedStatus: 200,
    },
    {
      name: 'Local development blog',
      url: 'http://localhost:3000/blog',
      expectedStatus: 200,
    },
  ];

  for (const testCase of testCases) {
    try {
      log(`\n🔍 Testing ${testCase.name}...`, 'blue');
      log(`URL: ${testCase.url}`, 'blue');

      const response = await makeRequest(testCase.url);

      log(
        `Status: ${response.statusCode}`,
        response.statusCode === testCase.expectedStatus ? 'green' : 'red'
      );

      if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        log(`Location: ${location}`, 'green');

        if (
          testCase.expectedLocation &&
          location === testCase.expectedLocation
        ) {
          log('✅ Redirect working correctly', 'green');
        } else if (testCase.expectedLocation) {
          log(
            `⚠️  Expected ${testCase.expectedLocation}, got ${location}`,
            'yellow'
          );
        }
      } else if (response.statusCode === 200) {
        log('✅ Page accessible', 'green');
      } else {
        log(`❌ Unexpected status: ${response.statusCode}`, 'red');
      }

      // Show response headers for debugging
      log('Response headers:', 'blue');
      Object.entries(response.headers).forEach(([key, value]) => {
        if (
          key.toLowerCase().includes('location') ||
          key.toLowerCase().includes('cache') ||
          key.toLowerCase().includes('content')
        ) {
          log(`  ${key}: ${value}`, 'yellow');
        }
      });
    } catch (error) {
      log(`❌ Error testing ${testCase.name}: ${error.message}`, 'red');
    }
  }
}

async function testSitemapAccess() {
  log('\n📋 Testing Sitemap Access', 'bold');
  log('='.repeat(60), 'blue');

  const sitemapUrls = [
    'https://cowboykimono.com/sitemap.xml',
    'https://www.cowboykimono.com/sitemap.xml',
    'http://localhost:3000/sitemap.xml',
  ];

  for (const url of sitemapUrls) {
    try {
      log(`\n🔍 Testing sitemap at: ${url}`, 'blue');

      const response = await makeRequest(url);

      if (response.statusCode === 200) {
        log('✅ Sitemap accessible', 'green');

        // Check content type
        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('xml')) {
          log('✅ Correct content type', 'green');
        } else {
          log(`⚠️  Unexpected content type: ${contentType}`, 'yellow');
        }

        // Show sample content
        const content = response.data;
        if (content.includes('<urlset')) {
          log('✅ Valid sitemap structure', 'green');

          // Count URLs
          const urlMatches = content.match(/<url>/g);
          const urlCount = urlMatches ? urlMatches.length : 0;
          log(`📊 Contains ${urlCount} URLs`, 'green');
        } else {
          log('⚠️  Invalid sitemap structure', 'yellow');
        }
      } else if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        log(`🔄 Redirecting to: ${location}`, 'yellow');
      } else {
        log(
          `❌ Sitemap not accessible (status: ${response.statusCode})`,
          'red'
        );
      }
    } catch (error) {
      log(`❌ Error testing sitemap: ${error.message}`, 'red');
    }
  }
}

async function runTests() {
  log('\n🚀 Starting Redirect Tests', 'bold');
  log('='.repeat(60), 'blue');

  try {
    await testRedirects();
    await testSitemapAccess();

    log('\n🎉 Tests completed!', 'bold');
    log('\n📝 Analysis:', 'blue');
    log('- 301/302 status codes indicate redirects are working', 'green');
    log('- 200 status codes indicate direct access (no redirect)', 'yellow');
    log('- WWW to non-WWW redirects should return 301 status', 'blue');
    log('- Local development may not have redirects configured', 'yellow');
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testRedirects,
  testSitemapAccess,
  runTests,
};
