const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();

async function deploySimple() {
    console.log('🚀 Deploying Simple Test Lambda Function');
    console.log('========================================\n');

    try {
        // Step 1: Create simple deployment package
        console.log('ℹ️  Creating simple deployment package...');
        const packageDir = path.join(__dirname, 'simple-package');
        
        // Clean up previous package
        if (fs.existsSync(packageDir)) {
            fs.rmSync(packageDir, { recursive: true, force: true });
        }
        fs.mkdirSync(packageDir);

        // Copy index.js to package directory
        const indexJsPath = path.join(__dirname, 'index.js');
        const packageIndexPath = path.join(packageDir, 'index.js');
        fs.copyFileSync(indexJsPath, packageIndexPath);
        console.log('✅ Copied index.js');

        // Create zip file using PowerShell
        const zipPath = path.join(__dirname, 'simple-function.zip');
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
        
        console.log('ℹ️  Creating zip file...');
        // Use PowerShell Compress-Archive for Windows
        execSync(`powershell -Command "Compress-Archive -Path '${packageDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
        
        const stats = fs.statSync(zipPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Deployment package created: ${sizeInMB}MB`);

        // Step 2: Deploy to AWS Lambda
        console.log('ℹ️  Deploying to AWS Lambda...');
        const functionName = 'WordPressBlogStack-WordPressGraphQLC0771999-w2JlZknVchJN';
        
        const zipBuffer = fs.readFileSync(zipPath);
        
        const updateParams = {
            FunctionName: functionName,
            ZipFile: zipBuffer
        };

        await lambda.updateFunctionCode(updateParams).promise();
        console.log('✅ Lambda function code updated successfully');

        // Step 3: Test the deployed function
        console.log('ℹ️  Testing deployed function...');
        
        // Wait a moment for the update to propagate
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test with a simple request
        const testResponse = execSync('curl -X POST "https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql" -H "Content-Type: application/json" -d "{\\"query\\": \\"{ __typename }\\"}"', { encoding: 'utf8' });
        
        console.log('Test Response:', testResponse);
        
        if (testResponse.includes('Internal server error')) {
            console.log('❌ Deployment test failed - function still has issues');
            console.log('❌ \n🔧 Deployment completed but tests failed');
            console.log('Check the CloudWatch logs for more details');
        } else {
            console.log('✅ Deployment test successful!');
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

deploySimple().catch(console.error); 