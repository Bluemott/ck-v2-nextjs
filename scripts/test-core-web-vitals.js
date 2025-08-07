#!/usr/bin/env node

/**
 * Test script for Core Web Vitals implementation
 * This script simulates Core Web Vitals data and sends it to the analytics endpoint
 */

const https = require('https');
const http = require('http');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const ENDPOINT = '/api/analytics/web-vitals';

// Test data for Core Web Vitals
const testMetrics = [
  {
    type: 'LCP',
    value: 2500, // 2.5 seconds
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'FID',
    value: 150, // 150ms
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'CLS',
    value: 0.1, // Good CLS score
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'FCP',
    value: 1200, // 1.2 seconds
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'TTFB',
    value: 800, // 800ms
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'page-load',
    loadTime: 3000, // 3 seconds
    domContentLoaded: 1500, // 1.5 seconds
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
  {
    type: 'user-interaction',
    interactionType: 'click',
    duration: 50, // 50ms
    page: '/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date().toISOString(),
  },
];

// Function to send test data
async function sendTestMetric(metric) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT, SITE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(metric);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Core-Web-Vitals-Test/1.0',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ ${metric.type}: ${res.statusCode} - ${response.message || 'Success'}`);
          resolve(response);
        } catch (error) {
          console.log(`✅ ${metric.type}: ${res.statusCode} - ${data}`);
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${metric.type}: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to test the endpoint
async function testCoreWebVitals() {
  console.log('🧪 Testing Core Web Vitals Implementation');
  console.log(`📍 Endpoint: ${SITE_URL}${ENDPOINT}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const metric of testMetrics) {
    try {
      await sendTestMetric(metric);
      successCount++;
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to send ${metric.type}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('📊 Test Results:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Success Rate: ${((successCount / testMetrics.length) * 100).toFixed(1)}%`);

  if (errorCount === 0) {
    console.log('');
    console.log('🎉 All Core Web Vitals tests passed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Check CloudWatch metrics in AWS console');
    console.log('2. Verify metrics are being tracked in production');
    console.log('3. Monitor Core Web Vitals performance over time');
    console.log('4. Set up CloudWatch alarms for poor performance');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the implementation.');
    process.exit(1);
  }
}

// Function to test endpoint availability
async function testEndpointAvailability() {
  return new Promise((resolve, reject) => {
    const url = new URL(SITE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/api/health',
      method: 'GET',
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Site is accessible');
        resolve(true);
      } else {
        console.log(`⚠️  Site returned status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.error(`❌ Cannot access site: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Core Web Vitals Test');
    console.log('');

    // Test site availability first
    await testEndpointAvailability();
    console.log('');

    // Test Core Web Vitals implementation
    await testCoreWebVitals();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  testCoreWebVitals,
  testEndpointAvailability,
  sendTestMetric,
}; 