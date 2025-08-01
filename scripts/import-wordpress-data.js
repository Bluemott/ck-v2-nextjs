const https = require('https');

// Configuration
const CONFIG = {
  wordpressRest: 'https://api.cowboykimono.com',
  importEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data'
};

// REST API endpoints
const ENDPOINTS = {
  posts: '/wp-json/wp/v2/posts',
  categories: '/wp-json/wp/v2/categories',
  tags: '/wp-json/wp/v2/tags'
};

// Transform REST API post data to database format
function transformPostData(restPost) {
  return {
    id: restPost.id,
    date: restPost.date,
    date_gmt: restPost.date_gmt,
    modified: restPost.modified,
    modified_gmt: restPost.modified_gmt,
    slug: restPost.slug,
    status: restPost.status || 'publish',
    type: 'post',
    link: restPost.link,
    title: restPost.title,
    content: restPost.content,
    excerpt: restPost.excerpt,
    author: restPost.author,
    comment_status: restPost.comment_status || 'open',
    ping_status: restPost.ping_status || 'open',
    sticky: restPost.sticky || false,
    template: restPost.template || '',
    format: restPost.format || 'standard',
    meta: restPost.meta || [],
    _links: restPost._links || {},
    guid: restPost.guid,
    parent: restPost.parent || 0,
    menu_order: restPost.menu_order || 0,
    comment_count: restPost.comment_count || 0,
    password: restPost.password || '',
    to_ping: restPost.to_ping || '',
    pinged: restPost.pinged || '',
    post_content_filtered: restPost.post_content_filtered || '',
    post_mime_type: restPost.post_mime_type || '',
    wordpress_data: restPost
  };
}

// Transform REST API category data to database format
function transformCategoryData(restCategory) {
  return {
    id: restCategory.id,
    count: restCategory.count || 0,
    description: restCategory.description || '',
    link: restCategory.link,
    name: restCategory.name,
    slug: restCategory.slug,
    taxonomy: 'category',
    parent: restCategory.parent || 0,
    meta: restCategory.meta || [],
    _links: restCategory._links || {},
    wordpress_data: restCategory
  };
}

// Transform REST API tag data to database format
function transformTagData(restTag) {
  return {
    id: restTag.id,
    count: restTag.count || 0,
    description: restTag.description || '',
    link: restTag.link,
    name: restTag.name,
    slug: restTag.slug,
    taxonomy: 'post_tag',
    meta: restTag.meta || [],
    _links: restTag._links || {},
    wordpress_data: restTag
  };
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CowboyKimono-Import/1.0',
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

async function fetchWordPressData() {
  console.log('🔍 Fetching WordPress data via REST API...');
  
  const data = {
    posts: [],
    categories: [],
    tags: []
  };

  try {
    // Fetch posts
    console.log('📝 Fetching posts...');
    const postsResponse = await makeRequest(`${CONFIG.wordpressRest}${ENDPOINTS.posts}?per_page=100&_embed`);

    if (postsResponse.statusCode === 200) {
      const postsData = JSON.parse(postsResponse.body);
      console.log(`✅ Found ${postsData.length} posts`);
      
      // Transform REST API data to database format
      data.posts = postsData.map(transformPostData);
    } else {
      console.error(`❌ Failed to fetch posts: ${postsResponse.statusCode}`);
    }

    // Fetch categories
    console.log('📂 Fetching categories...');
    const categoriesResponse = await makeRequest(`${CONFIG.wordpressRest}${ENDPOINTS.categories}?per_page=100`);

    if (categoriesResponse.statusCode === 200) {
      const categoriesData = JSON.parse(categoriesResponse.body);
      console.log(`✅ Found ${categoriesData.length} categories`);
      
      // Transform REST API data to database format
      data.categories = categoriesData.map(transformCategoryData);
    } else {
      console.error(`❌ Failed to fetch categories: ${categoriesResponse.statusCode}`);
    }

    // Fetch tags
    console.log('🏷️ Fetching tags...');
    const tagsResponse = await makeRequest(`${CONFIG.wordpressRest}${ENDPOINTS.tags}?per_page=100`);

    if (tagsResponse.statusCode === 200) {
      const tagsData = JSON.parse(tagsResponse.body);
      console.log(`✅ Found ${tagsData.length} tags`);
      
      // Transform REST API data to database format
      data.tags = tagsData.map(transformTagData);
    } else {
      console.error(`❌ Failed to fetch tags: ${tagsResponse.statusCode}`);
    }

  } catch (error) {
    console.error('❌ Error fetching WordPress data:', error.message);
    throw error;
  }

  return data;
}

async function importDataToAWS(wordpressData) {
  console.log('🚀 Importing data to AWS...');
  
  try {
    const response = await makeRequest(CONFIG.importEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'import',
        wordpressUrl: CONFIG.wordpressRest,
        data: wordpressData
      })
    });

    console.log(`📊 Import response status: ${response.statusCode}`);
    console.log('📋 Import response body:', response.body);

    if (response.statusCode === 200) {
      console.log('✅ Data imported successfully!');
    } else {
      console.error('❌ Failed to import data');
    }

    return response;
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting WordPress data import...');
    
    // Fetch data from WordPress REST API
    const wordpressData = await fetchWordPressData();
    
    if (wordpressData.posts.length === 0) {
      console.log('❌ No posts found - check WordPress REST API');
      console.log(`🔍 Test URL: ${CONFIG.wordpressRest}${ENDPOINTS.posts}`);
      return;
    }
    
    console.log(`📊 Summary:`);
    console.log(`   Posts: ${wordpressData.posts.length}`);
    console.log(`   Categories: ${wordpressData.categories.length}`);
    console.log(`   Tags: ${wordpressData.tags.length}`);
    
    // Import to AWS
    await importDataToAWS(wordpressData);
    
    console.log('\n✅ Import process completed!');
    console.log('\n🔧 Next Steps:');
    console.log('1. Test the REST API endpoints');
    console.log('2. Check if data was imported successfully');
    console.log('3. Verify the Lambda function is working');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchWordPressData, importDataToAWS }; 