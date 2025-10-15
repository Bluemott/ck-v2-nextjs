#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Helps configure the development environment for Cowboy Kimono v2
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Cowboy Kimono v2 development environment...\n');

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.log('📝 Creating .env.local from template...');
  const envExamplePath = path.join(process.cwd(), '.env.local.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('✅ Created .env.local from template');
  } else {
    console.log(
      '⚠️  .env.local.example not found, creating basic .env.local...'
    );
    const basicEnv = `# Development Environment Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WordPress API Configuration
WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com

# Cache Configuration (Memory cache for development)
CACHE_TTL=300000
CACHE_MAX_SIZE=2000
`;
    fs.writeFileSync(envLocalPath, basicEnv);
    console.log('✅ Created basic .env.local');
  }
} else {
  console.log('✅ .env.local already exists');
}

// Check Redis availability
console.log('\n🔍 Checking Redis availability...');
const redis = require('redis');

async function checkRedis() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000,
      },
    });

    await client.connect();
    await client.ping();
    await client.disconnect();
    console.log('✅ Redis is available and working');
    return true;
  } catch (error) {
    console.log('⚠️  Redis not available:', error.message);
    console.log(
      '   This is normal for development - the app will use memory cache'
    );
    return false;
  }
}

checkRedis().then((redisAvailable) => {
  if (!redisAvailable) {
    console.log('\n💡 To enable Redis in development:');
    console.log(
      '   1. Install Redis: https://redis.io/docs/getting-started/installation/'
    );
    console.log('   2. Start Redis server: redis-server');
    console.log('   3. Add REDIS_URL=redis://localhost:6379 to .env.local');
  }

  console.log('\n🎉 Development environment setup complete!');
  console.log('\n📋 Available commands:');
  console.log('   npm run dev          - Start with Turbopack (recommended)');
  console.log('   npm run dev:webpack  - Start with Webpack');
  console.log(
    '   npm run dev:standard - Start with standard Next.js dev server'
  );
  console.log('\n🔧 Troubleshooting:');
  console.log('   - Image quality warnings: Fixed in next.config.ts');
  console.log(
    '   - Turbopack/Webpack conflicts: Resolved with conditional config'
  );
  console.log(
    '   - Redis connection: Normal in development, uses memory cache'
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
