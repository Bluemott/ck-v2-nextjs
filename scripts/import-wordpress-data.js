const https = require('https');

// Configuration
const CONFIG = {
  wordpressGraphQL: 'https://api.cowboykimono.com/graphql',
  importEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data'
};

// GraphQL queries
const QUERIES = {
  posts: `
    query {
      posts(first: 100) {
        nodes {
          id
          databaseId
          date
          modified
          slug
          status
          title
          content
          excerpt
          author {
            node {
              id
              name
              slug
            }
          }
          categories {
            nodes {
              id
              name
              slug
            }
          }
          tags {
            nodes {
              id
              name
              slug
            }
          }
        }
      }
    }
  `,
  categories: `
    query {
      categories(first: 50) {
        nodes {
          id
          name
          slug
          description
          count
        }
      }
    }
  `,
  tags: `
    query {
      tags(first: 50) {
        nodes {
          id
          name
          slug
          description
          count
        }
      }
    }
  `
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

// Transform GraphQL post data to REST API format
function transformPostData(graphqlPost) {
  return {
    id: parseInt(graphqlPost.id.replace('post-', '')),
    date: graphqlPost.date,
    date_gmt: graphqlPost.date,
    modified: graphqlPost.modified,
    modified_gmt: graphqlPost.modified,
    slug: graphqlPost.slug,
    status: graphqlPost.status || 'publish',
    type: 'post',
    link: `https://cowboykimono.com/${graphqlPost.slug}/`,
    title: {
      rendered: graphqlPost.title
    },
    content: {
      rendered: graphqlPost.content || ''
    },
    excerpt: {
      rendered: graphqlPost.excerpt || ''
    },
    author: graphqlPost.author?.node?.id ? parseInt(graphqlPost.author.node.id.replace('user-', '')) : 1,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    meta: [],
    _links: {},
    guid: {
      rendered: `https://cowboykimono.com/?p=${graphqlPost.id.replace('post-', '')}`
    },
    parent: 0,
    menu_order: 0,
    comment_count: 0,
    password: '',
    to_ping: '',
    pinged: '',
    post_content_filtered: '',
    post_mime_type: '',
    wordpress_data: graphqlPost
  };
}

// Transform GraphQL category data to REST API format
function transformCategoryData(graphqlCategory) {
  return {
    id: parseInt(graphqlCategory.id.replace('category-', '')),
    count: graphqlCategory.count || 0,
    description: graphqlCategory.description || '',
    link: `https://cowboykimono.com/category/${graphqlCategory.slug}/`,
    name: graphqlCategory.name,
    slug: graphqlCategory.slug,
    taxonomy: 'category',
    parent: 0,
    meta: [],
    _links: {},
    wordpress_data: graphqlCategory
  };
}

// Transform GraphQL tag data to REST API format
function transformTagData(graphqlTag) {
  return {
    id: parseInt(graphqlTag.id.replace('tag-', '')),
    count: graphqlTag.count || 0,
    description: graphqlTag.description || '',
    link: `https://cowboykimono.com/tag/${graphqlTag.slug}/`,
    name: graphqlTag.name,
    slug: graphqlTag.slug,
    taxonomy: 'post_tag',
    meta: [],
    _links: {},
    wordpress_data: graphqlTag
  };
}

async function fetchWordPressData() {
  console.log('🔍 Fetching WordPress data...');
  
  const data = {
    posts: [],
    categories: [],
    tags: []
  };

  try {
    // Fetch posts
    console.log('📝 Fetching posts...');
    const postsResponse = await makeRequest(CONFIG.wordpressGraphQL, {
      method: 'POST',
      body: JSON.stringify({ query: QUERIES.posts })
    });

    if (postsResponse.statusCode === 200) {
      const postsData = JSON.parse(postsResponse.body);
      if (postsData.data?.posts?.nodes) {
        // Transform GraphQL data to REST API format
        data.posts = postsData.data.posts.nodes.map(transformPostData);
        console.log(`✅ Found ${data.posts.length} posts`);
      }
    }

    // Fetch categories
    console.log('📂 Fetching categories...');
    const categoriesResponse = await makeRequest(CONFIG.wordpressGraphQL, {
      method: 'POST',
      body: JSON.stringify({ query: QUERIES.categories })
    });

    if (categoriesResponse.statusCode === 200) {
      const categoriesData = JSON.parse(categoriesResponse.body);
      if (categoriesData.data?.categories?.nodes) {
        // Transform GraphQL data to REST API format
        data.categories = categoriesData.data.categories.nodes.map(transformCategoryData);
        console.log(`✅ Found ${data.categories.length} categories`);
      }
    }

    // Fetch tags
    console.log('🏷️ Fetching tags...');
    const tagsResponse = await makeRequest(CONFIG.wordpressGraphQL, {
      method: 'POST',
      body: JSON.stringify({ query: QUERIES.tags })
    });

    if (tagsResponse.statusCode === 200) {
      const tagsData = JSON.parse(tagsResponse.body);
      if (tagsData.data?.tags?.nodes) {
        // Transform GraphQL data to REST API format
        data.tags = tagsData.data.tags.nodes.map(transformTagData);
        console.log(`✅ Found ${data.tags.length} tags`);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching WordPress data:', error.message);
    throw error;
  }
}

async function importDataToAWS(wordpressData) {
  console.log('📤 Importing data to AWS...');
  
  try {
    const response = await makeRequest(CONFIG.importEndpoint, {
      method: 'POST',
      body: JSON.stringify(wordpressData)
    });

    console.log(`📊 Import Status: ${response.statusCode}`);
    console.log('📋 Import Response:', response.body);
    
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting WordPress data import process...\n');
    
    // Step 1: Fetch WordPress data
    const wordpressData = await fetchWordPressData();
    
    console.log('\n📊 WordPress Data Summary:');
    console.log(`   Posts: ${wordpressData.posts.length}`);
    console.log(`   Categories: ${wordpressData.categories.length}`);
    console.log(`   Tags: ${wordpressData.tags.length}`);
    
    if (wordpressData.posts.length === 0) {
      console.log('❌ No posts found - check WordPress GraphQL API');
      return;
    }
    
    // Step 2: Import to AWS
    const importSuccess = await importDataToAWS(wordpressData);
    
    if (importSuccess) {
      console.log('\n✅ WordPress data imported successfully!');
      console.log('\n🎯 Next Steps:');
      console.log('1. Test the AWS GraphQL API');
      console.log('2. Set NEXT_PUBLIC_USE_AWS_GRAPHQL=true in .env.local');
      console.log('3. Test your frontend: npm run dev');
    } else {
      console.log('\n❌ Import failed - check AWS Lambda logs');
    }
    
  } catch (error) {
    console.error('❌ Import process failed:', error.message);
  }
}

main(); 