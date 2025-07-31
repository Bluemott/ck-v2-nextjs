#!/usr/bin/env node

/**
 * Fix Lambda Function Issues
 * Specifically targets the GraphQL Lambda 502 error
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

console.log('🔧 Lambda Function Issues Fix');
console.log('=============================\n');

const config = {
  region: 'us-east-1',
  graphqlUrl: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql',
  setupUrl: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/setup-database'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execAWS(command) {
  try {
    const result = execSync(command, { encoding: 'utf8', timeout: 15000 });
    return result.trim();
  } catch (error) {
    throw new Error(`AWS command failed: ${error.message}`);
  }
}

async function getGraphQLFunctionName() {
  log('Finding GraphQL Lambda function...');
  
  try {
    const functions = execAWS(`aws lambda list-functions --region ${config.region} --query "Functions[?contains(FunctionName, 'WordPressBlogStack') && contains(FunctionName, 'GraphQL')].FunctionName" --output text`);
    
    if (!functions) {
      throw new Error('No GraphQL Lambda function found');
    }
    
    // Get the most recent one (last in the list)
    const functionList = functions.split('\t').filter(f => f.trim());
    const functionName = functionList[functionList.length - 1];
    
    log(`Found GraphQL function: ${functionName}`, 'success');
    return functionName;
  } catch (error) {
    log(`Could not find GraphQL function: ${error.message}`, 'error');
    throw error;
  }
}

async function checkLambdaConfiguration(functionName) {
  log('Checking Lambda function configuration...');
  
  try {
    const lambdaConfig = execAWS(`aws lambda get-function-configuration --function-name "${functionName}" --region ${config.region} --query "{Runtime:Runtime,Handler:Handler,Timeout:Timeout,MemorySize:MemorySize,Environment:Environment,VpcConfig:VpcConfig}" --output json`);
    
    const parsed = JSON.parse(lambdaConfig);
    
    console.log('Current Lambda Configuration:');
    console.log(`- Runtime: ${parsed.Runtime}`);
    console.log(`- Handler: ${parsed.Handler}`);
    console.log(`- Timeout: ${parsed.Timeout}s`);
    console.log(`- Memory: ${parsed.MemorySize}MB`);
    
    if (parsed.VpcConfig && parsed.VpcConfig.VpcId) {
      console.log(`- VPC: ${parsed.VpcConfig.VpcId}`);
      console.log(`- Subnets: ${parsed.VpcConfig.SubnetIds.join(', ')}`);
      console.log(`- Security Groups: ${parsed.VpcConfig.SecurityGroupIds.join(', ')}`);
    }
    
    if (parsed.Environment && parsed.Environment.Variables) {
      console.log('- Environment Variables:');
      Object.keys(parsed.Environment.Variables).forEach(key => {
        const value = key.includes('PASSWORD') || key.includes('SECRET') ? '***' : parsed.Environment.Variables[key];
        console.log(`  ${key}: ${value}`);
      });
    }
    
    return parsed;
  } catch (error) {
    log(`Could not check Lambda configuration: ${error.message}`, 'error');
    throw error;
  }
}

async function getLambdaLogs(functionName) {
  log('Getting recent Lambda logs...');
  
  try {
    const logGroup = `/aws/lambda/${functionName}`;
    
    // Get the most recent log stream
    const streams = execAWS(`aws logs describe-log-streams --log-group-name "${logGroup}" --order-by LastEventTime --descending --max-items 1 --region ${config.region} --query "logStreams[0].logStreamName" --output text`);
    
    if (!streams || streams === 'None') {
      log('No recent log streams found', 'error');
      return null;
    }
    
    log(`Getting logs from stream: ${streams}`);
    
    // Get recent log events
    const events = execAWS(`aws logs get-log-events --log-group-name "${logGroup}" --log-stream-name "${streams}" --region ${config.region} --limit 10 --query "events[*].message" --output text`);
    
    if (events && events !== 'None') {
      console.log('\n📋 Recent Lambda Logs:');
      console.log('─'.repeat(50));
      const logLines = events.split('\t');
      logLines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`${index + 1}: ${line.trim()}`);
        }
      });
      console.log('─'.repeat(50));
      
      return events;
    } else {
      log('No recent log events found', 'error');
      return null;
    }
    
  } catch (error) {
    log(`Could not get Lambda logs: ${error.message}`, 'error');
    return null;
  }
}

async function testDatabaseConnection(functionName) {
  log('Testing database connection from Lambda...');
  
  try {
    // Invoke the Lambda function with a simple test
    const testPayload = {
      httpMethod: 'POST',
      path: '/graphql',
      body: JSON.stringify({
        query: '{ __typename }'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const result = execAWS(`aws lambda invoke --function-name "${functionName}" --payload '${JSON.stringify(testPayload)}' --region ${config.region} response.json && cat response.json`);
    
    if (fs.existsSync('response.json')) {
      const response = JSON.parse(fs.readFileSync('response.json', 'utf8'));
      fs.unlinkSync('response.json');
      
      console.log('Lambda Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.statusCode === 200) {
        log('Lambda function executed successfully', 'success');
        return true;
      } else {
        log(`Lambda returned error: ${response.statusCode}`, 'error');
        return false;
      }
    }
    
    return false;
  } catch (error) {
    log(`Could not test Lambda function: ${error.message}`, 'error');
    return false;
  }
}

async function suggestFixes(functionName, config, logs) {
  log('\n💡 Analyzing issues and suggesting fixes...');
  
  const suggestions = [];
  
  // Check for common issues
  if (!config.Environment || !config.Environment.Variables) {
    suggestions.push('❌ Missing environment variables - Lambda may not have database connection details');
  }
  
  if (config.Timeout < 30) {
    suggestions.push('❌ Timeout too low - increase to 30+ seconds for database operations');
  }
  
  if (config.MemorySize < 512) {
    suggestions.push('❌ Memory too low - increase to 512MB+ for GraphQL operations');
  }
  
  if (logs && logs.includes('ETIMEDOUT')) {
    suggestions.push('❌ Database connection timeout - check VPC configuration or database accessibility');
  }
  
  if (logs && logs.includes('connect ECONNREFUSED')) {
    suggestions.push('❌ Database connection refused - check security groups and database status');
  }
  
  if (logs && logs.includes('authentication failed')) {
    suggestions.push('❌ Database authentication failed - check credentials in environment variables');
  }
  
  if (logs && logs.includes('relation') && logs.includes('does not exist')) {
    suggestions.push('❌ Database tables missing - run database setup first');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('✅ Configuration looks correct - issue may be in the Lambda code itself');
    suggestions.push('🔧 Try redeploying the Lambda function with updated code');
  }
  
  console.log('\n🎯 Recommended Fixes:');
  console.log('='.repeat(40));
  suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion}`);
  });
  
  return suggestions;
}

async function attemptQuickFix(functionName) {
  log('\n🚀 Attempting quick fixes...');
  
  try {
    // Try to update the function timeout and memory
    log('Updating Lambda timeout and memory settings...');
    
    const updateResult = execAWS(`aws lambda update-function-configuration --function-name "${functionName}" --timeout 60 --memory-size 1024 --region ${config.region} --query "FunctionName" --output text`);
    
    if (updateResult) {
      log('Lambda configuration updated successfully', 'success');
      
      // Wait a moment for the update to take effect
      log('Waiting for configuration update...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test the GraphQL API again
      log('Testing GraphQL API after configuration update...');
      const testQuery = {
        query: '{ __typename }'
      };
      
      const response = await new Promise((resolve, reject) => {
        const postData = JSON.stringify(testQuery);
        const url = new URL(config.graphqlUrl);
        
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 15000
        };

        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', chunk => responseData += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(responseData) });
            } catch (e) {
              resolve({ status: res.statusCode, data: responseData });
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.abort();
          reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
      });
      
      if (response.status === 200) {
        log('🎉 GraphQL API is now working!', 'success');
        return true;
      } else {
        log(`GraphQL API still returning ${response.status}: ${JSON.stringify(response.data)}`, 'error');
        return false;
      }
    }
    
    return false;
  } catch (error) {
    log(`Quick fix failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  try {
    log('🚀 Starting Lambda function diagnostics and fixes...');
    
    // Step 1: Find the GraphQL function
    const functionName = await getGraphQLFunctionName();
    
    // Step 2: Check configuration
    const lambdaConfig = await checkLambdaConfiguration(functionName);
    
    // Step 3: Get recent logs
    const logs = await getLambdaLogs(functionName);
    
    // Step 4: Test the function directly
    await testDatabaseConnection(functionName);
    
    // Step 5: Analyze and suggest fixes
    const suggestions = await suggestFixes(functionName, lambdaConfig, logs);
    
    // Step 6: Attempt quick fix
    const quickFixWorked = await attemptQuickFix(functionName);
    
    if (quickFixWorked) {
      log('\n🎉 SUCCESS! WordPress API is now working!', 'success');
      console.log('\nNext steps:');
      console.log('1. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local');
      console.log('2. Test your frontend with: npm run dev');
      console.log('3. Import WordPress data if needed');
    } else {
      log('\n🔧 Quick fix did not resolve the issue', 'error');
      console.log('\nManual steps needed:');
      console.log('1. Check the detailed logs above for specific errors');
      console.log('2. Consider redeploying the Lambda function');
      console.log('3. Verify database schema is properly set up');
    }
    
  } catch (error) {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}