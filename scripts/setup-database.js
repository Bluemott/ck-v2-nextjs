const https = require('https');

const SETUP_ENDPOINT = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/setup-database';
const IMPORT_ENDPOINT = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
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

async function setupDatabase() {
  console.log('🔧 Setting up database...\n');
  
  try {
    const response = await makeRequest(SETUP_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        action: 'setup'
      })
    });

    console.log(`📊 Setup Status: ${response.statusCode}`);
    console.log('📋 Response:', response.body);
    
    if (response.statusCode === 200) {
      console.log('✅ Database setup completed successfully');
    } else {
      console.log('❌ Database setup failed');
    }
  } catch (error) {
    console.log('❌ Setup request failed:', error.message);
  }
}

async function importData() {
  console.log('\n📥 Importing WordPress data...\n');
  
  try {
    const response = await makeRequest(IMPORT_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        action: 'import',
        wordpressUrl: 'https://api.cowboykimono.com/graphql'
      })
    });

    console.log(`📊 Import Status: ${response.statusCode}`);
    console.log('📋 Response:', response.body);
    
    if (response.statusCode === 200) {
      console.log('✅ Data import completed successfully');
    } else {
      console.log('❌ Data import failed');
    }
  } catch (error) {
    console.log('❌ Import request failed:', error.message);
  }
}

async function checkDatabaseStatus() {
  console.log('\n🔍 Checking database status...\n');
  
  try {
    const response = await makeRequest(SETUP_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        action: 'status'
      })
    });

    console.log(`📊 Status Check: ${response.statusCode}`);
    console.log('📋 Response:', response.body);
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
}

async function runSetup() {
  console.log('🚀 Setting up AWS Infrastructure...\n');
  
  await setupDatabase();
  await checkDatabaseStatus();
  await importData();
  
  console.log('\n✅ Setup process completed!');
  console.log('\n🔧 Next Steps:');
  console.log('1. Test the GraphQL API again');
  console.log('2. Check if data was imported successfully');
  console.log('3. Verify the Lambda function is working');
}

runSetup().catch(console.error); 