import { Client } from 'pg';

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

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
  // First connect to default postgres database
  const postgresConfig = { ...dbConfig, database: 'postgres' };
  const postgresClient = new Client(postgresConfig);
  
  try {
    console.log('🔌 Connecting to default postgres database...');
    await postgresClient.connect();
    
    // Check if wordpress database exists
    const result = await postgresClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'wordpress'"
    );
    
    if (result.rows.length === 0) {
      console.log('📝 Creating wordpress database...');
      await postgresClient.query('CREATE DATABASE wordpress');
      console.log('✅ Database "wordpress" created successfully');
    } else {
      console.log('ℹ️  Database "wordpress" already exists');
    }
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await postgresClient.end();
  }
}

// Create WordPress tables
async function createTables(client) {
  console.log('🏗️  Creating WordPress tables...');
  
  // Drop existing tables if they exist
  const dropTablesSQL = `
    DROP TABLE IF EXISTS wp_tags CASCADE;
    DROP TABLE IF EXISTS wp_categories CASCADE;
    DROP TABLE IF EXISTS wp_posts CASCADE;
  `;
  
  await client.query(dropTablesSQL);
  console.log('🗑️  Dropped existing tables');
  
  const createTablesSQL = `
    -- Create wp_posts table
    CREATE TABLE wp_posts (
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
      wordpress_id INTEGER UNIQUE,
      wordpress_data JSONB
    );

    -- Create wp_categories table
    CREATE TABLE wp_categories (
      id SERIAL PRIMARY KEY,
      cat_ID INTEGER UNIQUE,
      cat_name VARCHAR(200),
      category_nicename VARCHAR(200),
      category_description TEXT,
      wordpress_data JSONB
    );

    -- Create wp_tags table
    CREATE TABLE wp_tags (
      id SERIAL PRIMARY KEY,
      tag_ID INTEGER UNIQUE,
      tag_name VARCHAR(200),
      tag_slug VARCHAR(200),
      tag_description TEXT,
      wordpress_data JSONB
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
      ON CONFLICT (wordpress_id) DO UPDATE SET
        post_title = EXCLUDED.post_title,
        post_content = EXCLUDED.post_content,
        post_excerpt = EXCLUDED.post_excerpt,
        post_status = EXCLUDED.post_status,
        post_modified = EXCLUDED.post_modified,
        wordpress_data = EXCLUDED.wordpress_data
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

// Main Lambda handler
export const handler = async (event) => {
  try {
    // Create database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Now connect to the wordpress database
    const client = new Client(dbConfig);
    
    console.log('🔌 Connecting to wordpress database...');
    await client.connect();
    console.log('✅ Connected to wordpress database');
    
    // Parse the WordPress data from the event
    const posts = event.posts || [];
    const categories = event.categories || [];
    const tags = event.tags || [];
    
    console.log(`📊 Processing data:`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tags: ${tags.length}`);
    
    // Create tables
    await createTables(client);
    
    // Import data
    if (posts.length > 0) {
      await importPosts(client, posts);
    }
    
    if (categories.length > 0) {
      await importCategories(client, categories);
    }
    
    if (tags.length > 0) {
      await importTags(client, tags);
    }
    
    // Verify import
    const postCount = await client.query('SELECT COUNT(*) FROM wp_posts');
    const categoryCount = await client.query('SELECT COUNT(*) FROM wp_categories');
    const tagCount = await client.query('SELECT COUNT(*) FROM wp_tags');
    
    const result = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Import completed successfully',
        summary: {
          posts: parseInt(postCount.rows[0].count),
          categories: parseInt(categoryCount.rows[0].count),
          tags: parseInt(tagCount.rows[0].count)
        }
      })
    };
    
    console.log('🎉 Import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Posts: ${postCount.rows[0].count}`);
    console.log(`   Categories: ${categoryCount.rows[0].count}`);
    console.log(`   Tags: ${tagCount.rows[0].count}`);
    
    await client.end();
    return result;
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
}; 