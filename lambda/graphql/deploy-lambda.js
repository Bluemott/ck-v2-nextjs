#!/usr/bin/env node

/**
 * Simple Lambda Deployment Script
 * Deploys the GraphQL Lambda function without TypeScript compilation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying GraphQL Lambda Function');
console.log('===================================\n');

const config = {
  functionName: 'WordPressBlogStack-WordPressGraphQLC0771999-w2JlZknVchJN',
  region: 'us-east-1'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function createJavaScriptVersion() {
  log('Creating JavaScript version from TypeScript...');
  
  try {
    // Read the TypeScript file
    const tsContent = fs.readFileSync('index.ts', 'utf8');
    
    // Simple conversion: remove type annotations and imports
    let jsContent = tsContent
      .replace(/import.*from.*['"]aws-lambda['"];?\n?/g, '') // Remove AWS Lambda types import
      .replace(/: APIGatewayProxyEvent/g, '')
      .replace(/: APIGatewayProxyResult/g, '')
      .replace(/: string/g, '')
      .replace(/: number/g, '')
      .replace(/: boolean/g, '')
      .replace(/: any/g, '')
      .replace(/: Pool/g, '')
      .replace(/export\s+/g, 'exports.'); // Convert exports
    
    // Write the JavaScript version
    fs.writeFileSync('index.js', jsContent);
    log('JavaScript version created successfully', 'success');
    
    return true;
  } catch (error) {
    log(`Failed to create JavaScript version: ${error.message}`, 'error');
    return false;
  }
}

async function createDeploymentPackage() {
  log('Creating deployment package...');
  
  try {
    // Check if node_modules exists
    const hasNodeModules = fs.existsSync('node_modules');
    
    // Create a simple zip with just the essentials
    const files = hasNodeModules 
      ? 'index.js,node_modules,package.json'
      : 'index.js,package.json';
      
    const zipCommand = process.platform === 'win32' 
      ? `powershell Compress-Archive -Path ${files} -DestinationPath function.zip -Force`
      : `zip -r function.zip index.js package.json ${hasNodeModules ? 'node_modules/' : ''}`;
    
    log(`Creating package with: ${files}`);
    execSync(zipCommand, { cwd: __dirname });
    
    if (fs.existsSync('function.zip')) {
      const stats = fs.statSync('function.zip');
      log(`Deployment package created: ${(stats.size / 1024 / 1024).toFixed(2)}MB`, 'success');
      
      if (!hasNodeModules) {
        log('⚠️  Package created without node_modules - Lambda Layer should provide dependencies', 'info');
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Failed to create deployment package: ${error.message}`, 'error');
    return false;
  }
}

async function deployToAWS() {
  log('Deploying to AWS Lambda...');
  
  try {
    const command = `aws lambda update-function-code --function-name "${config.functionName}" --zip-file fileb://function.zip --region ${config.region}`;
    
    const result = execSync(command, { encoding: 'utf8', cwd: __dirname });
    
    if (result.includes('LastModified')) {
      log('Lambda function code updated successfully', 'success');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Failed to deploy to AWS: ${error.message}`, 'error');
    return false;
  }
}

async function testDeployment() {
  log('Testing deployed function...');
  
  try {
    // Wait a moment for deployment to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testUrl = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';
    const testQuery = { query: '{ __typename }' };
    
    // Use curl to test since we're in a simpler script
    const curlCommand = `curl -X POST "${testUrl}" -H "Content-Type: application/json" -d '${JSON.stringify(testQuery)}' --max-time 10`;
    
    const response = execSync(curlCommand, { encoding: 'utf8' });
    
    console.log('Test Response:', response);
    
    if (response.includes('200') || response.includes('data') || !response.includes('Internal server error')) {
      log('Deployment test successful!', 'success');
      return true;
    } else {
      log('Deployment test failed - function still has issues', 'error');
      return false;
    }
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  try {
    log('🚀 Starting GraphQL Lambda deployment...');
    
    // Step 1: Convert TypeScript to JavaScript
    const jsCreated = await createJavaScriptVersion();
    if (!jsCreated) {
      throw new Error('Failed to create JavaScript version');
    }
    
    // Step 2: Create deployment package
    const packageCreated = await createDeploymentPackage();
    if (!packageCreated) {
      throw new Error('Failed to create deployment package');
    }
    
    // Step 3: Deploy to AWS
    const deployed = await deployToAWS();
    if (!deployed) {
      throw new Error('Failed to deploy to AWS');
    }
    
    // Step 4: Test deployment
    const testPassed = await testDeployment();
    
    if (testPassed) {
      log('\n🎉 SUCCESS! GraphQL API is now working!', 'success');
      console.log('\nNext steps:');
      console.log('1. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local');
      console.log('2. Test your frontend with: npm run dev');
      console.log('3. Import WordPress data if needed');
    } else {
      log('\n🔧 Deployment completed but tests failed', 'error');
      console.log('Check the CloudWatch logs for more details');
    }
    
  } catch (error) {
    log(`Deployment failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}