#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting simple build process...');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Please run this script from the project root.');
  }

  console.log('📦 Installing dependencies...');
  
  // Try npm ci first, fallback to npm install
  try {
    execSync('npm ci --legacy-peer-deps --no-optional', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Dependencies installed with npm ci');
  } catch (error) {
    console.log('⚠️  npm ci failed, trying npm install...');
    execSync('npm install --legacy-peer-deps --no-optional', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Dependencies installed with npm install');
  }

  // Set environment variables for build
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    // Set defaults for missing environment variables
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com',

    AWS_REGION: process.env.AWS_REGION || 'us-east-1'
  };

  console.log('🏗️  Building Next.js application...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: buildEnv
  });

  console.log('✅ Simple build completed successfully!');
  
  // Check if .next directory was created
  if (fs.existsSync('.next')) {
    console.log('✅ Build artifacts created in .next directory');
  } else {
    console.warn('⚠️  .next directory not found after build');
  }

} catch (error) {
  console.error('❌ Simple build failed:', error.message);
  process.exit(1);
} 