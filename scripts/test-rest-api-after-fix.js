const https = require('https');

async function testRestAPI() {
  console.log('🧪 Testing REST API after permalinks fix...\n');
  
  const endpoints = [
    { url: 'https://api.cowboykimono.com/wp-json/', name: 'REST API Base' },
    { url: 'https://api.cowboykimono.com/wp-json/wp/v2/posts', name: 'Posts Endpoint' },
    { url: 'https://api.cowboykimono.com/wp-json/wp/v2/categories', name: 'Categories Endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await new Promise((resolve, reject) => {
        const url = new URL(endpoint.url);
        const req = https.request({
          hostname: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: 'GET',
          headers: {
            'User-Agent': 'CowboyKimono-Test/1.0'
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.end();
      });
      
      if (response.statusCode === 200) {
        console.log(`   ✅ SUCCESS (${response.statusCode})`);
        
        try {
          const jsonData = JSON.parse(response.data);
          if (Array.isArray(jsonData)) {
            console.log(`   📊 Found ${jsonData.length} items`);
            if (jsonData.length > 0) {
              console.log(`   📝 First item: ${jsonData[0].title?.rendered || jsonData[0].name || 'N/A'}`);
            }
          } else if (jsonData.routes) {
            console.log(`   🛣️  REST API routes available`);
            console.log(`   📋 Available routes: ${Object.keys(jsonData.routes).slice(0, 5).join(', ')}...`);
          }
        } catch (e) {
          console.log(`   ⚠️  Response is not JSON: ${response.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ FAILED (${response.statusCode})`);
        console.log(`   📄 Response: ${response.data.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 If all endpoints return 200, your REST API is working!');
  console.log('🚀 Your Next.js app should now be able to fetch content.');
}

testRestAPI(); 