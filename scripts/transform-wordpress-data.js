const https = require('https');

// Configuration
const CONFIG = {
  wordpressGraphQL: 'https://api.cowboykimono.com/graphql',
  importEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data'
};

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

// WordPress GraphQL queries
const QUERIES = {
  posts: `
    query {
      posts(first: 100) {
        nodes {
          id
          title
          slug
          date
          modified
          content
          excerpt
          status
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
              description
            }
          }
          tags {
            nodes {
              id
              name
              slug
              description
            }
          }
          featuredImage {
            node {
              id
              sourceUrl
              altText
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

// Transform GraphQL data to REST API format
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
    // Store original GraphQL data
    wordpress_data: graphqlPost
  };
}

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
    // Store original GraphQL data
    wordpress_data: graphqlCategory
  };
}

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
    // Store original GraphQL data
    wordpress_data: graphqlTag
  };
}

async function fetchAndTransformWordPressData() {
  console.log('🔍 Fetching and transforming WordPress data...');
  
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
        data.posts = postsData.data.posts.nodes.map(transformPostData);
        console.log(`✅ Transformed ${data.posts.length} posts`);
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
        data.categories = categoriesData.data.categories.nodes.map(transformCategoryData);
        console.log(`✅ Transformed ${data.categories.length} categories`);
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
        data.tags = tagsData.data.tags.nodes.map(transformTagData);
        console.log(`✅ Transformed ${data.tags.length} tags`);
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching WordPress data:', error.message);
    throw error;
  }
}

async function importDataToAWS(wordpressData) {
  console.log('📤 Importing transformed data to AWS...');
  
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
    console.log('🚀 Starting WordPress data transformation and import...\n');
    
    // Step 1: Fetch and transform WordPress data
    const wordpressData = await fetchAndTransformWordPressData();
    
    console.log('\n📊 Transformed Data Summary:');
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