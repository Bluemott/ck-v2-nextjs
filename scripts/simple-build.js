const { execSync } = require('child_process');
const fs = require('fs');

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
  
  // Remove existing node_modules and lock files
  console.log('🗑️ Removing existing files...');
  const filesToRemove = ['node_modules', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      if (fs.lstatSync(file).isDirectory()) {
        execSync(`rm -rf ${file}`, { stdio: 'inherit' });
      } else {
        fs.unlinkSync(file);
      }
      console.log(`✅ Removed ${file}`);
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