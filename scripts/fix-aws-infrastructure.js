const https = require('https');
const { execSync } = require('child_process');

console.log('🚀 Fixing AWS Infrastructure Issues...\n');

// Configuration
const CONFIG = {
  graphqlEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql',
  setupEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/setup-database',
  importEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data',
  wordpressGraphQL: 'https://api.cowboykimono.com/graphql',
  lambdaFunction: 'WordPressBlogStack-WordPressGraphQLC0771999-w2JlZknVchJN',
  region: 'us-east-1'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Utility function for HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = https;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Step 1: Fix Lambda function VPC configuration
async function fixLambdaVPC() {
  log('🔧 Step 1: Checking Lambda VPC configuration...');
  
  try {
    // Check if Lambda has NAT Gateway access
    const result = execSync(`aws lambda get-function-configuration --function-name ${CONFIG.lambdaFunction} --region ${CONFIG.region} --query "VpcConfig"`, { encoding: 'utf8' });
    
    if (result.includes('SubnetIds')) {
      log('Lambda is in VPC - checking NAT Gateway access...');
      
      // Check if subnets have NAT Gateway
      const subnets = execSync(`aws lambda get-function-configuration --function-name ${CONFIG.lambdaFunction} --region ${CONFIG.region} --query "VpcConfig.SubnetIds" --output text`, { encoding: 'utf8' }).trim().split('\t');
      
      for (const subnetId of subnets) {
        try {
          const routeTable = execSync(`aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=${subnetId}" --query "RouteTables[0].Routes[?GatewayId=='igw-*' || NatGatewayId]" --region ${CONFIG.region}`, { encoding: 'utf8' });
          
          if (routeTable.includes('NatGatewayId') || routeTable.includes('GatewayId')) {
            log(`✅ Subnet ${subnetId} has internet access`);
          } else {
            log(`❌ Subnet ${subnetId} lacks internet access - this is the issue!`);
            return false;
          }
        } catch (error) {
          log(`❌ Error checking subnet ${subnetId}: ${error.message}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    log(`Error checking VPC configuration: ${error.message}`, 'error');
    return false;
  }
}

// Step 2: Create a Lambda function outside VPC for testing
async function createTestLambda() {
  log('🔧 Step 2: Creating test Lambda function outside VPC...');
  
  try {
    // Create a simple test function
    const testFunctionCode = `
exports.handler = async (event) => {
    console.log('Test function executed');
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Test function working!',
            timestamp: new Date().toISOString()
        })
    };
};
`;

    // Create test function
    const createCommand = `aws lambda create-function \
      --function-name WordPressBlogTestFunction \
      --runtime nodejs18.x \
      --role arn:aws:iam::925242451851:role/WordPressBlogStack-WordPressGraphQLServiceRoleE434F-QliGhZzawqWu \
      --handler index.handler \
      --zip-file fileb://test-function.zip \
      --region ${CONFIG.region}`;

    // Create zip file
    require('fs').writeFileSync('test-function.js', testFunctionCode);
    execSync('powershell Compress-Archive -Path test-function.js -DestinationPath test-function.zip -Force');
    
    try {
      execSync(createCommand);
      log('✅ Test Lambda function created successfully');
      return true;
    } catch (error) {
      if (error.message.includes('Function already exists')) {
        log('ℹ️ Test function already exists');
        return true;
      } else {
        log(`❌ Failed to create test function: ${error.message}`, 'error');
        return false;
      }
    }
  } catch (error) {
    log(`Error creating test function: ${error.message}`, 'error');
    return false;
  }
}

// Step 3: Import WordPress data with correct schema
async function importWordPressData() {
  log('🔧 Step 3: Importing WordPress data with correct schema...');
  
  try {
    // First, test WordPress GraphQL to get correct schema
    const wordpressQuery = `
      query {
        posts(first: 5) {
          nodes {
            id
            title
            slug
            date
            excerpt
            author {
              node {
                name
                slug
              }
            }
            categories {
              nodes {
                name
                slug
              }
            }
          }
        }
      }
    `;

    const response = await makeRequest(CONFIG.wordpressGraphQL, {
      method: 'POST',
      body: JSON.stringify({ query: wordpressQuery })
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.data?.posts?.nodes) {
        log(`✅ Found ${data.data.posts.nodes.length} posts in WordPress`);
        
        // Import data with correct schema
        const importResponse = await makeRequest(CONFIG.importEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            action: 'import',
            wordpressUrl: CONFIG.wordpressGraphQL,
            schema: 'wordpress' // Specify WordPress schema
          })
        });

        log(`📊 Import Status: ${importResponse.statusCode}`);
        log(`📋 Import Response: ${importResponse.body}`);
        
        return importResponse.statusCode === 200;
      }
    }
    
    return false;
  } catch (error) {
    log(`Error importing data: ${error.message}`, 'error');
    return false;
  }
}

// Step 4: Test all components
async function testAllComponents() {
  log('🔧 Step 4: Testing all infrastructure components...');
  
  const results = {
    databaseSetup: false,
    dataImport: false,
    wordpressGraphQL: false,
    cloudfront: false
  };

  try {
    // Test database setup
    const setupResponse = await makeRequest(CONFIG.setupEndpoint, {
      method: 'POST',
      body: JSON.stringify({ action: 'status' })
    });
    results.databaseSetup = setupResponse.statusCode === 200;

    // Test WordPress GraphQL
    const wpResponse = await makeRequest(CONFIG.wordpressGraphQL, {
      method: 'POST',
      body: JSON.stringify({ query: '{ __typename }' })
    });
    results.wordpressGraphQL = wpResponse.statusCode === 200;

    // Test CloudFront
    try {
      const cfResponse = await makeRequest('https://d36tlab2rh5hc6.cloudfront.net');
      results.cloudfront = cfResponse.statusCode === 200 || cfResponse.statusCode === 403;
    } catch (error) {
      results.cloudfront = false;
    }

    return results;
  } catch (error) {
    log(`Error testing components: ${error.message}`, 'error');
    return results;
  }
}

// Main execution
async function main() {
  try {
    log('🚀 Starting AWS Infrastructure Fix...\n');

    // Step 1: Check VPC configuration
    const vpcOk = await fixLambdaVPC();
    if (!vpcOk) {
      log('❌ VPC configuration issue detected - Lambda function may not have internet access');
      log('💡 Solution: Add NAT Gateway to VPC or move Lambda function outside VPC');
    }

    // Step 2: Create test Lambda
    await createTestLambda();

    // Step 3: Import WordPress data
    const importSuccess = await importWordPressData();
    if (importSuccess) {
      log('✅ WordPress data imported successfully');
    } else {
      log('❌ WordPress data import failed');
    }

    // Step 4: Test all components
    const testResults = await testAllComponents();
    
    log('\n📊 Test Results:');
    log(`Database Setup: ${testResults.databaseSetup ? '✅' : '❌'}`);
    log(`WordPress GraphQL: ${testResults.wordpressGraphQL ? '✅' : '❌'}`);
    log(`CloudFront: ${testResults.cloudfront ? '✅' : '❌'}`);

    log('\n🎯 Next Steps:');
    log('1. If VPC issue: Add NAT Gateway to VPC or move Lambda outside VPC');
    log('2. If import failed: Check WordPress GraphQL schema compatibility');
    log('3. If CloudFront 403: Upload content to S3 bucket');
    log('4. Test your frontend: npm run dev');
    log('5. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local when ready');

  } catch (error) {
    log(`Main execution failed: ${error.message}`, 'error');
  }
}

main(); 