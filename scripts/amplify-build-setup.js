#!/usr/bin/env node

/**
 * Amplify Build Setup Script
 * Handles environment variable setup and AWS credentials for Amplify builds
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Amplify build environment...');

// Set required environment variables for the build
const requiredEnvVars = {
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
};

// Set environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  process.env[key] = value;
  console.log(`✅ Set ${key}=${value}`);
});

// Check for required files
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'tailwind.config.js'
];

console.log('\n📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Found ${file}`);
  } else {
    console.log(`❌ Missing ${file}`);
    process.exit(1);
  }
});

// Check for environment files
const envFiles = ['.env', '.env.local'];
console.log('\n🔐 Checking environment files...');
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Found ${file}`);
  } else {
    console.log(`⚠️  Missing ${file} (optional)`);
  }
});

console.log('\n🚀 Amplify build environment setup complete!');
console.log('📊 Environment Summary:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   AWS_REGION: ${process.env.AWS_REGION}`);
console.log(`   NEXT_TELEMETRY_DISABLED: ${process.env.NEXT_TELEMETRY_DISABLED}`); 