const { Client } = require('pg');

exports.handler = async (event) => {
  console.log('🔍 Testing database connection...');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000
  };
  
  console.log('🔌 Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port
  });
  
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    console.log('📊 Testing query...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Query successful:', result.rows[0]);
    
    await client.end();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Database connection successful',
        data: result.rows[0]
      })
    };
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('Error ending client:', endError.message);
      }
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      })
    };
  }
}; 