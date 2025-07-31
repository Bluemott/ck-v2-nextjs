#!/usr/bin/env node

/**
 * Clean Development Setup Script
 * Simplifies the WordPress API setup for development testing
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

console.log('🧹 Clean Development Setup for WordPress API');
console.log('===========================================\n');

const config = {
  graphqlUrl: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql',
  setupUrl: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/setup-database',
  importUrl: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data',
  region: 'us-east-1'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testLambdaFunctionLogs() {
  log('Checking Lambda function logs...');
  
  try {
    const result = execSync(`aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/WordPressBlogStack" --region ${config.region} --query "logGroups[?contains(logGroupName, 'GraphQL')].logGroupName" --output text`, 
      { encoding: 'utf8', timeout: 10000 });
    
    if (result.trim()) {
      log(`Found GraphQL Lambda log group: ${result.trim()}`, 'success');
      
      // Get recent log events
      const logGroup = result.trim();
      try {
        const streams = execSync(`aws logs describe-log-streams --log-group-name "${logGroup}" --order-by LastEventTime --descending --max-items 1 --region ${config.region} --query "logStreams[0].logStreamName" --output text`, 
          { encoding: 'utf8', timeout: 10000 });
        
        if (streams.trim() && streams.trim() !== 'None') {
          log(`Getting recent logs from stream: ${streams.trim()}`);
          const events = execSync(`aws logs get-log-events --log-group-name "${logGroup}" --log-stream-name "${streams.trim()}" --region ${config.region} --limit 5 --query "events[*].message" --output text`, 
            { encoding: 'utf8', timeout: 10000 });
          
          if (events.trim()) {
            log('Recent Lambda errors:', 'error');
            console.log(events);
          }
        }
      } catch (streamError) {
        log(`Could not fetch log streams: ${streamError.message}`, 'error');
      }
    }
  } catch (error) {
    log(`Could not check Lambda logs: ${error.message}`, 'error');
  }
}

async function testDatabaseSetup() {
  log('Testing database setup endpoint...');
  
  try {
    const response = await makeRequest(config.setupUrl, { action: 'test' });
    log(`Database setup response (${response.status}):`, response.status === 200 ? 'success' : 'error');
    console.log(JSON.stringify(response.data, null, 2));
    return response.status === 200;
  } catch (error) {
    log(`Database setup test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testGraphQLAPI() {
  log('Testing GraphQL API...');
  
  const testQuery = {
    query: `{
      __typename
    }`
  };
  
  try {
    const response = await makeRequest(config.graphqlUrl, testQuery);
    log(`GraphQL API response (${response.status}):`, response.status === 200 ? 'success' : 'error');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && !response.data.message) {
      // Test a real query
      const postsQuery = {
        query: `{
          posts(first: 1) {
            nodes {
              id
              title
            }
          }
        }`
      };
      
      const postsResponse = await makeRequest(config.graphqlUrl, postsQuery);
      log(`Posts query response (${postsResponse.status}):`, postsResponse.status === 200 ? 'success' : 'error');
      console.log(JSON.stringify(postsResponse.data, null, 2));
      
      return postsResponse.status === 200 && postsResponse.data.data;
    }
    
    return false;
  } catch (error) {
    log(`GraphQL API test failed: ${error.message}`, 'error');
    return false;
  }
}

async function checkInfrastructureStatus() {
  log('Checking AWS infrastructure status...');
  
  try {
    // Check Aurora cluster
    const aurora = execSync(`aws rds describe-db-clusters --db-cluster-identifier wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93 --region ${config.region} --query "DBClusters[0].Status" --output text`, 
      { encoding: 'utf8', timeout: 10000 });
    log(`Aurora cluster status: ${aurora.trim()}`, aurora.trim() === 'available' ? 'success' : 'error');
    
    // Check Lambda functions
    const lambdas = execSync(`aws lambda list-functions --region ${config.region} --query "Functions[?contains(FunctionName, 'WordPressBlogStack')].FunctionName" --output text`, 
      { encoding: 'utf8', timeout: 10000 });
    log(`Lambda functions found: ${lambdas.trim().split('\t').length}`, 'success');
    
    return true;
  } catch (error) {
    log(`Infrastructure check failed: ${error.message}`, 'error');
    return false;
  }
}

async function generateDiagnosticReport() {
  const report = {
    timestamp: new Date().toISOString(),
    infrastructure: await checkInfrastructureStatus(),
    databaseSetup: await testDatabaseSetup(),
    graphqlAPI: await testGraphQLAPI(),
    recommendations: []
  };
  
  // Generate recommendations based on test results
  if (!report.infrastructure) {
    report.recommendations.push('❌ Infrastructure issues detected - check AWS resources');
  }
  
  if (!report.databaseSetup) {
    report.recommendations.push('❌ Database setup failing - check Aurora connectivity and Lambda environment variables');
  }
  
  if (!report.graphqlAPI) {
    report.recommendations.push('❌ GraphQL API not working - likely database connection issue in Lambda');
  }
  
  if (report.databaseSetup && report.graphqlAPI) {
    report.recommendations.push('✅ All systems working - ready to import data');
  } else if (report.infrastructure) {
    report.recommendations.push('🔧 Infrastructure deployed but APIs need fixing');
  }
  
  const reportFile = `diagnostic-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`\n📊 Diagnostic Report Generated: ${reportFile}`, 'success');
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY:');
  console.log('='.repeat(50));
  report.recommendations.forEach(rec => console.log(rec));
  
  return report;
}

async function main() {
  try {
    log('🚀 Starting clean development setup...');
    
    // Run comprehensive diagnostics
    await testLambdaFunctionLogs();
    const report = await generateDiagnosticReport();
    
    if (report.graphqlAPI) {
      log('\n🎉 WordPress API is working! You can now:', 'success');
      console.log('1. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local');
      console.log('2. Test the frontend with: npm run dev');
      console.log('3. Import more data if needed');
    } else {
      log('\n🔧 Next steps to fix the issues:', 'error');
      if (!report.databaseSetup) {
        console.log('1. Check Aurora database connectivity');
        console.log('2. Verify Lambda function environment variables');
        console.log('3. Check security group settings');
      }
      console.log('4. Run: node scripts/fix-lambda-issues.js (creating this next)');
    }
    
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { config, makeRequest, log };