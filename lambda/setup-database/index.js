const { Client } = require('pg');

// Aurora database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres', // Connect to default postgres database first
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

exports.handler = async (event) => {
  let client;
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting database setup (v2)...');
    
    client = new Client(dbConfig);
    
    console.log('🔌 Connecting to Aurora database...');
    await client.connect();
    console.log('✅ Connected to Aurora database');
    
    // Create the wordpress database
    console.log('📝 Creating wordpress database...');
    await client.query('CREATE DATABASE wordpress');
    console.log('✅ Database "wordpress" created successfully');
    
    // Create wordpress_user
    console.log('👤 Creating wordpress_user...');
    await client.query("CREATE USER wordpress_user WITH PASSWORD 'temp_password'");
    console.log('✅ User "wordpress_user" created successfully');
    
    // Grant privileges
    console.log('🔐 Granting privileges...');
    await client.query('GRANT ALL PRIVILEGES ON DATABASE wordpress TO wordpress_user');
    console.log('✅ Privileges granted successfully');
    
    await client.end();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Database setup completed successfully'
      })
    };
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️ Database or user already exists, continuing...');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          message: 'Database setup completed (some resources already existed)'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: error.message || String(error)
      })
    };
  }
}; 