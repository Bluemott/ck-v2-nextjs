import { Client } from 'pg';

// Aurora database configuration (connect to default postgres database first)
const dbConfig = {
  host: 'wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  user: 'postgres',
  password: 'kcSgEFyE-1uqQqep9-g01-j5Y-VmvA',
  database: 'postgres', // Connect to default postgres database
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

export const handler = async (event) => {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to Aurora database...');
    await client.connect();
    console.log('✅ Connected to Aurora database');
    
    // Create the wordpress database
    console.log('📝 Creating wordpress database...');
    await client.query('CREATE DATABASE wordpress');
    console.log('✅ Database "wordpress" created successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database "wordpress" created successfully'
      })
    };
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    if (error.message.includes('already exists')) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Database "wordpress" already exists'
        })
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  } finally {
    await client.end();
  }
}; 