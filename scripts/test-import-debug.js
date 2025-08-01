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

// Test with a single post in the expected format
const testPost = {
  id: 123,
  date: '2025-01-25T00:00:00Z',
  date_gmt: '2025-01-25T00:00:00Z',
  modified: '2025-01-25T00:00:00Z',
  modified_gmt: '2025-01-25T00:00:00Z',
  slug: 'test-post',
  status: 'publish',
  type: 'post',
  link: 'https://cowboykimono.com/test-post/',
  title: {
    rendered: 'Test Post Title'
  },
  content: {
    rendered: 'This is a test post content.'
  },
  excerpt: {
    rendered: 'This is a test post excerpt.'
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
    rendered: 'https://cowboykimono.com/?p=123'
  },
  parent: 0,
  menu_order: 0,
  comment_count: 0,
  password: '',
  to_ping: '',
  pinged: '',
  post_content_filtered: '',
  post_mime_type: ''
};

const testCategory = {
  id: 1,
  count: 1,
  description: 'Test category description',
  link: 'https://cowboykimono.com/category/test-category/',
  name: 'Test Category',
  slug: 'test-category',
  taxonomy: 'category',
  parent: 0,
  meta: [],
  _links: {}
};

const testTag = {
  id: 1,
  count: 1,
  description: 'Test tag description',
  link: 'https://cowboykimono.com/tag/test-tag/',
  name: 'Test Tag',
  slug: 'test-tag',
  taxonomy: 'post_tag',
  meta: [],
  _links: {}
};

async function testImport() {
  console.log('🧪 Testing import function with single items...\n');
  
  const testData = {
    posts: [testPost],
    categories: [testCategory],
    tags: [testTag]
  };
  
  console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await makeRequest(IMPORT_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(testData)
    });

    console.log(`📊 Import Status: ${response.statusCode}`);
    console.log('📋 Import Response:', response.body);
    
    if (response.statusCode === 200) {
      console.log('✅ Import test completed');
    } else {
      console.log('❌ Import test failed');
    }
    
  } catch (error) {
    console.error('❌ Import test error:', error.message);
  }
}

testImport(); 