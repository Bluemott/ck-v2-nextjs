#!/usr/bin/env node

/**
 * Robust Lambda Deployment Script
 * Deploys a reliable GraphQL Lambda function with proper error handling
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();

async function deployRobustLambda() {
    console.log('🚀 Deploying Robust GraphQL Lambda Function');
    console.log('==========================================\n');

    try {
        // Step 1: Create deployment package
        console.log('ℹ️  Creating robust deployment package...');
        const packageDir = path.join(__dirname, 'robust-package');
        
        // Clean up previous package
        if (fs.existsSync(packageDir)) {
            fs.rmSync(packageDir, { recursive: true, force: true });
        }
        fs.mkdirSync(packageDir);

        // Copy the robust Lambda function
        const robustIndexPath = path.join(__dirname, 'index-robust.js');
        const packageIndexPath = path.join(packageDir, 'index.js');
        fs.copyFileSync(robustIndexPath, packageIndexPath);
        console.log('✅ Copied index-robust.js as index.js');

        // Install fresh dependencies in package directory
        console.log('ℹ️  Installing dependencies...');
        const packageJsonContent = {
            "name": "robust-graphql-lambda",
            "version": "1.0.0",
            "main": "index.js",
            "dependencies": {
                "graphql": "^16.8.1",
                "pg": "^8.16.3"
            }
        };
        
        fs.writeFileSync(
            path.join(packageDir, 'package.json'), 
            JSON.stringify(packageJsonContent, null, 2)
        );
        
        // Install dependencies
        execSync('npm install --production', { 
            cwd: packageDir, 
            stdio: 'inherit' 
        });
        console.log('✅ Dependencies installed');

        // Create zip file
        const zipPath = path.join(__dirname, 'robust-function.zip');
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
        
        console.log('ℹ️  Creating deployment zip...');
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

        // Step 3: Test health check
        console.log('ℹ️  Testing health check...');
        
        // Wait for deployment to propagate
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            const healthResponse = execSync('curl -X POST "https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql" -H "Content-Type: application/json" -d "{\\"query\\": \\"{ health }\\"}"', { encoding: 'utf8' });
            console.log('Health Check Response:', healthResponse);
            
            const dbStatusResponse = execSync('curl -X POST "https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql" -H "Content-Type: application/json" -d "{\\"query\\": \\"{ dbStatus }\\"}"', { encoding: 'utf8' });
            console.log('Database Status Response:', dbStatusResponse);
            
            console.log('✅ Deployment and testing completed!');
            
        } catch (testError) {
            console.log('⚠️  Test requests failed:', testError.message);
            console.log('Function deployed but tests inconclusive - check CloudWatch logs');
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

deployRobustLambda().catch(console.error);