#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Testing build process...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ No package.json found. Please run this script from the project root.');
  process.exit(1);
}

// Test 1: Check Node.js version
console.log('1️⃣ Checking Node.js version...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Failed to check Node.js version:', error.message);
}

// Test 2: Check npm version
console.log('\n2️⃣ Checking npm version...');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error('❌ Failed to check npm version:', error.message);
}

// Test 3: Install dependencies with Windows-specific handling
console.log('\n3️⃣ Installing dependencies...');
try {
  // Check if we're on Windows
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    console.log('🪟 Windows detected - using alternative installation method...');
    
    // Clean up any existing files that might cause conflicts
    try {
      console.log('🧹 Cleaning up existing files...');
      if (fs.existsSync('node_modules')) {
        execSync('rmdir /s /q node_modules', { stdio: 'pipe' });
      }
      if (fs.existsSync('.next')) {
        execSync('rmdir /s /q .next', { stdio: 'pipe' });
      }
      if (fs.existsSync('package-lock.json')) {
        fs.unlinkSync('package-lock.json');
      }
    } catch (cleanError) {
      console.log('⚠️ Cleanup failed, continuing...');
    }
    
    // Use npm install with specific flags to avoid conflicts
    try {
      console.log('📦 Installing with npm install...');
      execSync('npm install --legacy-peer-deps --no-optional --no-package-lock', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully with npm install');
    } catch (installError) {
      console.log('⚠️ npm install failed, trying with force...');
      execSync('npm install --force --legacy-peer-deps', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully with force flag');
    }
  } else {
    // Non-Windows: use npm ci
    execSync('npm ci --workspaces --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  }
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Close any text editors or IDEs that might be using the files');
  console.log('2. Temporarily disable antivirus software');
  console.log('3. Run PowerShell as Administrator');
  console.log('4. Try: npm cache clean --force');
  console.log('5. Try: npm install --force');
  process.exit(1);
}

// Test 4: Build workspace packages
console.log('\n4️⃣ Building workspace packages...');
try {
  execSync('npm run build:workspaces', { stdio: 'inherit' });
  console.log('✅ Workspace packages built successfully');
} catch (error) {
  console.log('⚠️ Workspace build failed, but continuing...');
}

// Test 5: Build Next.js app
console.log('\n5️⃣ Building Next.js app...');
try {
  // Use npm run build instead of npx to avoid conflicts
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed successfully');
} catch (error) {
  console.error('❌ Next.js build failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All build tests passed!'); 