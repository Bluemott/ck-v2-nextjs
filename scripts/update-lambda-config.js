const { execSync } = require('child_process');

// Database connection details from outputs.json
const DB_CONFIG = {
  host: 'wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  port: '5432',
  database: 'wordpress_blog',
  user: 'admin',
  password: 'your-database-password' // This should be set via AWS Secrets Manager
};

// Lambda function configuration
const LAMBDA_CONFIG = {
  functionName: 'WordPressBlogStack-WordPressGraphQLC0771999-w2JlZknVchJN',
  region: 'us-east-1'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function updateLambdaEnvironment() {
  log('Updating Lambda function environment variables...');
  
  try {
    // Create environment variables JSON
    const environmentVars = {
      Variables: {
        DB_HOST: DB_CONFIG.host,
        DB_PORT: DB_CONFIG.port,
        DB_NAME: DB_CONFIG.database,
        DB_USER: DB_CONFIG.user,
        DB_PASSWORD: DB_CONFIG.password,
        NODE_ENV: 'production'
      }
    };

    const envJson = JSON.stringify(environmentVars);
    
    // Update Lambda function configuration
    const command = `aws lambda update-function-configuration \
      --function-name "${LAMBDA_CONFIG.functionName}" \
      --environment '${envJson}' \
      --region ${LAMBDA_CONFIG.region}`;
    
    const result = execSync(command, { encoding: 'utf8' });
    
    if (result.includes('LastModified')) {
      log('Lambda environment variables updated successfully', 'success');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Failed to update Lambda environment: ${error.message}`, 'error');
    return false;
  }
}

async function redeployLambda() {
  log('Redeploying Lambda function...');
  
  try {
    // Change to lambda/graphql directory
    process.chdir('./lambda/graphql');
    
    // Run the deployment script
    const result = execSync('node deploy-lambda.js', { encoding: 'utf8' });
    
    log('Lambda function redeployed successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to redeploy Lambda: ${error.message}`, 'error');
    return false;
  }
}

async function testGraphQLAfterUpdate() {
  log('Testing GraphQL API after update...');
  
  try {
    // Wait for deployment to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const testUrl = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';
    const testQuery = { 
      query: '{ posts(first: 1) { nodes { id title slug } } }' 
    };
    
    const curlCommand = `curl -X POST "${testUrl}" -H "Content-Type: application/json" -d '${JSON.stringify(testQuery)}' --max-time 10`;
    
    const response = execSync(curlCommand, { encoding: 'utf8' });
    
    console.log('Test Response:', response);
    
    if (response.includes('200') || response.includes('data')) {
      log('GraphQL API is now working!', 'success');
      return true;
    } else {
      log('GraphQL API still has issues', 'error');
      return false;
    }
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  try {
    log('🚀 Updating Lambda function configuration...');
    
    // Step 1: Update environment variables
    const envUpdated = await updateLambdaEnvironment();
    if (!envUpdated) {
      throw new Error('Failed to update environment variables');
    }
    
    // Step 2: Redeploy Lambda function
    const redeployed = await redeployLambda();
    if (!redeployed) {
      throw new Error('Failed to redeploy Lambda function');
    }
    
    // Step 3: Test the GraphQL API
    const testPassed = await testGraphQLAfterUpdate();
    
    if (testPassed) {
      log('\n🎉 SUCCESS! AWS GraphQL API is now working!', 'success');
      console.log('\nNext steps:');
      console.log('1. Import WordPress data: node scripts/setup-database.js');
      console.log('2. Test your frontend: npm run dev');
      console.log('3. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local');
    } else {
      log('\n🔧 Configuration updated but API still needs work', 'error');
      console.log('Check CloudWatch logs for more details');
    }
    
  } catch (error) {
    log(`Update failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

main(); 