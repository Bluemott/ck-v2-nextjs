#!/usr/bin/env node

/**
 * Invoke Lambda Import Script
 * Sends WordPress data to Lambda function for import into Aurora
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 WordPress Lambda Import Invoker');
console.log('==================================\n');

// Configuration
const config = {
  importDir: './wordpress-export',
  lambdaFunctionName: 'WordPressImportFunction', // You'll need to create this
  region: 'us-east-1'
};

// Helper function to read JSON file
function readJsonFile(filename) {
  const filepath = path.join(config.importDir, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Create Lambda function deployment package
function createDeploymentPackage() {
  console.log('📦 Creating Lambda deployment package...');
  
  // Create deployment directory
  const deployDir = './lambda-deploy';
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  
  // Copy Lambda function
  fs.copyFileSync('./lambda/import-wordpress-data.js', `${deployDir}/index.js`);
  
  // Create package.json for Lambda
  const packageJson = {
    name: 'wordpress-import-lambda',
    version: '1.0.0',
    description: 'WordPress data import Lambda function',
    main: 'index.js',
    dependencies: {
      pg: '^8.11.3'
    }
  };
  
  fs.writeFileSync(`${deployDir}/package.json`, JSON.stringify(packageJson, null, 2));
  
  console.log('✅ Deployment package created in ./lambda-deploy');
  console.log('📝 Next steps:');
  console.log('1. cd lambda-deploy');
  console.log('2. npm install');
  console.log('3. zip -r ../lambda-import.zip .');
  console.log('4. aws lambda create-function --function-name WordPressImportFunction --runtime nodejs18.x --role arn:aws:iam::925242451851:role/lambda-execution-role --handler index.handler --zip-file fileb://lambda-import.zip');
}

// Prepare the payload for Lambda invocation
function preparePayload() {
  console.log('📖 Reading WordPress export data...');
  
  const posts = readJsonFile('posts.json');
  const categories = readJsonFile('categories.json');
  const tags = readJsonFile('tags.json');
  
  const payload = {
    posts: posts,
    categories: categories,
    tags: tags
  };
  
  // Save payload to file
  const payloadFile = './lambda-payload.json';
  fs.writeFileSync(payloadFile, JSON.stringify(payload, null, 2));
  
  console.log('✅ Payload prepared:');
  console.log(`   Posts: ${posts.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Tags: ${tags.length}`);
  console.log(`   Payload saved to: ${payloadFile}`);
  
  return payloadFile;
}

// Main function
async function main() {
  console.log('🚀 Starting WordPress Lambda import process...');
  
  // Check if export data exists
  if (!fs.existsSync(`${config.importDir}/posts.json`)) {
    console.error('❌ Export data not found. Please run the export script first.');
    process.exit(1);
  }
  
  // Create deployment package
  createDeploymentPackage();
  
  // Prepare payload
  const payloadFile = preparePayload();
  
  console.log('\n🎯 Next steps:');
  console.log('1. Deploy the Lambda function:');
  console.log('   cd lambda-deploy');
  console.log('   npm install');
  console.log('   zip -r ../lambda-import.zip .');
  console.log('   aws lambda create-function --function-name WordPressImportFunction --runtime nodejs18.x --role arn:aws:iam::925242451851:role/lambda-execution-role --handler index.handler --zip-file fileb://lambda-import.zip');
  console.log('');
  console.log('2. Invoke the Lambda function:');
  console.log(`   aws lambda invoke --function-name WordPressImportFunction --payload file://${payloadFile} response.json`);
  console.log('');
  console.log('3. Check the response:');
  console.log('   cat response.json');
  
  console.log('\n💡 Alternative: You can also manually invoke the Lambda function through the AWS Console');
  console.log('   - Go to AWS Lambda Console');
  console.log('   - Create a new function with the code from lambda/import-wordpress-data.js');
  console.log('   - Add the pg dependency');
  console.log('   - Configure VPC access to your Aurora database');
  console.log('   - Test with the payload from lambda-payload.json');
}

// Run the script
main().catch(console.error); 