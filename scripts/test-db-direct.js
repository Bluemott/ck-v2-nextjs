const { Client } = require('pg');

// Database configuration (same as Lambda)
const dbConfig = {
  host: 'wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  user: 'postgres',
  password: '6RbRnDBG61b7R26o8YDeKBFD=cRI_7',
  database: 'wordpress',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection directly...');
  console.log('🔌 Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port
  });
  
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Test a simple query
    console.log('📊 Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Check if tables exist
    console.log('📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    // Test creating a simple table
    console.log('🏗️  Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Test table created successfully');
    
    // Test inserting data
    console.log('📝 Testing data insertion...');
    await client.query(`
      INSERT INTO test_table (name) VALUES ($1)
    `, ['test-data']);
    console.log('✅ Data inserted successfully');
    
    // Test reading data
    console.log('📖 Testing data retrieval...');
    const readResult = await client.query('SELECT * FROM test_table');
    console.log('✅ Data retrieved:', readResult.rows);
    
    // Clean up
    console.log('🧹 Cleaning up test table...');
    await client.query('DROP TABLE test_table');
    console.log('✅ Test table dropped successfully');
    
    await client.end();
    console.log('✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (client) {
      await client.end();
    }
  }
}

testDatabaseConnection(); 