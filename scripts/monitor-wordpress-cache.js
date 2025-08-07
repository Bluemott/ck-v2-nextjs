#!/usr/bin/env node

/**
 * WordPress Cache Performance Monitor
 * Monitors Redis, WordPress cache, and REST API performance
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📊 WordPress Cache Performance Monitor');
console.log('=====================================\n');

// Function to execute command and return result
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to get timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// 1. Redis Status
console.log('🔴 Redis Status:');
console.log('----------------');
const redisInfo = execCommand('redis-cli info');
const redisMemory = execCommand('redis-cli info memory');
const redisStats = execCommand('redis-cli info stats');

// Parse Redis memory info
const memoryLines = redisMemory.split('\n');
const usedMemory = memoryLines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim() || 'Unknown';
const peakMemory = memoryLines.find(line => line.startsWith('used_memory_peak_human:'))?.split(':')[1]?.trim() || 'Unknown';

console.log(`Memory Used: ${usedMemory}`);
console.log(`Peak Memory: ${peakMemory}`);
console.log(`Status: ${redisInfo.includes('redis_version') ? '✅ Running' : '❌ Not running'}\n`);

// 2. WordPress Redis Cache Status
console.log('🔌 WordPress Redis Cache:');
console.log('-------------------------');
const wpRedisStatus = execCommand('cd /var/www/html && wp redis status');
console.log(wpRedisStatus || '❌ WP-CLI not available or Redis not configured\n');

// 3. WordPress Cache Stats
console.log('📈 WordPress Cache Statistics:');
console.log('-----------------------------');
const wpCacheStats = execCommand('cd /var/www/html && wp cache stats');
console.log(wpCacheStats || '❌ Cache stats not available\n');

// 4. REST API Performance Test
console.log('🚀 REST API Performance Test:');
console.log('-----------------------------');
const startTime = Date.now();
const apiResponse = execCommand('curl -s -o /dev/null -w "%{http_code} %{time_total}" https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1');
const endTime = Date.now();
const responseTime = endTime - startTime;

if (apiResponse.includes('200')) {
  console.log(`✅ API Response: ${apiResponse}`);
  console.log(`⏱️  Total Time: ${responseTime}ms`);
} else {
  console.log(`❌ API Error: ${apiResponse}`);
}

// 5. Apache Status
console.log('\n🌐 Apache Status:');
console.log('----------------');
const apacheStatus = execCommand('sudo systemctl status apache2 --no-pager');
const isApacheRunning = apacheStatus.includes('active (running)');
console.log(`Status: ${isApacheRunning ? '✅ Running' : '❌ Not running'}`);

// 6. System Resources
console.log('\n💻 System Resources:');
console.log('-------------------');
const memoryInfo = execCommand('free -h');
const diskInfo = execCommand('df -h /');
const loadAvg = execCommand('uptime');

console.log('Memory:');
console.log(memoryInfo);
console.log('\nDisk Usage:');
console.log(diskInfo);
console.log('\nLoad Average:');
console.log(loadAvg);

// 7. Cache Hit Rate Calculation
console.log('\n📊 Cache Performance Metrics:');
console.log('-----------------------------');

// Get Redis hit/miss stats
const hitStats = redisStats.split('\n').filter(line => 
  line.includes('keyspace_hits') || line.includes('keyspace_misses')
);

let hits = 0;
let misses = 0;

hitStats.forEach(line => {
  const [key, value] = line.split(':');
  if (key === 'keyspace_hits') hits = parseInt(value) || 0;
  if (key === 'keyspace_misses') misses = parseInt(value) || 0;
});

const totalRequests = hits + misses;
const hitRate = totalRequests > 0 ? ((hits / totalRequests) * 100).toFixed(2) : 0;

console.log(`Cache Hits: ${hits.toLocaleString()}`);
console.log(`Cache Misses: ${misses.toLocaleString()}`);
console.log(`Total Requests: ${totalRequests.toLocaleString()}`);
console.log(`Hit Rate: ${hitRate}%`);

// 8. Recommendations
console.log('\n💡 Performance Recommendations:');
console.log('-------------------------------');

if (parseFloat(hitRate) < 80) {
  console.log('⚠️  Cache hit rate is low. Consider:');
  console.log('   - Increasing cache TTL');
  console.log('   - Adding more cache keys');
  console.log('   - Reviewing cache invalidation strategy');
}

if (responseTime > 1000) {
  console.log('⚠️  API response time is slow. Consider:');
  console.log('   - Enabling page caching');
  console.log('   - Optimizing database queries');
  console.log('   - Using CloudFront CDN');
}

if (parseFloat(usedMemory.replace(/[^\d.]/g, '')) > 200) {
  console.log('⚠️  Redis memory usage is high. Consider:');
  console.log('   - Increasing maxmemory');
  console.log('   - Optimizing cache keys');
  console.log('   - Implementing cache eviction');
}

// 9. Generate Report
const report = {
  timestamp: getTimestamp(),
  redis: {
    status: redisInfo.includes('redis_version') ? 'running' : 'stopped',
    memoryUsed: usedMemory,
    memoryPeak: peakMemory,
    hitRate: `${hitRate}%`
  },
  wordpress: {
    redisStatus: wpRedisStatus.includes('Connected') ? 'connected' : 'disconnected',
    apiResponseTime: `${responseTime}ms`
  },
  system: {
    apacheStatus: isApacheRunning ? 'running' : 'stopped',
    loadAverage: loadAvg.split('load average:')[1]?.trim() || 'unknown'
  }
};

// Save report to file
const reportPath = '/tmp/wordpress-cache-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

console.log('\n✅ Monitoring complete!');
console.log('\n📋 To run this automatically:');
console.log('1. Add to crontab: */5 * * * * /usr/bin/node /path/to/scripts/monitor-wordpress-cache.js');
console.log('2. Set up CloudWatch alarms for cache performance');
console.log('3. Monitor logs: tail -f /var/log/apache2/access.log'); 