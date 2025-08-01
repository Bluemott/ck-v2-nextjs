#!/usr/bin/env node

/**
 * Amplify Environment Check Script
 * Debugs environment variables and AWS configuration for Amplify builds
 */

console.log('🔍 Checking Amplify build environment...\n');

// Check required environment variables
const requiredVars = [
  'NODE_ENV',
  'AWS_REGION',
  'CODEBUILD_BUILD_ID',
  'CODEBUILD_RESOLVED_SOURCE_VERSION'
];

console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Check optional but important variables
const optionalVars = [
  'NEXT_PUBLIC_WORDPRESS_REST_URL',
  'NEXT_PUBLIC_CLOUDFRONT_URL',
  'AWS_DATABASE_SETUP_ENDPOINT',
  'AWS_DATA_IMPORT_ENDPOINT'
];

console.log('\n🔧 Optional Environment Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  }
});

// Check AWS credentials (if available)
console.log('\n🔐 AWS Configuration:');
if (process.env.AWS_ACCESS_KEY_ID) {
  console.log('✅ AWS Access Key ID: SET');
} else {
  console.log('⚠️  AWS Access Key ID: NOT SET (using IAM role)');
}

if (process.env.AWS_SECRET_ACCESS_KEY) {
  console.log('✅ AWS Secret Access Key: SET');
} else {
  console.log('⚠️  AWS Secret Access Key: NOT SET (using IAM role)');
}

console.log(`✅ AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);

// Check build environment
console.log('\n🏗️  Build Environment:');
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
console.log(`✅ NEXT_TELEMETRY_DISABLED: ${process.env.NEXT_TELEMETRY_DISABLED || '1'}`);

// Check file system
const fs = require('fs');
console.log('\n📁 File System Check:');
const criticalFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'amplify.yml'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: EXISTS`);
  } else {
    console.log(`❌ ${file}: MISSING`);
  }
});

console.log('\n🎯 Environment check complete!'); 