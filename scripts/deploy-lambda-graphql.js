#!/usr/bin/env node

/**
 * Deploy Lambda GraphQL Function
 * Updates the Lambda function with the new WordPress-compatible GraphQL schema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Lambda GraphQL function...');

// Configuration
const LAMBDA_DIR = path.join(__dirname, '../lambda/graphql');
const FUNCTION_NAME = 'cowboy-kimono-graphql';
const REGION = 'us-east-1';

try {
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(LAMBDA_DIR, 'index.js'))) {
    throw new Error('Lambda function not found. Please run this script from the project root.');
  }

  console.log('📦 Installing dependencies...');
  execSync('npm install', { cwd: LAMBDA_DIR, stdio: 'inherit' });

  console.log('🔧 Creating deployment package...');
  
  // Create a temporary deployment directory
  const deployDir = path.join(LAMBDA_DIR, 'deploy');
  if (fs.existsSync(deployDir)) {
    execSync('rm -rf deploy', { cwd: LAMBDA_DIR, stdio: 'inherit' });
  }
  fs.mkdirSync(deployDir);

  // Copy necessary files
  execSync('cp index.js package.json package-lock.json deploy/', { cwd: LAMBDA_DIR, stdio: 'inherit' });
  execSync('cp -r node_modules deploy/', { cwd: LAMBDA_DIR, stdio: 'inherit' });

  // Create ZIP file
  console.log('📦 Creating ZIP package...');
  execSync('cd deploy && zip -r ../function.zip .', { cwd: LAMBDA_DIR, stdio: 'inherit' });

  // Deploy to AWS Lambda
  console.log('☁️ Deploying to AWS Lambda...');
  execSync(`aws lambda update-function-code --function-name ${FUNCTION_NAME} --zip-file fileb://function.zip --region ${REGION}`, {
    cwd: LAMBDA_DIR,
    stdio: 'inherit'
  });

  console.log('✅ Lambda function deployed successfully!');
  console.log(`🔗 Function URL: https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql`);
  console.log('📊 You can test the endpoint with:');
  console.log('curl -X POST https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"query":"{ posts(first: 1) { nodes { id title } } }"}\'');

  // Clean up
  execSync('rm -rf deploy function.zip', { cwd: LAMBDA_DIR, stdio: 'inherit' });

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 