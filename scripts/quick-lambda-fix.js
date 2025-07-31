#!/usr/bin/env node

/**
 * Quick Lambda Fix - Create a minimal working Lambda function
 * that can return basic data while we debug the dependency issues
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Quick Lambda Fix - Creating minimal working function');
console.log('=====================================================\n');

// Create a simple test function that doesn't require external dependencies
const minimalLambdaCode = `
exports.handler = async (event) => {
    console.log('Lambda function started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Return a simple GraphQL response for now
        const query = event.body ? JSON.parse(event.body).query : '';
        
        console.log('Query received:', query);
        
        // Simple hardcoded response for testing
        const response = {
            data: {
                __typename: "Query",
                posts: {
                    nodes: [
                        {
                            id: "1",
                            title: "Test Post",
                            slug: "test-post",
                            excerpt: "This is a test post to verify the API is working",
                            date: "2025-07-31T00:00:00Z"
                        }
                    ],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                }
            }
        };
        
        console.log('Returning response:', JSON.stringify(response, null, 2));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error in Lambda function:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            })
        };
    }
};
`;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function deployMinimalFunction() {
    try {
        log('Creating minimal Lambda function...');
        
        // Write the minimal function
        fs.writeFileSync('lambda/graphql/index-minimal.js', minimalLambdaCode);
        
        // Create deployment package
        log('Creating deployment package...');
        const zipCommand = 'powershell "Compress-Archive -Path lambda/graphql/index-minimal.js,lambda/graphql/package.json -DestinationPath lambda/graphql/minimal-function.zip -Force"';
        execSync(zipCommand);
        
        // Deploy to AWS
        log('Deploying to AWS Lambda...');
        const deployCommand = 'aws lambda update-function-code --function-name "WordPressBlogStack-WordPressGraphQLC0771999-w2JlZknVchJN" --zip-file fileb://lambda/graphql/minimal-function.zip --region us-east-1';
        execSync(deployCommand);
        
        // Update handler to point to minimal function
        log('Updating Lambda handler...');
        const updateHandler = 'aws lambda update-function-configuration --function-name "WordPressBlogStack-WordPressGraphQLC0771999-w2JlZknVchJN" --handler "index-minimal.handler" --region us-east-1';
        execSync(updateHandler);
        
        log('Deployment completed successfully', 'success');
        
        // Wait a moment and test
        log('Waiting for deployment to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        log('Testing the minimal function...');
        const testResult = execSync('node scripts/test-graphql-api.js', { encoding: 'utf8' });
        console.log(testResult);
        
        if (testResult.includes('Test Post')) {
            log('🎉 SUCCESS! Minimal Lambda function is working!', 'success');
            console.log('\nNext steps:');
            console.log('1. The API is now returning test data');
            console.log('2. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local');
            console.log('3. Test your frontend with: npm run dev');
            console.log('4. Replace with full function when ready');
        } else {
            log('Minimal function test failed', 'error');
        }
        
    } catch (error) {
        log(`Failed to deploy minimal function: ${error.message}`, 'error');
    }
}

deployMinimalFunction();