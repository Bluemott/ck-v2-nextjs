#!/usr/bin/env node

/**
 * Cache Management Script
 *
 * This script provides utilities to clear various caches in the application.
 * Useful for development and troubleshooting cache-related issues.
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  cache: '/api/cache',
  health: '/api/health',
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

function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function clearAllCache() {
  log('🗑️  Clearing all cache...', 'yellow');
  try {
    const response = await makeRequest(API_ENDPOINTS.cache, 'POST', {
      action: 'clear-all',
    });
    if (response.status === 200 && response.data.success) {
      log('✅ All cache cleared successfully!', 'green');
    } else {
      log(
        `❌ Failed to clear cache: ${response.data.error || 'Unknown error'}`,
        'red'
      );
    }
  } catch (error) {
    log(`❌ Error clearing cache: ${error.message}`, 'red');
  }
}

async function clearPostsCache() {
  log('📝 Clearing posts cache...', 'yellow');
  try {
    const response = await makeRequest(API_ENDPOINTS.cache, 'POST', {
      action: 'clear-posts',
    });
    if (response.status === 200 && response.data.success) {
      log('✅ Posts cache cleared successfully!', 'green');
    } else {
      log(
        `❌ Failed to clear posts cache: ${response.data.error || 'Unknown error'}`,
        'red'
      );
    }
  } catch (error) {
    log(`❌ Error clearing posts cache: ${error.message}`, 'red');
  }
}

async function clearDownloadsCache() {
  log('📥 Clearing downloads cache...', 'yellow');
  try {
    const response = await makeRequest(API_ENDPOINTS.cache, 'POST', {
      action: 'clear-downloads',
    });
    if (response.status === 200 && response.data.success) {
      log('✅ Downloads cache cleared successfully!', 'green');
    } else {
      log(
        `❌ Failed to clear downloads cache: ${response.data.error || 'Unknown error'}`,
        'red'
      );
    }
  } catch (error) {
    log(`❌ Error clearing downloads cache: ${error.message}`, 'red');
  }
}

async function showCacheStats() {
  log('📊 Fetching cache statistics...', 'cyan');
  try {
    const response = await makeRequest(API_ENDPOINTS.cache, 'GET');
    if (response.status === 200 && response.data.success) {
      const stats = response.data.stats;
      log('\n📈 Cache Statistics:', 'bright');
      log(`   Hit Count: ${stats.hitCount}`, 'green');
      log(`   Miss Count: ${stats.missCount}`, 'yellow');
      log(`   Hit Rate: ${stats.hitRate}`, 'cyan');
      log(`   Cache Size: ${stats.cacheSize}/${stats.maxSize}`, 'blue');
      log(`   Usage: ${stats.usagePercentage}`, 'magenta');
      log(`   Memory Usage: ${stats.memoryUsage}`, 'blue');
      log(`   Evictions: ${stats.evictionCount}`, 'yellow');
    } else {
      log(
        `❌ Failed to fetch cache stats: ${response.data.error || 'Unknown error'}`,
        'red'
      );
    }
  } catch (error) {
    log(`❌ Error fetching cache stats: ${error.message}`, 'red');
  }
}

async function checkHealth() {
  log('🏥 Checking application health...', 'cyan');
  try {
    const response = await makeRequest(API_ENDPOINTS.health, 'GET');
    if (response.status === 200) {
      log('✅ Application is healthy!', 'green');
      if (response.data && response.data.health) {
        log(`   Score: ${response.data.health.score}/100`, 'cyan');
      }
    } else {
      log(
        `⚠️  Application health check returned status: ${response.status}`,
        'yellow'
      );
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
  }
}

function showHelp() {
  log('\n🔧 Cache Management Script', 'bright');
  log('Usage: node scripts/clear-cache.js [command]\n', 'reset');
  log('Commands:', 'cyan');
  log('  all       Clear all cache', 'green');
  log('  posts     Clear posts cache only', 'green');
  log('  downloads Clear downloads cache only', 'green');
  log('  stats     Show cache statistics', 'green');
  log('  health    Check application health', 'green');
  log('  help      Show this help message', 'green');
  log('\nExamples:', 'cyan');
  log('  node scripts/clear-cache.js all', 'yellow');
  log('  node scripts/clear-cache.js posts', 'yellow');
  log('  node scripts/clear-cache.js stats', 'yellow');
}

async function main() {
  const command = process.argv[2] || 'help';

  log(`🚀 Cache Management Script - ${API_BASE_URL}`, 'bright');
  log('=====================================\n', 'reset');

  switch (command.toLowerCase()) {
    case 'all':
      await clearAllCache();
      break;
    case 'posts':
      await clearPostsCache();
      break;
    case 'downloads':
      await clearDownloadsCache();
      break;
    case 'stats':
      await showCacheStats();
      break;
    case 'health':
      await checkHealth();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }

  log('\n✨ Done!', 'green');
}

// Run the script
main().catch((error) => {
  log(`💥 Script failed: ${error.message}`, 'red');
  process.exit(1);
});
