#!/usr/bin/env node

/**
 * Fixed Infrastructure Deployment Script
 * This script properly deploys the AWS infrastructure with the corrected Lambda functions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Fixed AWS Infrastructure Deployment');
console.log('====================================\n');

// Configuration
const config = {
  region: 'us-east-1',
  infraDir: path.join(__dirname, '..', 'infrastructure'),
  lambdaDir: path.join(__dirname, '..', 'lambda'),
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function executeCommand(command, description, cwd = '.', options = {}) {
  try {
    log(`Executing: ${description}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: cwd,
      ...options
    });
    log(`Success: ${description}`, 'success');
    return result;
  } catch (error) {
    log(`Error: ${description} - ${error.message}`, 'error');
    if (!options.continueOnError) {
      throw error;
    }
    return null;
  }
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'AWS CLI', command: 'aws --version' },
    { name: 'AWS CDK', command: 'cdk --version' }
  ];
  
  for (const check of checks) {
    try {
      executeCommand(check.command, `Checking ${check.name}`, '.', { silent: true });
    } catch (error) {
      log(`Missing prerequisite: ${check.name}`, 'error');
      console.log(`\nPlease install ${check.name}:`);
      
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

function verifyLambdaStructure() {
  log('🏗️  Verifying Lambda function structure...');
  
  const requiredPaths = [
    'lambda/setup-database/index.mjs',
    'lambda/setup-database/package.json',
    'lambda/import-data/index.mjs',
    'lambda/import-data/package.json',
  ];
  
  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(__dirname, '..', requiredPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required file missing: ${requiredPath}`);
    }
  }
  
  log('Lambda function structure verified', 'success');
}

function installDependencies() {
  log('📦 Installing dependencies...');
  
  // Install infrastructure dependencies
  executeCommand('npm install', 'Installing infrastructure dependencies', config.infraDir);
  
  // Install Lambda dependencies
  const lambdaDirs = ['setup-database', 'import-data'];
  
  for (const dir of lambdaDirs) {
    const lambdaPath = path.join(config.lambdaDir, dir);
    if (fs.existsSync(lambdaPath)) {
      executeCommand('npm install', `Installing ${dir} Lambda dependencies`, lambdaPath);
    }
  }
  
  log('All dependencies installed', 'success');
}

function buildInfrastructure() {
  log('🔨 Building infrastructure...');
  
  executeCommand('npm run build', 'Building TypeScript infrastructure', config.infraDir);
  
  log('Infrastructure build completed', 'success');
}

function bootstrapCDK() {
  log('🚀 Bootstrapping CDK (if needed)...');
  
  try {
    executeCommand('cdk bootstrap', 'Bootstrapping CDK', config.infraDir, { silent: true });
    log('CDK bootstrap completed', 'success');
  } catch (error) {
    log('CDK bootstrap failed - this might be normal if already bootstrapped', 'warning');
  }
}

function deployStack() {
  log('☁️  Deploying AWS stack...');
  
  try {
    executeCommand(
      'cdk deploy --require-approval never --outputs-file outputs.json', 
      'Deploying AWS infrastructure', 
      config.infraDir
    );
    
    log('Infrastructure deployment completed', 'success');
    
    // Read and display outputs
    const outputsPath = path.join(config.infraDir, 'outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      
      log('📋 Deployment outputs:', 'success');
      Object.entries(outputs.WordPressBlogStack || {}).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
  } catch (error) {
    log('Infrastructure deployment failed', 'error');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure AWS credentials are configured: aws configure');
    console.log('2. Check if you have sufficient permissions in your AWS account');
    console.log('3. Verify your AWS region is set correctly');
    console.log('4. Ensure you have enough AWS service limits for the resources');
    console.log('5. Check CloudFormation console for detailed error messages');
    throw error;
  }
}

function updateEnvironmentFile() {
  log('📝 Updating environment configuration...');
  
  try {
    const outputsPath = path.join(config.infraDir, 'outputs.json');
    const envPath = path.join(__dirname, '..', '.env.local');
    
    if (fs.existsSync(outputsPath)) {
      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      const stackOutputs = outputs.WordPressBlogStack || {};
      
      let envContent = '# AWS GraphQL Configuration - Updated by deployment script\n';
      
      if (stackOutputs.GraphQLEndpoint) {
        envContent += `NEXT_PUBLIC_AWS_GRAPHQL_URL=${stackOutputs.GraphQLEndpoint}\n`;
      }
      
      if (stackOutputs.CloudFrontURL) {
        envContent += `NEXT_PUBLIC_CLOUDFRONT_URL=${stackOutputs.CloudFrontURL}\n`;
      }
      
      envContent += 'NEXT_PUBLIC_USE_AWS_GRAPHQL=true\n\n';
      
      // Add deployment information
      envContent += '# Deployment Information\n';
      if (stackOutputs.DatabaseSetupEndpoint) {
        envContent += `AWS_DATABASE_SETUP_ENDPOINT=${stackOutputs.DatabaseSetupEndpoint}\n`;
      }
      if (stackOutputs.DataImportEndpoint) {
        envContent += `AWS_DATA_IMPORT_ENDPOINT=${stackOutputs.DataImportEndpoint}\n`;
      }
      if (stackOutputs.AuroraClusterEndpoint) {
        envContent += `AWS_AURORA_ENDPOINT=${stackOutputs.AuroraClusterEndpoint}\n`;
      }
      
      envContent += '\n# WordPress Admin (Lightsail) - for content management only\n';
      envContent += 'NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com\n';
      
      fs.writeFileSync(envPath, envContent);
      log('Environment file updated successfully', 'success');
    } else {
      log('CDK outputs file not found, skipping environment update', 'warning');
    }
    
  } catch (error) {
    log(`Failed to update environment file: ${error.message}`, 'error');
  }
}

function showNextSteps() {
  console.log('\n🎉 Infrastructure deployment completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the database setup endpoint:');
  console.log('   curl -X POST [DATABASE_SETUP_ENDPOINT]');
  console.log('');
  console.log('2. Run the batch import script:');
  console.log('   node scripts/batch-import-wordpress.js --dry-run');
  console.log('   node scripts/batch-import-wordpress.js');
  console.log('');
  console.log('3. Test the GraphQL endpoint:');
  console.log('   curl -X POST [GRAPHQL_ENDPOINT] \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"query": "{ posts { nodes { title } } }"}\'');
  console.log('');
  console.log('4. Update your frontend to use the new AWS API');
  console.log('5. Monitor costs and performance in AWS console');
  
  console.log('\n💰 Cost optimization reminders:');
  console.log('- Monitor Lambda execution duration and optimize if needed');
  console.log('- Check Aurora Serverless auto-scaling behavior');
  console.log('- Review CloudWatch logs retention policies');
  console.log('- Set up AWS Cost Alerts for budget monitoring');
}

// Main deployment function
async function runDeployment() {
  try {
    log('🚀 Starting fixed infrastructure deployment...');
    const startTime = Date.now();
    
    // Step 1: Check prerequisites
    checkPrerequisites();
    
    // Step 2: Verify Lambda structure
    verifyLambdaStructure();
    
    // Step 3: Install dependencies
    installDependencies();
    
    // Step 4: Build infrastructure
    buildInfrastructure();
    
    // Step 5: Bootstrap CDK
    bootstrapCDK();
    
    // Step 6: Deploy stack
    deployStack();
    
    // Step 7: Update environment
    updateEnvironmentFile();
    
    // Step 8: Show next steps
    showNextSteps();
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Total deployment time: ${(duration / 1000).toFixed(2)}s`);
    
  } catch (error) {
    log(`💥 Deployment failed: ${error.message}`, 'error');
    console.log('\n🔧 Common fixes:');
    console.log('- Run: aws configure');
    console.log('- Check AWS permissions');
    console.log('- Verify AWS service limits');
    console.log('- Check CloudFormation console for details');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Fixed Infrastructure Deployment Script

Usage: node scripts/deploy-fixed-infrastructure.js [options]

Options:
  --help, -h     Show this help message
  --check-only   Only check prerequisites and structure

Example:
  node scripts/deploy-fixed-infrastructure.js --check-only
`);
  process.exit(0);
}

if (args.includes('--check-only')) {
  console.log('🔍 Check-only mode - no deployment will be made');
  try {
    checkPrerequisites();
    verifyLambdaStructure();
    console.log('\n✅ All checks passed! Ready for deployment.');
  } catch (error) {
    console.error(`\n❌ Check failed: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// Run the deployment
runDeployment();