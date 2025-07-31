#!/usr/bin/env node

/**
 * WordPress Data Export Script
 * Exports WordPress data via REST API instead of direct MySQL access
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('📤 WordPress Data Export Script');
console.log('================================\n');

// Configuration
const config = {
  wordpressUrl: 'https://api.cowboykimono.com',
  outputDir: './wordpress-export',
  maxPosts: 1000, // Adjust as needed
  batchSize: 20
};

// Create output directory
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Export posts
async function exportPosts() {
  console.log('📝 Exporting posts...');
  
  const posts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && posts.length < config.maxPosts) {
    try {
      const url = `${config.wordpressUrl}/wp-json/wp/v2/posts?page=${page}&per_page=${config.batchSize}&_embed`;
      console.log(`  Fetching page ${page}...`);
      
      const response = await makeRequest(url);
      
      if (response.length === 0) {
        hasMore = false;
      } else {
        posts.push(...response);
        page++;
      }
    } catch (error) {
      console.error(`❌ Error fetching posts page ${page}:`, error.message);
      break;
    }
  }
  
  console.log(`✅ Exported ${posts.length} posts`);
  return posts;
}

// Export categories
async function exportCategories() {
  console.log('📂 Exporting categories...');
  
  try {
    const url = `${config.wordpressUrl}/wp-json/wp/v2/categories?per_page=100`;
    const categories = await makeRequest(url);
    console.log(`✅ Exported ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    return [];
  }
}

// Export tags
async function exportTags() {
  console.log('🏷️  Exporting tags...');
  
  try {
    const url = `${config.wordpressUrl}/wp-json/wp/v2/tags?per_page=100`;
    const tags = await makeRequest(url);
    console.log(`✅ Exported ${tags.length} tags`);
    return tags;
  } catch (error) {
    console.error('❌ Error fetching tags:', error.message);
    return [];
  }
}

// Export pages
async function exportPages() {
  console.log('📄 Exporting pages...');
  
  try {
    const url = `${config.wordpressUrl}/wp-json/wp/v2/pages?per_page=100&_embed`;
    const pages = await makeRequest(url);
    console.log(`✅ Exported ${pages.length} pages`);
    return pages;
  } catch (error) {
    console.error('❌ Error fetching pages:', error.message);
    return [];
  }
}

// Save data to files
function saveData(data, filename) {
  const filepath = path.join(config.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved to ${filepath}`);
}

// Main export function
async function exportWordPressData() {
  console.log('🚀 Starting WordPress data export...\n');
  
  try {
    // Export all data types
    const [posts, categories, tags, pages] = await Promise.all([
      exportPosts(),
      exportCategories(),
      exportTags(),
      exportPages()
    ]);
    
    // Save data to files
    saveData(posts, 'posts.json');
    saveData(categories, 'categories.json');
    saveData(tags, 'tags.json');
    saveData(pages, 'pages.json');
    
    // Create summary
    const summary = {
      exportDate: new Date().toISOString(),
      totalPosts: posts.length,
      totalCategories: categories.length,
      totalTags: tags.length,
      totalPages: pages.length,
      wordpressUrl: config.wordpressUrl
    };
    
    saveData(summary, 'export-summary.json');
    
    console.log('\n🎉 Export completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tags: ${tags.length}`);
    console.log(`   Pages: ${pages.length}`);
    console.log(`\n📁 Data saved to: ${config.outputDir}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export
exportWordPressData(); 