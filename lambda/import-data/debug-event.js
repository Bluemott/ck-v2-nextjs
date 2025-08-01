const { Client } = require('pg');

exports.handler = async (event) => {
  console.log('🔍 DEBUG: Full event received:', JSON.stringify(event, null, 2));
  
  try {
    // Aurora database configuration from environment variables
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 5432,
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    console.log('🔌 Database config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
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
    
    if (posts.length > 0) {
      console.log('📝 First post sample:', JSON.stringify(posts[0], null, 2));
    }
    
    if (categories.length > 0) {
      console.log('📂 First category sample:', JSON.stringify(categories[0], null, 2));
    }
    
    if (tags.length > 0) {
      console.log('🏷️  First tag sample:', JSON.stringify(tags[0], null, 2));
    }
    
    // Test creating a simple table
    console.log('🏗️  Creating test table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_import (
        id SERIAL PRIMARY KEY,
        data_type VARCHAR(50),
        data_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert test data
    console.log('📝 Inserting test data...');
    await client.query(`
      INSERT INTO test_import (data_type, data_count) VALUES ($1, $2)
    `, ['posts', posts.length]);
    
    await client.query(`
      INSERT INTO test_import (data_type, data_count) VALUES ($1, $2)
    `, ['categories', categories.length]);
    
    await client.query(`
      INSERT INTO test_import (data_type, data_count) VALUES ($1, $2)
    `, ['tags', tags.length]);
    
    // Check what was inserted
    const testResult = await client.query('SELECT * FROM test_import ORDER BY created_at DESC LIMIT 3');
    console.log('📊 Test data inserted:', testResult.rows);
    
    await client.end();
    
    const result = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Debug completed successfully',
        eventData: {
          posts: posts.length,
          categories: categories.length,
          tags: tags.length
        },
        testData: testResult.rows
      })
    };
    
    console.log('🎉 Debug completed successfully!');
    return result;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: error.message || String(error),
        stack: error.stack
      })
    };
  }
}; 