const { Client } = require('pg');

// Aurora database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'kcSgEFyE-1uqQqep9-g01-j5Y-VmvA',
  database: process.env.DB_NAME || 'wordpress',
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pooling settings for Lambda
  max: 1, // Single connection per Lambda instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Create database if it doesn't exist
async function createDatabaseIfNotExists() {
  const postgresConfig = { ...dbConfig, database: 'postgres' };
  const postgresClient = new Client(postgresConfig);
  
  try {
    console.log('🔌 Connecting to default postgres database...');
    await postgresClient.connect();
    
    // Check if wordpress database exists
    const result = await postgresClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );
    
    if (result.rows.length === 0) {
      console.log(`📝 Creating ${dbConfig.database} database...`);
      await postgresClient.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`✅ Database "${dbConfig.database}" created successfully`);
    } else {
      console.log(`ℹ️  Database "${dbConfig.database}" already exists`);
    }
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await postgresClient.end();
  }
}

// Create WordPress tables with proper constraints and indexes
async function createTables(client) {
  console.log('🏗️  Creating WordPress tables...');
  
  // Drop existing tables if they exist
  const dropTablesSQL = `
    DROP TABLE IF EXISTS wp_post_categories CASCADE;
    DROP TABLE IF EXISTS wp_post_tags CASCADE;
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
      wordpress_id INTEGER UNIQUE NOT NULL,
      wordpress_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create wp_categories table
    CREATE TABLE wp_categories (
      id SERIAL PRIMARY KEY,
      cat_ID INTEGER UNIQUE NOT NULL,
      cat_name VARCHAR(200),
      category_nicename VARCHAR(200),
      category_description TEXT,
      wordpress_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create wp_tags table
    CREATE TABLE wp_tags (
      id SERIAL PRIMARY KEY,
      tag_ID INTEGER UNIQUE NOT NULL,
      tag_name VARCHAR(200),
      tag_slug VARCHAR(200),
      tag_description TEXT,
      wordpress_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX idx_wp_posts_wordpress_id ON wp_posts(wordpress_id);
    CREATE INDEX idx_wp_posts_slug ON wp_posts(slug);
    CREATE INDEX idx_wp_posts_status ON wp_posts(post_status);
    CREATE INDEX idx_wp_posts_type ON wp_posts(post_type);
    CREATE INDEX idx_wp_posts_date ON wp_posts(post_date);
    
    CREATE INDEX idx_wp_categories_cat_id ON wp_categories(cat_ID);
    CREATE INDEX idx_wp_categories_nicename ON wp_categories(category_nicename);
    
    CREATE INDEX idx_wp_tags_tag_id ON wp_tags(tag_ID);
    CREATE INDEX idx_wp_tags_slug ON wp_tags(tag_slug);
  `;
  
  await client.query(createTablesSQL);
  console.log('✅ Tables created successfully');
}

