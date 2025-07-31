#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 Windows Cleanup Script\n');

// Check if we're on Windows
if (os.platform() !== 'win32') {
  console.log('⚠️ This script is designed for Windows. Skipping...');
  process.exit(0);
}

console.log('🪟 Windows detected - performing cleanup...\n');

// Step 1: Stop any running processes that might lock files
console.log('1️⃣ Stopping any running Node.js processes...');
try {
  execSync('taskkill /f /im node.exe', { stdio: 'pipe' });
  console.log('✅ Node.js processes stopped');
} catch (error) {
  console.log('ℹ️ No Node.js processes found or already stopped');
}

// Step 2: Clean npm cache
console.log('\n2️⃣ Cleaning npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleaned');
} catch (error) {
  console.log('⚠️ Failed to clean npm cache:', error.message);
}

// Step 3: Remove node_modules directories
console.log('\n3️⃣ Removing node_modules directories...');
const dirsToRemove = [
  'node_modules',
  'infrastructure/node_modules',
  'lambda/graphql/node_modules'
];

dirsToRemove.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      console.log(`🗑️ Removing ${dir}...`);
      execSync(`rmdir /s /q "${dir}"`, { stdio: 'pipe' });
      console.log(`✅ Removed ${dir}`);
    } catch (error) {
      console.log(`⚠️ Failed to remove ${dir}:`, error.message);
    }
  }
});

// Step 4: Remove lock files
console.log('\n4️⃣ Removing lock files...');
const lockFiles = [
  'package-lock.json',
  'infrastructure/package-lock.json',
  'lambda/graphql/package-lock.json'
];

lockFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      console.log(`🗑️ Removing ${file}...`);
      fs.unlinkSync(file);
      console.log(`✅ Removed ${file}`);
    } catch (error) {
      console.log(`⚠️ Failed to remove ${file}:`, error.message);
    }
  }
});

// Step 5: Clean Next.js cache
console.log('\n5️⃣ Cleaning Next.js cache...');
if (fs.existsSync('.next')) {
  try {
    console.log('🗑️ Removing .next directory...');
    execSync('rmdir /s /q .next', { stdio: 'pipe' });
    console.log('✅ Removed .next directory');
  } catch (error) {
    console.log('⚠️ Failed to remove .next directory:', error.message);
  }
}

console.log('\n🎉 Cleanup completed!');
console.log('\n💡 Next steps:');
console.log('1. Run: npm install --legacy-peer-deps');
console.log('2. Run: npm run test:build');
console.log('3. If issues persist, try running PowerShell as Administrator'); 