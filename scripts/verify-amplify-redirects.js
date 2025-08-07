#!/usr/bin/env node

/**
 * Verification script for AWS Amplify Redirects
 * Tests redirects after Amplify configuration changes
 */

const https = require('https');
const http = require('http');

// Configuration
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com';

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
      timeout: 10000,
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
  log('\n🔄 Testing AWS Amplify Redirects', 'bold');
  log('='.repeat(60), 'blue');

  const testCases = [
    {
      name: 'WWW to Non-WWW Redirect (Homepage)',
      url: 'https://www.cowboykimono.com',
      expectedStatus: 301,
      expectedLocation: 'https://cowboykimono.com',
    },
    {
      name: 'WWW to Non-WWW Redirect (Blog)',
      url: 'https://www.cowboykimono.com/blog',
      expectedStatus: 301,
      expectedLocation: 'https://cowboykimono.com/blog',
    },
    {
      name: 'WWW to Non-WWW Redirect (Shop)',
      url: 'https://www.cowboykimono.com/shop',
      expectedStatus: 301,
      expectedLocation: 'https://cowboykimono.com/shop',
    },
    {
      name: 'WWW to Non-WWW Redirect (Downloads)',
      url: 'https://www.cowboykimono.com/downloads',
      expectedStatus: 301,
      expectedLocation: 'https://cowboykimono.com/downloads',
    },
    {
      name: 'Non-WWW Direct Access (Homepage)',
      url: 'https://cowboykimono.com',
      expectedStatus: 200,
    },
    {
      name: 'Non-WWW Direct Access (Blog)',
      url: 'https://cowboykimono.com/blog',
      expectedStatus: 200,
    },
    {
      name: 'Non-WWW Direct Access (Shop)',
      url: 'https://cowboykimono.com/shop',
      expectedStatus: 200,
    },
    {
      name: 'Non-WWW Direct Access (Downloads)',
      url: 'https://cowboykimono.com/downloads',
      expectedStatus: 200,
    },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      log(`\n🔍 Testing ${testCase.name}...`, 'blue');
      log(`URL: ${testCase.url}`, 'blue');

      const response = await makeRequest(testCase.url);

      const statusMatch = response.statusCode === testCase.expectedStatus;
      log(`Status: ${response.statusCode}`, statusMatch ? 'green' : 'red');

      if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        log(`Location: ${location}`, 'green');

        if (
          testCase.expectedLocation &&
          location === testCase.expectedLocation
        ) {
          log('✅ Redirect working correctly', 'green');
          passedTests++;
        } else if (testCase.expectedLocation) {
          log(
            `⚠️  Expected ${testCase.expectedLocation}, got ${location}`,
            'yellow'
          );
        }
      } else if (response.statusCode === 200) {
        log('✅ Direct access working', 'green');
        passedTests++;
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

  log(
    `\n📊 Test Results: ${passedTests}/${totalTests} tests passed`,
    passedTests === totalTests ? 'green' : 'yellow'
  );

  if (passedTests === totalTests) {
    log('🎉 All redirects are working correctly!', 'green');
  } else {
    log('⚠️  Some redirects need attention', 'yellow');
  }
}

async function testSitemapAccess() {
  log('\n📋 Testing Sitemap Access After Redirects', 'bold');
  log('='.repeat(60), 'blue');

  const sitemapUrls = [
    'https://cowboykimono.com/sitemap.xml',
    'https://www.cowboykimono.com/sitemap.xml',
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

          // Check for www URLs (should be none after fix)
          const wwwUrls = content.match(/www\.cowboykimono\.com/g);
          if (wwwUrls) {
            log(`⚠️  Found ${wwwUrls.length} www URLs in sitemap`, 'yellow');
          } else {
            log('✅ No www URLs found in sitemap', 'green');
          }
        } else {
          log('⚠️  Invalid sitemap structure', 'yellow');
        }
      } else if (response.statusCode >= 300 && response.statusCode < 400) {
        const location = response.headers.location;
        log(`🔄 Redirecting to: ${location}`, 'yellow');

        // Test the redirect target
        try {
          const redirectResponse = await makeRequest(location);
          if (redirectResponse.statusCode === 200) {
            log('✅ Redirect target accessible', 'green');
          } else {
            log(
              `⚠️  Redirect target returned ${redirectResponse.statusCode}`,
              'yellow'
            );
          }
        } catch (error) {
          log(`❌ Error testing redirect target: ${error.message}`, 'red');
        }
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

async function testCanonicalHeaders() {
  log('\n🔗 Testing Canonical Headers After Redirects', 'bold');
  log('='.repeat(60), 'blue');

  const testPaths = ['/', '/blog', '/shop', '/downloads'];

  for (const path of testPaths) {
    try {
      log(`\n🔍 Testing canonical headers for ${path}...`, 'blue');

      // Test both www and non-www versions
      const urls = [
        `https://www.cowboykimono.com${path}`,
        `https://cowboykimono.com${path}`,
      ];

      for (const url of urls) {
        log(`  Testing: ${url}`, 'blue');

        const response = await makeRequest(url, {
          followRedirect: true,
          maxRedirects: 5,
        });

        if (response.statusCode === 200) {
          const canonicalHeader = response.headers.link;
          if (canonicalHeader && canonicalHeader.includes('rel="canonical"')) {
            log(`    ✅ Canonical header found: ${canonicalHeader}`, 'green');

            // Check if canonical URL is non-www (should be after fix)
            if (canonicalHeader.includes('www.cowboykimono.com')) {
              log(`    ⚠️  Canonical URL still contains www`, 'yellow');
            } else {
              log(`    ✅ Canonical URL is non-www`, 'green');
            }
          } else {
            log(`    ⚠️  No canonical header found`, 'yellow');
          }
        } else {
          log(`    ❌ Page returned status ${response.statusCode}`, 'red');
        }
      }
    } catch (error) {
      log(`❌ Error testing ${path}: ${error.message}`, 'red');
    }
  }
}

async function runVerification() {
  log('\n🚀 Starting AWS Amplify Redirect Verification', 'bold');
  log('='.repeat(60), 'blue');

  try {
    await testRedirects();
    await testSitemapAccess();
    await testCanonicalHeaders();

    log('\n🎉 Verification completed!', 'bold');
    log('\n📋 Summary:', 'blue');
    log('- WWW URLs should redirect to non-WWW with 301 status', 'green');
    log(
      '- Non-WWW URLs should be directly accessible with 200 status',
      'green'
    );
    log('- Sitemap should be accessible at non-WWW domain', 'green');
    log('- Canonical headers should point to non-WWW URLs', 'green');

    log('\n📝 Next Steps:', 'yellow');
    log('1. If all tests pass, the redirects are working correctly', 'yellow');
    log('2. Update the sitemap to use non-WWW URLs', 'yellow');
    log('3. Update environment variables to use non-WWW', 'yellow');
    log('4. Deploy the final changes', 'yellow');
  } catch (error) {
    log(`\n❌ Verification failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification();
}

module.exports = {
  testRedirects,
  testSitemapAccess,
  testCanonicalHeaders,
  runVerification,
};
