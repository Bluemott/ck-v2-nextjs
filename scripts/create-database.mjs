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

async function createDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to Aurora database...');
    await client.connect();
    console.log('✅ Connected to Aurora database');
    
    // Create the wordpress database
    console.log('📝 Creating wordpress database...');
    await client.query('CREATE DATABASE wordpress');
    console.log('✅ Database "wordpress" created successfully');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Database "wordpress" already exists');
    } else {
      console.error('❌ Error creating database:', error.message);
    }
  } finally {
    await client.end();
  }
}

// Run the script
createDatabase().catch(console.error); 