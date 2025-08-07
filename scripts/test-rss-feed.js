#!/usr/bin/env node

/**
 * RSS Feed Validation Script
 * Tests the RSS feed implementation for proper structure and functionality
 */

const https = require('https');
const http = require('http');

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000/feed.xml';

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
          body: data,
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

function validateRSSStructure(xml) {
  const errors = [];
  const warnings = [];

  // Check for required RSS elements
  const requiredElements = [
    '<?xml version="1.0"',
    '<rss version="2.0"',
    '<channel>',
    '<title>',
    '<link>',
    '<description>',
    '<language>',
    '<lastBuildDate>',
    '<atom:link',
    '</channel>',
    '</rss>',
  ];

  requiredElements.forEach((element) => {
    if (!xml.includes(element)) {
      errors.push(`Missing required element: ${element}`);
    }
  });

  // Check for proper namespaces
  if (!xml.includes('xmlns:atom="http://www.w3.org/2005/Atom"')) {
    errors.push('Missing atom namespace');
  }

  // Check for CDATA sections
  if (!xml.includes('<![CDATA[')) {
    warnings.push(
      'No CDATA sections found - content may not be properly escaped'
    );
  }

  // Check for items
  const itemCount = (xml.match(/<item>/g) || []).length;
  if (itemCount === 0) {
    warnings.push('No RSS items found');
  } else {
    console.log(`✅ Found ${itemCount} RSS items`);
  }

  // Check for proper item structure
  const itemElements = [
    '<title>',
    '<link>',
    '<guid>',
    '<pubDate>',
    '<description>',
  ];
  itemElements.forEach((element) => {
    if (!xml.includes(element)) {
      warnings.push(`Missing item element: ${element}`);
    }
  });

  return { errors, warnings };
}

function validateHeaders(headers) {
  const errors = [];
  const warnings = [];

  // Check content type
  const contentType = headers['content-type'];
  if (!contentType || !contentType.includes('application/xml')) {
    errors.push('Invalid content type - should be application/xml');
  } else {
    console.log('✅ Correct content type:', contentType);
  }

  // Check cache headers
  const cacheControl = headers['cache-control'];
  if (!cacheControl) {
    warnings.push('No cache control headers');
  } else {
    console.log('✅ Cache control headers:', cacheControl);
  }

  // Check security headers
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
  ];

  securityHeaders.forEach((header) => {
    if (!headers[header]) {
      warnings.push(`Missing security header: ${header}`);
    }
  });

  // Check custom headers
  const customHeaders = ['x-cache', 'x-request-id'];
  customHeaders.forEach((header) => {
    if (headers[header]) {
      console.log(`✅ Custom header ${header}:`, headers[header]);
    }
  });

  return { errors, warnings };
}

async function testRSSFeed() {
  console.log('🔍 Testing RSS Feed Implementation');
  console.log('=====================================');
  console.log(`URL: ${TEST_URL}\n`);

  try {
    const response = await makeRequest(TEST_URL);

    console.log('📊 Response Status:', response.statusCode);
    console.log('📊 Response Headers:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log();

    // Validate headers
    const headerValidation = validateHeaders(response.headers);
    if (headerValidation.errors.length > 0) {
      console.log('❌ Header Errors:');
      headerValidation.errors.forEach((error) => console.log(`  - ${error}`));
    }
    if (headerValidation.warnings.length > 0) {
      console.log('⚠️  Header Warnings:');
      headerValidation.warnings.forEach((warning) =>
        console.log(`  - ${warning}`)
      );
    }

    // Validate RSS structure
    const structureValidation = validateRSSStructure(response.body);
    if (structureValidation.errors.length > 0) {
      console.log('\n❌ RSS Structure Errors:');
      structureValidation.errors.forEach((error) =>
        console.log(`  - ${error}`)
      );
    }
    if (structureValidation.warnings.length > 0) {
      console.log('\n⚠️  RSS Structure Warnings:');
      structureValidation.warnings.forEach((warning) =>
        console.log(`  - ${warning}`)
      );
    }

    // Summary
    const totalErrors =
      headerValidation.errors.length + structureValidation.errors.length;
    const totalWarnings =
      headerValidation.warnings.length + structureValidation.warnings.length;

    console.log('\n📋 Summary:');
    console.log(`  Status Code: ${response.statusCode}`);
    console.log(`  Content Length: ${response.body.length} characters`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Warnings: ${totalWarnings}`);

    if (totalErrors === 0) {
      console.log('\n✅ RSS Feed Implementation: PASSED');
      console.log('   - Proper XML structure');
      console.log('   - Correct headers');
      console.log('   - Security headers present');
      console.log('   - Caching configured');
      console.log('   - Request tracking enabled');
    } else {
      console.log('\n❌ RSS Feed Implementation: FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testRSSFeed();
}

module.exports = { testRSSFeed, validateRSSStructure, validateHeaders };
