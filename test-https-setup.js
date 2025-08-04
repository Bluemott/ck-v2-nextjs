#!/usr/bin/env node

/**
 * HTTPS Setup Verification Script
 * This script tests the HTTPS endpoints after SSL certificate attachment
 */

const https = require('https');
const http = require('http');

const endpoints = [
  'https://api.cowboykimono.com/wp-json/wp/v2/posts',
  'https://admin.cowboykimono.com/wp-admin',
  'http://api.cowboykimono.com/wp-json/wp/v2/posts', // fallback HTTP
];

console.log('🔒 Testing HTTPS Setup for Cowboy Kimono WordPress...\n');

function testEndpoint(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    console.log(`Testing: ${url}`);
    
    const request = client.get(url, (response) => {
      const status = response.statusCode;
      const headers = response.headers;
      
      console.log(`  ✅ Status: ${status}`);
      console.log(`  📋 Content-Type: ${headers['content-type'] || 'Unknown'}`);
      
      if (isHttps) {
        console.log(`  🔒 HTTPS: Working`);
      }
      
      resolve({ url, status, success: true });
    }).on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
      resolve({ url, status: 'Error', success: false, error: error.message });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      console.log(`  ⏰ Timeout: Request took too long`);
      resolve({ url, status: 'Timeout', success: false });
    });
  });
}

async function runTests() {
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 Test Summary:');
  console.log('================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.url} - ${result.status}`);
  });
  
  const httpsWorking = results.filter(r => r.url.startsWith('https://') && r.success).length;
  const totalHttps = results.filter(r => r.url.startsWith('https://')).length;
  
  console.log('\n🎯 Next Steps:');
  if (httpsWorking === totalHttps) {
    console.log('✅ HTTPS is working correctly!');
    console.log('✅ You can update your environment variables to use HTTPS URLs.');
  } else {
    console.log('⚠️  HTTPS setup incomplete. Please:');
    console.log('   1. Attach SSL certificate in Lightsail console');
    console.log('   2. Wait 5-10 minutes for changes to propagate');
    console.log('   3. Run this test again');
  }
}

runTests().catch(console.error);