// Batch insert posts for better performance
async function importPosts(client, posts) {
  if (!posts || posts.length === 0) {
    console.log('📝 No posts to import');
    return;
  }

  console.log(`📝 Importing ${posts.length} posts...`);
  
  // Process in batches to avoid memory issues
  const BATCH_SIZE = 50;
  let imported = 0;
  
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    
    for (const post of batch) {
      try {
        const insertSQL = `
          INSERT INTO wp_posts (
            post_author, post_date, post_date_gmt, post_content, post_title,
            post_excerpt, post_status, comment_status, ping_status,
            post_password, post_name, to_ping, pinged, post_modified,
            post_modified_gmt, post_content_filtered, post_parent, guid,
            menu_order, post_type, post_mime_type, comment_count, slug,
            wordpress_id, wordpress_data, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
          ON CONFLICT (wordpress_id) DO UPDATE SET
            post_title = EXCLUDED.post_title,
            post_content = EXCLUDED.post_content,
            post_excerpt = EXCLUDED.post_excerpt,
            post_status = EXCLUDED.post_status,
            post_modified = EXCLUDED.post_modified,
            wordpress_data = EXCLUDED.wordpress_data,
            updated_at = CURRENT_TIMESTAMP
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
          JSON.stringify(post),
          new Date()
        ];
        
        await client.query(insertSQL, values);
        imported++;
        
      } catch (error) {
        console.error(`❌ Error importing post ${post.id}:`, error.message);
        // Continue with other posts
      }
    }
    
    console.log(`📊 Imported ${imported}/${posts.length} posts`);
  }
  
  console.log(`✅ Posts import completed: ${imported} posts`);
}

// Import categories
async function importCategories(client, categories) {
  if (!categories || categories.length === 0) {
    console.log('📂 No categories to import');
    return;
  }

  console.log(`📂 Importing ${categories.length} categories...`);
  
  let imported = 0;
  for (const category of categories) {
    try {
      const categorySQL = `
        INSERT INTO wp_categories (cat_ID, cat_name, category_nicename, category_description, wordpress_data, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (cat_ID) DO UPDATE SET
          cat_name = EXCLUDED.cat_name,
          category_nicename = EXCLUDED.category_nicename,
          category_description = EXCLUDED.category_description,
          wordpress_data = EXCLUDED.wordpress_data,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await client.query(categorySQL, [
        category.id,
        category.name,
        category.slug,
        category.description || '',
        JSON.stringify(category),
        new Date()
      ]);
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing category ${category.id}:`, error.message);
    }
  }
  
  console.log(`✅ Categories import completed: ${imported} categories`);
}

// Import tags
async function importTags(client, tags) {
  if (!tags || tags.length === 0) {
    console.log('🏷️  No tags to import');
    return;
  }

  console.log(`🏷️  Importing ${tags.length} tags...`);
  
  let imported = 0;
  for (const tag of tags) {
    try {
      const tagSQL = `
        INSERT INTO wp_tags (tag_ID, tag_name, tag_slug, tag_description, wordpress_data, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tag_ID) DO UPDATE SET
          tag_name = EXCLUDED.tag_name,
          tag_slug = EXCLUDED.tag_slug,
          tag_description = EXCLUDED.tag_description,
          wordpress_data = EXCLUDED.wordpress_data,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await client.query(tagSQL, [
        tag.id,
        tag.name,
        tag.slug,
        tag.description || '',
        JSON.stringify(tag),
        new Date()
      ]);
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing tag ${tag.id}:`, error.message);
    }
  }
  
  console.log(`✅ Tags import completed: ${imported} tags`);
}

// Main Lambda handler with proper error handling and logging
exports.handler = async (event) => {
  let client;
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting WordPress data import...');
    console.log('📊 Event data:', JSON.stringify({
      posts: event.posts?.length || 0,
      categories: event.categories?.length || 0,
      tags: event.tags?.length || 0
    }));
    
    // Create database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Connect to the wordpress database
    client = new Client(dbConfig);
    console.log('🔌 Connecting to WordPress database...');
    await client.connect();
    console.log('✅ Connected to WordPress database');
    
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
    
    // Import data in order (categories/tags first, then posts)
    if (categories.length > 0) {
      await importCategories(client, categories);
    }
    
    if (tags.length > 0) {
      await importTags(client, tags);
    }
    
    if (posts.length > 0) {
      await importPosts(client, posts);
    }
    
    // Verify import
    const postCount = await client.query('SELECT COUNT(*) FROM wp_posts');
    const categoryCount = await client.query('SELECT COUNT(*) FROM wp_categories');
    const tagCount = await client.query('SELECT COUNT(*) FROM wp_tags');
    
    const duration = Date.now() - startTime;
    const summary = {
      posts: parseInt(postCount.rows[0].count),
      categories: parseInt(categoryCount.rows[0].count),
      tags: parseInt(tagCount.rows[0].count),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 Import completed successfully!');
    console.log(`📊 Summary:`, summary);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        message: 'Import completed successfully',
        summary
      })
    };
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    const duration = Date.now() - startTime;
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        error: error.message,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })
    };
  } finally {
    if (client) {
      try {
        await client.end();
        console.log('🔌 Database connection closed');
      } catch (error) {
        console.error('❌ Error closing database connection:', error.message);
      }
    }
  }
};