#!/usr/bin/env node

/**
 * Test script for URL conversion functionality
 */

// Mock environment variables for testing
process.env.NEXT_PUBLIC_CLOUDFRONT_URL = 'https://d36tlab2rh5hc6.cloudfront.net';

// Import the conversion function
const { convertToS3Url, debugUrlConversion } = require('../app/lib/wpgraphql.ts');

// Test URLs
const testUrls = [
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2021/12/another-image.png',
  'https://api.cowboykimono.com/wp-content/uploads/2023/01/test-image.webp',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-thumbnail.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-medium.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-large.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-scaled.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-scaled-1.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-scaled-1-1.jpg',
  'https://api.cowboykimono.com/wp-content/uploads/2022/08/image-scaled-1-1-1.jpg',
];

console.log('🔧 Testing URL Conversion Functionality\n');

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`Original: ${url}`);
  console.log(`Converted: ${convertToS3Url(url)}`);
  
  const debug = debugUrlConversion(url);
  console.log(`Debug Info:`);
  console.log(`  CloudFront URL: ${debug.cloudFrontUrl}`);
  console.log(`  Path Parts: ${debug.pathParts.join(' > ')}`);
  console.log(`  S3 Path: ${debug.s3Path}`);
  console.log('---\n');
});

console.log('✅ URL conversion test completed!'); 