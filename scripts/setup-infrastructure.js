#!/usr/bin/env node

/**
 * Infrastructure Setup Script
 * This script helps set up the AWS CDK infrastructure for the WordPress blog migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 AWS CDK Infrastructure Setup');
console.log('================================\n');

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function executeCommand(command, description, cwd = '.') {
  try {
    log(`Executing: ${description}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: cwd
    });
    log(`Success: ${description}`, 'success');
    return result;
  } catch (error) {
    log(`Error: ${description} - ${error.message}`, 'error');
    throw error;
  }
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'AWS CLI', command: 'aws --version' },
    { name: 'AWS CDK', command: 'cdk --version' }
  ];
  
  for (const check of checks) {
    try {
      executeCommand(check.command, `Checking ${check.name}`);
    } catch (error) {
      log(`Missing prerequisite: ${check.name}`, 'error');
      console.log(`\nPlease install ${check.name} before proceeding:`);
      
      switch (check.name) {
        case 'Node.js':
          console.log('  Download from: https://nodejs.org/');
          break;
        case 'npm':
          console.log('  Usually comes with Node.js');
          break;
        case 'AWS CLI':
          console.log('  Install with: pip install awscli');
          console.log('  Or download from: https://aws.amazon.com/cli/');
          break;
        case 'AWS CDK':
          console.log('  Install with: npm install -g aws-cdk');
          break;
      }
      throw new Error(`Please install ${check.name} before proceeding`);
    }
  }
  
  log('All prerequisites met', 'success');
}

function setupInfrastructure() {
  log('Setting up AWS CDK infrastructure...');
  
  try {
    // Navigate to infrastructure directory
    const infraDir = path.join(__dirname, '..', 'infrastructure');
    
    // Install dependencies
    executeCommand('npm install', 'Installing infrastructure dependencies', infraDir);
    
    // Build TypeScript
    executeCommand('npm run build', 'Building infrastructure code', infraDir);
    
    // Bootstrap CDK (if needed)
    try {
      executeCommand('cdk bootstrap', 'Bootstrapping CDK', infraDir);
    } catch (error) {
      log('CDK bootstrap failed - this might be normal if already bootstrapped', 'info');
    }
    
    // Deploy the stack
    executeCommand('cdk deploy --require-approval never', 'Deploying AWS infrastructure', infraDir);
    
    log('Infrastructure deployment completed successfully!', 'success');
    
    // Get the outputs
    try {
      const outputs = executeCommand('cdk deploy --outputs-file outputs.json', 'Getting stack outputs', infraDir);
      log('Stack outputs saved to outputs.json', 'success');
    } catch (error) {
      log('Could not save outputs - this is optional', 'info');
    }
    
  } catch (error) {
    log('Infrastructure deployment failed', 'error');
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure AWS credentials are configured: aws configure');
    console.log('2. Check if you have sufficient permissions in your AWS account');
    console.log('3. Verify your AWS region is set correctly');
    console.log('4. Ensure you have enough AWS service limits for the resources');
    throw error;
  }
}

function createEnvironmentFile() {
  log('Creating environment configuration...');
  
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = `# AWS GraphQL Configuration
# Update these URLs after deployment with the actual values from CDK outputs
NEXT_PUBLIC_AWS_GRAPHQL_URL=https://your-api-gateway-url.amazonaws.com/prod/graphql
NEXT_PUBLIC_USE_AWS_GRAPHQL=true
NEXT_PUBLIC_CLOUDFRONT_URL=https://your-cloudfront-distribution.cloudfront.net

# WordPress Admin (Lightsail) - for content management only
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
`;
    
    fs.writeFileSync(envPath, envContent);
    log('Environment file created: .env.local', 'success');
    log('Remember to update the URLs with actual values from CDK outputs', 'info');
    
  } catch (error) {
    log('Failed to create environment file', 'error');
    throw error;
  }
}

function showNextSteps() {
  console.log('\n🎉 Infrastructure setup completed!');
  console.log('\nNext steps:');
  console.log('1. Update .env.local with the actual URLs from CDK outputs');
  console.log('2. Deploy the Lambda function: npm run deploy:lambda');
  console.log('3. Test the GraphQL endpoint');
  console.log('4. Migrate your WordPress database to Aurora PostgreSQL');
  console.log('5. Sync static content to S3');
  console.log('6. Update your frontend to use the new AWS GraphQL API');
  
  console.log('\nCost optimization benefits:');
  console.log('- Estimated monthly savings: 60-70%');
  console.log('- Target monthly cost: $35-75');
  console.log('- Current monthly cost: $120-250');
  
  console.log('\nFor detailed migration steps, see: deployment/migration-guide.md');
}

// Main setup function
async function runSetup() {
  try {
    log('Starting AWS CDK infrastructure setup...');
    
    // Step 1: Check prerequisites
    checkPrerequisites();
    
    // Step 2: Setup infrastructure
    setupInfrastructure();
    
    // Step 3: Create environment file
    createEnvironmentFile();
    
    // Step 4: Show next steps
    showNextSteps();
    
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    console.log('\n❌ Setup failed. Please check the errors above and try again.');
    console.log('\nCommon issues:');
    console.log('- AWS credentials not configured');
    console.log('- Insufficient AWS permissions');
    console.log('- AWS service limits exceeded');
    console.log('- Network connectivity issues');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AWS CDK Infrastructure Setup Script

Usage: node scripts/setup-infrastructure.js [options]

Options:
  --help, -h     Show this help message
  --check-only   Only check prerequisites without deploying

Prerequisites:
  - Node.js (>=18.0.0)
  - npm (>=8.0.0)
  - AWS CLI configured
  - AWS CDK installed globally

Example:
  node scripts/setup-infrastructure.js --check-only
`);
  process.exit(0);
}

if (args.includes('--check-only')) {
  console.log('🔍 Check-only mode - no deployment will be made');
  checkPrerequisites();
  console.log('\n✅ All prerequisites are met!');
  process.exit(0);
}

// Run the setup
runSetup(); 