const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 Installing dependencies with fallback strategies...');

// Check if package-lock.json exists
const hasPackageLock = fs.existsSync('package-lock.json');
console.log(`📄 Package-lock.json exists: ${hasPackageLock}`);

const installStrategies = [
  {
    name: 'npm ci with legacy peer deps',
    command: 'npm ci --legacy-peer-deps --no-optional',
    description: 'Clean install with legacy peer deps',
    condition: hasPackageLock
  },
  {
    name: 'npm install with legacy peer deps',
    command: 'npm install --legacy-peer-deps --no-optional',
    description: 'Regular install with legacy peer deps',
    condition: true
  },
  {
    name: 'npm install with force',
    command: 'npm install --force --legacy-peer-deps',
    description: 'Force install with legacy peer deps',
    condition: true
  },
  {
    name: 'npm install with legacy peer deps and no lock',
    command: 'npm install --legacy-peer-deps --no-package-lock',
    description: 'Install without package lock',
    condition: true
  },
  {
    name: 'npm install with legacy peer deps and no optional',
    command: 'npm install --legacy-peer-deps --no-optional --no-package-lock',
    description: 'Install without optional deps and package lock',
    condition: true
  }
];

async function tryInstall(strategy) {
  if (!strategy.condition) {
    console.log(`⏭️ Skipping: ${strategy.name} (condition not met)`);
    return false;
  }

  try {
    console.log(`🔄 Trying: ${strategy.description}`);
    execSync(strategy.command, { stdio: 'inherit' });
    console.log(`✅ Success with: ${strategy.name}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with: ${strategy.name}`);
    return false;
  }
}

async function installDependencies() {
  // Clean npm cache first
  try {
    console.log('🧹 Cleaning npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Cache clean failed, continuing...');
  }

  // Remove problematic files if they exist
  const filesToRemove = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`🗑️ Removed ${file}`);
      } catch (error) {
        console.log(`⚠️ Could not remove ${file}`);
      }
    }
  }

  // Try each installation strategy
  for (const strategy of installStrategies) {
    const success = await tryInstall(strategy);
    if (success) {
      console.log('✅ Dependencies installed successfully!');
      return true;
    }
  }

  console.log('❌ All installation strategies failed');
  return false;
}

// Run the installation
installDependencies().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 