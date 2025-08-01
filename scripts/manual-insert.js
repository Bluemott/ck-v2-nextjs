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

async function manualInsert() {
  console.log('🔧 Manually inserting test data...');
  
  // Create test data in the exact format expected by the import function
  const testData = {
    posts: [
      {
        id: 123,
        date: '2025-07-31T12:00:00Z',
        date_gmt: '2025-07-31T12:00:00Z',
        modified: '2025-07-31T12:00:00Z',
        modified_gmt: '2025-07-31T12:00:00Z',
        slug: 'manual-test-post',
        status: 'publish',
        type: 'post',
        link: 'https://cowboykimono.com/manual-test-post/',
        title: {
          rendered: 'Manual Test Post'
        },
        content: {
          rendered: 'This is a manually inserted test post to verify the import process.'
        },
        excerpt: {
          rendered: 'A test post for manual insertion.'
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
        post_mime_type: '',
        wordpress_data: {
          id: 'post-123',
          title: 'Manual Test Post',
          content: 'This is a manually inserted test post to verify the import process.',
          author: 1,
          categories: [1],
          tags: [1]
        }
      }
    ],
    categories: [
      {
        id: 1,
        count: 1,
        description: 'A manually inserted test category',
        link: 'https://cowboykimono.com/category/manual-test-category/',
        name: 'Manual Test Category',
        slug: 'manual-test-category',
        taxonomy: 'category',
        parent: 0,
        meta: [],
        _links: {},
        wordpress_data: {
          id: 'category-1',
          name: 'Manual Test Category',
          slug: 'manual-test-category'
        }
      }
    ],
    tags: [
      {
        id: 1,
        count: 1,
        description: 'A manually inserted test tag',
        link: 'https://cowboykimono.com/tag/manual-test-tag/',
        name: 'Manual Test Tag',
        slug: 'manual-test-tag',
        taxonomy: 'post_tag',
        meta: [],
        _links: {},
        wordpress_data: {
          id: 'tag-1',
          name: 'Manual Test Tag',
          slug: 'manual-test-tag'
        }
      }
    ]
  };

  try {
    console.log('📤 Sending manual test data to import function...');
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
      console.log('✅ Manual insert successful!');
      
          // Test the REST API to see if the data is accessible
    console.log('\n🧪 Testing REST API with new data...');
    await testRestAPIWithNewData();
    } else {
      console.log('❌ Manual insert failed!');
    }
    
  } catch (error) {
    console.error('❌ Error with manual insert:', error.message);
  }
}

async function testRestAPIWithNewData() {
  const restEndpoint = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/';
  
  const testQuery = {
    query: `
      query {
        posts(first: 5) {
          nodes {
            id
            title
            slug
          }
        }
      }
    `
  };

  try {
    const response = await makeRequest(`${restEndpoint}posts`, {
      method: 'GET'
    });

    console.log(`📊 REST API Response Status: ${response.statusCode}`);
    console.log('📋 REST API Response Body:', response.body);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.posts && data.posts.length > 0) {
        console.log(`✅ Found ${data.posts.length} posts in REST API`);
        data.posts.forEach((post, index) => {
          console.log(`   ${index + 1}. ${post.title?.rendered || post.title} (${post.slug})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing REST API:', error.message);
  }
}

manualInsert(); 