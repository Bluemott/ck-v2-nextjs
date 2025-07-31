#!/usr/bin/env node

/**
 * WordPress Data Import Script
 * Imports exported WordPress data into Aurora PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

console.log('📥 WordPress Data Import Script');
console.log('================================\n');

// Aurora database configuration
const dbConfig = {
  host: 'wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  user: 'postgres',
  password: 'kcSgEFyE-1uqQqep9-g01-j5Y-VmvA',
  database: 'wordpress',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

// Import directory
const importDir = './wordpress-export';

// Helper function to read JSON file
function readJsonFile(filename) {
  const filepath = path.join(importDir, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Create WordPress tables
async function createTables(client) {
  console.log('🏗️  Creating WordPress tables...');
  
  const createTablesSQL = `
    -- Create wp_posts table
    CREATE TABLE IF NOT EXISTS wp_posts (
      id SERIAL PRIMARY KEY,
      post_author BIGINT DEFAULT 0,
      post_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      post_date_gmt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      post_content TEXT,
      post_title TEXT,
      post_excerpt TEXT,
      post_status VARCHAR(20) DEFAULT 'publish',
      comment_status VARCHAR(20) DEFAULT 'open',
      ping_status VARCHAR(20) DEFAULT 'open',
      post_password VARCHAR(255) DEFAULT '',
      post_name VARCHAR(200) DEFAULT '',
      to_ping TEXT,
      pinged TEXT,
      post_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      post_modified_gmt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      post_content_filtered TEXT,
      post_parent BIGINT DEFAULT 0,
      guid VARCHAR(255) DEFAULT '',
      menu_order INTEGER DEFAULT 0,
      post_type VARCHAR(20) DEFAULT 'post',
      post_mime_type VARCHAR(100) DEFAULT '',
      comment_count BIGINT DEFAULT 0,
      slug VARCHAR(200),
      wordpress_id INTEGER,
      wordpress_data JSONB
    );

    -- Create wp_categories table
    CREATE TABLE IF NOT EXISTS wp_categories (
      id SERIAL PRIMARY KEY,
      cat_ID INTEGER,
      cat_name VARCHAR(200),
      category_nicename VARCHAR(200),
      category_description TEXT,
      wordpress_data JSONB
    );

    -- Create wp_tags table
    CREATE TABLE IF NOT EXISTS wp_tags (
      id SERIAL PRIMARY KEY,
      tag_ID INTEGER,
      tag_name VARCHAR(200),
      tag_slug VARCHAR(200),
      tag_description TEXT,
      wordpress_data JSONB
    );

    -- Create wp_postmeta table
    CREATE TABLE IF NOT EXISTS wp_postmeta (
      meta_id SERIAL PRIMARY KEY,
      post_id BIGINT,
      meta_key VARCHAR(255),
      meta_value TEXT
    );

    -- Create wp_term_relationships table
    CREATE TABLE IF NOT EXISTS wp_term_relationships (
      object_id BIGINT,
      term_taxonomy_id BIGINT,
      term_order INTEGER DEFAULT 0
    );

    -- Create wp_terms table
    CREATE TABLE IF NOT EXISTS wp_terms (
      term_id SERIAL PRIMARY KEY,
      name VARCHAR(200),
      slug VARCHAR(200),
      term_group BIGINT DEFAULT 0
    );

    -- Create wp_term_taxonomy table
    CREATE TABLE IF NOT EXISTS wp_term_taxonomy (
      term_taxonomy_id SERIAL PRIMARY KEY,
      term_id BIGINT,
      taxonomy VARCHAR(32),
      description TEXT,
      parent BIGINT DEFAULT 0,
      count BIGINT DEFAULT 0
    );
  `;
  
  await client.query(createTablesSQL);
  console.log('✅ Tables created successfully');
}

// Import posts
async function importPosts(client, posts) {
  console.log(`📝 Importing ${posts.length} posts...`);
  
  for (const post of posts) {
    const insertSQL = `
      INSERT INTO wp_posts (
        post_author, post_date, post_date_gmt, post_content, post_title,
        post_excerpt, post_status, comment_status, ping_status,
        post_password, post_name, to_ping, pinged, post_modified,
        post_modified_gmt, post_content_filtered, post_parent, guid,
        menu_order, post_type, post_mime_type, comment_count, slug,
        wordpress_id, wordpress_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
    `;
    
    const values = [
      post.author || 1,
      new Date(post.date),
      new Date(post.date_gmt),
      post.content?.rendered || '',
      post.title?.rendered || '',
      post.excerpt?.rendered || '',
      post.status || 'publish',
      post.comment_status || 'open',
      post.ping_status || 'open',
      post.password || '',
      post.slug || '',
      '',
      '',
      new Date(post.modified),
      new Date(post.modified_gmt),
      '',
      post.parent || 0,
      post.guid?.rendered || '',
      0,
      post.type || 'post',
      '',
      post.comment_count || 0,
      post.slug || '',
      post.id,
      JSON.stringify(post)
    ];
    
    await client.query(insertSQL, values);
  }
  
  console.log('✅ Posts imported successfully');
}

// Import categories
async function importCategories(client, categories) {
  console.log(`📂 Importing ${categories.length} categories...`);
  
  for (const category of categories) {
    // Insert into wp_terms
    const termSQL = `
      INSERT INTO wp_terms (name, slug, term_group)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING term_id
    `;
    
    const termResult = await client.query(termSQL, [
      category.name,
      category.slug,
      0
    ]);
    
    const termId = termResult.rows[0].term_id;
    
    // Insert into wp_term_taxonomy
    const taxonomySQL = `
      INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (term_id, taxonomy) DO UPDATE SET
        description = EXCLUDED.description,
        parent = EXCLUDED.parent,
        count = EXCLUDED.count
    `;
    
    await client.query(taxonomySQL, [
      termId,
      'category',
      category.description || '',
      category.parent || 0,
      category.count || 0
    ]);
    
    // Insert into wp_categories
    const categorySQL = `
      INSERT INTO wp_categories (cat_ID, cat_name, category_nicename, category_description, wordpress_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cat_ID) DO UPDATE SET
        cat_name = EXCLUDED.cat_name,
        category_nicename = EXCLUDED.category_nicename,
        category_description = EXCLUDED.category_description,
        wordpress_data = EXCLUDED.wordpress_data
    `;
    
    await client.query(categorySQL, [
      category.id,
      category.name,
      category.slug,
      category.description || '',
      JSON.stringify(category)
    ]);
  }
  
  console.log('✅ Categories imported successfully');
}

// Import tags
async function importTags(client, tags) {
  console.log(`🏷️  Importing ${tags.length} tags...`);
  
  for (const tag of tags) {
    // Insert into wp_terms
    const termSQL = `
      INSERT INTO wp_terms (name, slug, term_group)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING term_id
    `;
    
    const termResult = await client.query(termSQL, [
      tag.name,
      tag.slug,
      0
    ]);
    
    const termId = termResult.rows[0].term_id;
    
    // Insert into wp_term_taxonomy
    const taxonomySQL = `
      INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (term_id, taxonomy) DO UPDATE SET
        description = EXCLUDED.description,
        parent = EXCLUDED.parent,
        count = EXCLUDED.count
    `;
    
    await client.query(taxonomySQL, [
      termId,
      'post_tag',
      tag.description || '',
      0,
      tag.count || 0
    ]);
    
    // Insert into wp_tags
    const tagSQL = `
      INSERT INTO wp_tags (tag_ID, tag_name, tag_slug, tag_description, wordpress_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tag_ID) DO UPDATE SET
        tag_name = EXCLUDED.tag_name,
        tag_slug = EXCLUDED.tag_slug,
        tag_description = EXCLUDED.tag_description,
        wordpress_data = EXCLUDED.wordpress_data
    `;
    
    await client.query(tagSQL, [
      tag.id,
      tag.name,
      tag.slug,
      tag.description || '',
      JSON.stringify(tag)
    ]);
  }
  
  console.log('✅ Tags imported successfully');
}

// Main import function
async function importWordPressData() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to Aurora database...');
    await client.connect();
    console.log('✅ Connected to Aurora database');
    
    // Read exported data
    console.log('📖 Reading exported data...');
    const posts = readJsonFile('posts.json');
    const categories = readJsonFile('categories.json');
    const tags = readJsonFile('tags.json');
    
    // Create tables
    await createTables(client);
    
    // Import data
    await importPosts(client, posts);
    await importCategories(client, categories);
    await importTags(client, tags);
    
    // Verify import
    const postCount = await client.query('SELECT COUNT(*) FROM wp_posts');
    const categoryCount = await client.query('SELECT COUNT(*) FROM wp_categories');
    const tagCount = await client.query('SELECT COUNT(*) FROM wp_tags');
    
    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Posts: ${postCount.rows[0].count}`);
    console.log(`   Categories: ${categoryCount.rows[0].count}`);
    console.log(`   Tags: ${tagCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the import
importWordPressData(); 