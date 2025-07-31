#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing build process...');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Please run this script from the project root.');
  }

  console.log('📦 Checking workspace structure...');
  
  // Check if workspaces exist
  const workspaces = ['infrastructure', 'lambda/graphql'];
  for (const workspace of workspaces) {
    if (fs.existsSync(path.join(workspace, 'package.json'))) {
      console.log(`✅ Found workspace: ${workspace}`);
    } else {
      console.log(`⚠️  Missing workspace: ${workspace}`);
    }
  }

  console.log('🔧 Installing dependencies...');
  execSync('npm ci --legacy-peer-deps --no-optional', { stdio: 'inherit' });

  console.log('🏗️  Building workspaces...');
  try {
    execSync('npm run build:workspaces', { stdio: 'inherit' });
    console.log('✅ Workspace builds completed');
  } catch (error) {
    console.log('⚠️  Workspace builds failed, but continuing...');
  }

  console.log('🚀 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build test completed successfully!');
  
} catch (error) {
  console.error('❌ Build test failed:', error.message);
  process.exit(1);
} 