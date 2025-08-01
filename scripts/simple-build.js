const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting simplified build process...');

try {
  // Check Node.js version
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  // Check npm version
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
  
  // Clean npm cache
  console.log('🧹 Cleaning npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  // Remove existing node_modules and lock files with better error handling
  console.log('🗑️ Removing existing files...');
  const filesToRemove = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  
  // Handle node_modules removal more carefully
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    try {
      // Try to remove node_modules directory
      execSync(`rm -rf "${nodeModulesPath}"`, { stdio: 'inherit' });
      console.log('✅ Removed node_modules');
    } catch (error) {
      console.log('⚠️ Could not remove node_modules, continuing anyway...');
    }
  }
  
  // Remove lock files
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`✅ Removed ${file}`);
      } catch (error) {
        console.log(`⚠️ Could not remove ${file}: ${error.message}`);
      }
    }
  }
  
  // Install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm install --legacy-peer-deps --no-optional', { stdio: 'inherit' });
  
  // Install workspace dependencies
  console.log('📦 Installing workspace dependencies...');
  execSync('npm install --workspaces --legacy-peer-deps --no-optional', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully!');
  
} catch (error) {
  console.error('❌ Build setup failed:', error.message);
  process.exit(1);
} 