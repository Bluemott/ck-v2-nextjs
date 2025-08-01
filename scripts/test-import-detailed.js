const https = require('https');

const IMPORT_ENDPOINT = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
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

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
          headers: res.headers
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

// Test with minimal data to isolate the issue
const minimalTestData = {
  posts: [
    {
      id: 999,
      date: '2025-01-25T00:00:00Z',
      date_gmt: '2025-01-25T00:00:00Z',
      modified: '2025-01-25T00:00:00Z',
      modified_gmt: '2025-01-25T00:00:00Z',
      slug: 'debug-test-post',
      status: 'publish',
      type: 'post',
      link: 'https://cowboykimono.com/debug-test-post/',
      title: {
        rendered: 'Debug Test Post'
      },
      content: {
        rendered: 'This is a debug test post.'
      },
      excerpt: {
        rendered: 'Debug test excerpt.'
      },
      author: 1,
      comment_status: 'open',
      ping_status: 'open',
      sticky: false,
      template: '',
      format: 'standard',
      meta: [],
      _links: {},
      guid: {
        rendered: 'https://cowboykimono.com/?p=999'
      },
      parent: 0,
      menu_order: 0,
      comment_count: 0,
      password: '',
      to_ping: '',
      pinged: '',
      post_content_filtered: '',
      post_mime_type: ''
    }
  ],
  categories: [
    {
      id: 999,
      count: 1,
      description: 'Debug test category',
      link: 'https://cowboykimono.com/category/debug-test/',
      name: 'Debug Test Category',
      slug: 'debug-test',
      taxonomy: 'category',
      parent: 0,
      meta: [],
      _links: {}
    }
  ],
  tags: [
    {
      id: 999,
      count: 1,
      description: 'Debug test tag',
      link: 'https://cowboykimono.com/tag/debug-test/',
      name: 'Debug Test Tag',
      slug: 'debug-test',
      taxonomy: 'post_tag',
      meta: [],
      _links: {}
    }
  ]
};

async function testDetailedImport() {
  console.log('🔍 Detailed import test with minimal data...\n');
  
  console.log('📤 Sending test data structure:');
  console.log(JSON.stringify(minimalTestData, null, 2));
  
  try {
    const response = await makeRequest(IMPORT_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(minimalTestData)
    });

    console.log(`\n📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('📋 Response Body:', response.body);
    
    if (response.statusCode === 200) {
      const responseData = JSON.parse(response.body);
      console.log('\n✅ Import completed with response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.summary) {
        console.log('\n📊 Import Summary:');
        console.log(`   Posts: ${responseData.summary.posts}`);
        console.log(`   Categories: ${responseData.summary.categories}`);
        console.log(`   Tags: ${responseData.summary.tags}`);
      }
    } else {
      console.log('\n❌ Import failed with status:', response.statusCode);
    }
    
  } catch (error) {
    console.error('\n❌ Import test error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testDetailedImport(); 