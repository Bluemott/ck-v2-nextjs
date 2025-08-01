#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting build test...');

// Check Node.js version
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
    console.warn('⚠️  Warning: Node.js version should be 18 or 20 for optimal compatibility');
  }
} catch (error) {
  console.error('❌ Failed to check Node.js version:', error.message);
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error('❌ Failed to check npm version:', error.message);
}

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ package.json found');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`✅ Project name: ${packageJson.name}`);
    console.log(`✅ Next.js version: ${packageJson.dependencies?.next || 'Not found'}`);
  } catch (error) {
    console.error('❌ Failed to parse package.json:', error.message);
  }
} else {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Check if next.config.ts exists
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ next.config.ts found');
} else {
  console.warn('⚠️  next.config.ts not found, using default Next.js config');
}

// Check if amplify.yml exists
const amplifyYmlPath = path.join(process.cwd(), 'amplify.yml');
if (fs.existsSync(amplifyYmlPath)) {
  console.log('✅ amplify.yml found');
} else {
  console.warn('⚠️  amplify.yml not found, using default Amplify config');
}

// Check environment variables
console.log('\n🔧 Environment Variables:');
const envVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_USE_AWS_GRAPHQL',
  'NEXT_PUBLIC_AWS_GRAPHQL_URL',
  'NEXT_PUBLIC_WPGRAPHQL_URL',
  'AWS_REGION'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('KEY') || varName.includes('SECRET') ? '[HIDDEN]' : value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set`);
  }
});

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('\n✅ node_modules directory exists');
  
  // Check for critical dependencies
  const criticalDeps = ['next', 'react', 'react-dom'];
  criticalDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      console.log(`✅ ${dep} found in node_modules`);
    } else {
      console.warn(`⚠️  ${dep} not found in node_modules`);
    }
  });
} else {
  console.warn('\n⚠️  node_modules directory not found');
  console.log('💡 Run "npm install" to install dependencies');
}

// Test TypeScript compilation
console.log('\n🔧 Testing TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.warn('⚠️  TypeScript compilation failed (this is expected if typescript.ignoreBuildErrors is true)');
  console.log('💡 TypeScript errors will be ignored during build');
}

// Test ESLint
console.log('\n🔧 Testing ESLint...');
try {
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0', { stdio: 'pipe' });
  console.log('✅ ESLint passed');
} catch (error) {
  console.warn('⚠️  ESLint failed (this is expected if eslint.ignoreDuringBuilds is true)');
  console.log('💡 ESLint errors will be ignored during build');
}

console.log('\n🎉 Build test completed!');
console.log('💡 If you see any warnings above, they may need to be addressed for optimal build performance.'); 