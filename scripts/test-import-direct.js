const https = require('https');

// Configuration
const CONFIG = {
  importEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data'
};

// Utility function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
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

async function testImport() {
  console.log('🧪 Testing import function with simple data...');
  
  // Create a simple test payload
  const testData = {
    posts: [
      {
        id: 1,
        date: '2025-07-31T00:00:00Z',
        date_gmt: '2025-07-31T00:00:00Z',
        modified: '2025-07-31T00:00:00Z',
        modified_gmt: '2025-07-31T00:00:00Z',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://cowboykimono.com/test-post/',
        title: {
          rendered: 'Test Post'
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
          rendered: 'https://cowboykimono.com/?p=1'
        },
        parent: 0,
        menu_order: 0,
        comment_count: 0,
        password: '',
        to_ping: '',
        pinged: '',
        post_content_filtered: '',
        post_mime_type: '',
        wordpress_data: {
          id: 'post-1',
          title: 'Test Post',
          content: 'This is a test post content.'
        }
      }
    ],
    categories: [
      {
        id: 1,
        count: 1,
        description: 'A test category',
        link: 'https://cowboykimono.com/category/test-category/',
        name: 'Test Category',
        slug: 'test-category',
        taxonomy: 'category',
        parent: 0,
        meta: [],
        _links: {},
        wordpress_data: {
          id: 'category-1',
          name: 'Test Category',
          slug: 'test-category'
        }
      }
    ],
    tags: [
      {
        id: 1,
        count: 1,
        description: 'A test tag',
        link: 'https://cowboykimono.com/tag/test-tag/',
        name: 'Test Tag',
        slug: 'test-tag',
        taxonomy: 'post_tag',
        meta: [],
        _links: {},
        wordpress_data: {
          id: 'tag-1',
          name: 'Test Tag',
          slug: 'test-tag'
        }
      }
    ]
  };

  try {
    console.log('📤 Sending test data to import function...');
    console.log('📊 Test data summary:');
    console.log(`   Posts: ${testData.posts.length}`);
    console.log(`   Categories: ${testData.categories.length}`);
    console.log(`   Tags: ${testData.tags.length}`);
    
    const response = await makeRequest(CONFIG.importEndpoint, {
      method: 'POST',
      body: JSON.stringify(testData)
    });

    console.log(`📊 Import Status: ${response.statusCode}`);
    console.log('📋 Import Response:', response.body);
    
    if (response.statusCode === 200) {
      console.log('✅ Import test successful!');
    } else {
      console.log('❌ Import test failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing import:', error.message);
  }
}

testImport(); 