const { Client } = require('pg');

// Aurora database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'kcSgEFyE-1uqQqep9-g01-j5Y-VmvA',
  database: 'postgres', // Connect to default postgres database first
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pooling settings for Lambda
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Main Lambda handler
exports.handler = async (event) => {
  let client;
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting database setup...');
    
    client = new Client(dbConfig);
    console.log('🔌 Connecting to Aurora database...');
    await client.connect();
    console.log('✅ Connected to Aurora database');
    
    const targetDatabase = process.env.DB_NAME || 'wordpress';
    
    // Check if wordpress database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDatabase]
    );
    
    if (result.rows.length === 0) {
      console.log(`📝 Creating ${targetDatabase} database...`);
      await client.query(`CREATE DATABASE ${targetDatabase}`);
      console.log(`✅ Database "${targetDatabase}" created successfully`);
    } else {
      console.log(`ℹ️  Database "${targetDatabase}" already exists`);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        message: 'Database setup completed successfully',
        database: targetDatabase,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
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