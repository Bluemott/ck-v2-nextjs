const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Deploying updated GraphQL Lambda function...');

// Create a temporary directory for the Lambda package
const tempDir = './lambda-package';
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir);

// Copy the Lambda function
fs.copyFileSync('./lambda/graphql/index.ts', `${tempDir}/index.ts`);

// Create package.json for the Lambda
const packageJson = {
  name: "wordpress-graphql-lambda",
  version: "1.0.0",
  main: "index.js",
  dependencies: {
    "graphql": "^16.8.1",
    "pg": "^8.11.3"
  }
};

fs.writeFileSync(`${tempDir}/package.json`, JSON.stringify(packageJson, null, 2));

// Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install', { cwd: tempDir, stdio: 'inherit' });

// Compile TypeScript
console.log('🔨 Compiling TypeScript...');
execSync('npx tsc index.ts --target es2020 --module commonjs --outDir .', { cwd: tempDir, stdio: 'inherit' });

// Create ZIP file
console.log('📦 Creating deployment package...');
execSync('powershell Compress-Archive -Path index.js,package.json,node_modules -DestinationPath lambda-graphql.zip -Force', { cwd: tempDir, stdio: 'inherit' });

// Copy ZIP to root
fs.copyFileSync(`${tempDir}/lambda-graphql.zip`, './lambda-graphql.zip');

// Deploy to AWS
console.log('☁️  Deploying to AWS Lambda...');
execSync('aws lambda update-function-code --function-name WordPressBlogStack-WordPressGraphQLC0771999-wnF0kY4NTVtm --zip-file fileb://lambda-graphql.zip', { stdio: 'inherit' });

// Clean up
fs.rmSync(tempDir, { recursive: true });
fs.unlinkSync('./lambda-graphql.zip');

console.log('✅ GraphQL Lambda function deployed successfully!'); 