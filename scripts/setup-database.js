const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Client } = require('pg');

const secretsManager = new SecretsManagerClient({ region: 'us-east-1' });

async function getDatabaseCredentials() {
  try {
    const command = new GetSecretValueCommand({
      SecretId: 'WordPressAuroraSecret43E21A-l1V2jnLqjhJU'
    });
    
    const response = await secretsManager.send(command);
    const secret = JSON.parse(response.SecretString);
    
    return {
      host: secret.host,
      port: secret.port,
      user: secret.username,
      password: secret.password,
      database: 'postgres' // Connect to default postgres database first
    };
  } catch (error) {
    console.error('Error getting database credentials:', error);
    throw error;
  }
}

async function setupDatabase() {
  const config = await getDatabaseCredentials();
  const client = new Client(config);
  
  try {
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
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database setup completed successfully'
      })
    };
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Database or user already exists, continuing...');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Database setup completed (some resources already existed)'
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
}

// Run the setup
setupDatabase()
  .then(result => {
    console.log('✅ Setup completed:', result.body);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }); 