const https = require('https');

// Configuration
const CONFIG = {
  apiDomain: 'https://api.cowboykimono.com',
  adminDomain: 'https://admin.cowboykimono.com'
};

// Test endpoints
const ENDPOINTS = {
  restApi: '/wp-json/',
  posts: '/wp-json/wp/v2/posts',
  categories: '/wp-json/wp/v2/categories',
  admin: '/wp-admin/',
  index: '/'
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'CowboyKimono-Diagnostic/1.0',
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
          headers: res.headers,
          data: data
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

async function testEndpoint(domain, endpoint, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    console.log(`   URL: ${domain}${endpoint}`);
    
    const response = await makeRequest(`${domain}${endpoint}`);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ SUCCESS: ${description} is working`);
      
      // Check if it's HTML (WordPress page) or JSON (REST API)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        console.log(`   📄 Response type: JSON (REST API)`);
        try {
          const jsonData = JSON.parse(response.data);
          if (Array.isArray(jsonData)) {
            console.log(`   📊 Found ${jsonData.length} items`);
          } else if (jsonData.routes) {
            console.log(`   🛣️  REST API routes available`);
          }
        } catch (e) {
          console.log(`   ⚠️  Response is not valid JSON`);
        }
      } else if (contentType.includes('text/html')) {
        console.log(`   📄 Response type: HTML (WordPress page)`);
        if (response.data.includes('WordPress')) {
          console.log(`   🎯 WordPress installation detected`);
        }
      }
    } else if (response.statusCode === 404) {
      console.log(`   ❌ ERROR: ${description} not found (404)`);
    } else if (response.statusCode === 301 || response.statusCode === 302) {
      console.log(`   🔄 REDIRECT: ${description} redirecting`);
      const location = response.headers.location;
      if (location) {
        console.log(`   ➡️  Redirects to: ${location}`);
      }
    } else {
      console.log(`   ⚠️  WARNING: Unexpected status ${response.statusCode}`);
    }
    
    return response;
  } catch (error) {
    console.log(`   💥 ERROR: ${error.message}`);
    return null;
  }
}

async function diagnoseWordPress() {
  console.log('🚀 WordPress REST API Diagnostic Tool');
  console.log('=====================================');
  
  // Test basic WordPress installation
  await testEndpoint(CONFIG.apiDomain, ENDPOINTS.index, 'WordPress Homepage');
  await testEndpoint(CONFIG.adminDomain, ENDPOINTS.admin, 'WordPress Admin');
  
  // Test REST API endpoints
  await testEndpoint(CONFIG.apiDomain, ENDPOINTS.restApi, 'REST API Base');
  await testEndpoint(CONFIG.apiDomain, ENDPOINTS.posts, 'REST API Posts');
  await testEndpoint(CONFIG.apiDomain, ENDPOINTS.categories, 'REST API Categories');
  
  console.log('\n📋 Summary & Recommendations:');
  console.log('==============================');
  console.log('');
  console.log('If REST API endpoints return 404:');
  console.log('1. Access WordPress admin at: https://admin.cowboykimono.com/wp-admin/');
  console.log('2. Go to Settings > Permalinks');
  console.log('3. Select "Post name" or "Custom Structure"');
  console.log('4. Save changes');
  console.log('');
  console.log('If admin redirects or shows errors:');
  console.log('1. Check if WordPress is properly installed');
  console.log('2. Verify database connection');
  console.log('3. Check .htaccess file exists and is writable');
  console.log('');
  console.log('If REST API is still not working:');
  console.log('1. Check if any security plugins are blocking REST API');
  console.log('2. Verify mod_rewrite is enabled in Apache');
  console.log('3. Check WordPress .htaccess file');
  console.log('');
}

async function checkHtaccess() {
  console.log('\n🔧 Checking .htaccess configuration...');
  
  try {
    const response = await makeRequest(`${CONFIG.apiDomain}/.htaccess`);
    if (response.statusCode === 200) {
      console.log('✅ .htaccess file is accessible');
      if (response.data.includes('RewriteEngine On')) {
        console.log('✅ mod_rewrite rules found');
      } else {
        console.log('⚠️  No mod_rewrite rules found in .htaccess');
      }
    } else {
      console.log('❌ .htaccess file not accessible or not found');
    }
  } catch (error) {
    console.log('❌ Cannot access .htaccess file');
  }
}

async function main() {
  try {
    await diagnoseWordPress();
    await checkHtaccess();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open https://admin.cowboykimono.com/wp-admin/ in your browser');
    console.log('2. Log in to WordPress admin');
    console.log('3. Go to Settings > Permalinks');
    console.log('4. Change from "Plain" to "Post name"');
    console.log('5. Save changes');
    console.log('6. Test the REST API again');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testEndpoint,
  diagnoseWordPress,
  checkHtaccess
}; 