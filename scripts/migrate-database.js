#!/usr/bin/env node

/**
 * WordPress Database Migration Script
 * Migrates WordPress data from MySQL to Aurora PostgreSQL
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🗄️  WordPress Database Migration Script');
console.log('=====================================\n');

// Configuration
const config = {
  // Source WordPress database (MySQL)
  sourceDb: {
    host: 'api.cowboykimono.com',
    user: process.env.WORDPRESS_DB_USER || 'wordpress_user',
    password: process.env.WORDPRESS_DB_PASSWORD || 'your_password',
    database: process.env.WORDPRESS_DB_NAME || 'wordpress_db'
  },
  
  // Target Aurora database (PostgreSQL)
  targetDb: {
    host: 'wordpressblogstack-wordpressauroracaf35a28-oxcsc1phacte.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
    user: process.env.AURORA_DB_USER || 'postgres',
    password: process.env.AURORA_DB_PASSWORD || 'your_aurora_password',
    database: process.env.AURORA_DB_NAME || 'wordpress',
    port: 5432
  },
  
  // Migration settings
  backupDir: './database-backups',
  logFile: './migration.log'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  // Also write to log file
  fs.appendFileSync(config.logFile, `${timestamp} [${type.toUpperCase()}] ${message}\n`);
}

function checkPrerequisites() {
  log('Checking migration prerequisites...');
  
  const checks = [
    { name: 'mysqldump', command: 'mysqldump --version' },
    { name: 'psql', command: 'psql --version' },
    { name: 'pgloader', command: 'pgloader --version' }
  ];
  
  for (const check of checks) {
    try {
      execSync(check.command, { stdio: 'pipe' });
      log(`✓ ${check.name} is available`);
    } catch (error) {
      log(`✗ ${check.name} is not available - please install it`, 'error');
      throw new Error(`Missing prerequisite: ${check.name}`);
    }
  }
}

function createBackup() {
  log('Creating backup of current WordPress database...');
  
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `${config.backupDir}/wordpress-backup-${timestamp}.sql`;
  
  const mysqldumpCmd = `mysqldump -h ${config.sourceDb.host} -u ${config.sourceDb.user} -p${config.sourceDb.password} ${config.sourceDb.database} > ${backupFile}`;
  
  try {
    execSync(mysqldumpCmd, { stdio: 'pipe' });
    log(`✓ Backup created: ${backupFile}`, 'success');
    return backupFile;
  } catch (error) {
    log(`✗ Backup failed: ${error.message}`, 'error');
    throw error;
  }
}

function migrateData() {
  log('Starting database migration...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const migrationFile = `${config.backupDir}/migration-${timestamp}.sql`;
  
  // Create pgloader configuration
  const pgloaderConfig = `
LOAD DATABASE
  FROM mysql://${config.sourceDb.user}:${config.sourceDb.password}@${config.sourceDb.host}/${config.sourceDb.database}
  INTO postgresql://${config.targetDb.user}:${config.targetDb.password}@${config.targetDb.host}:${config.targetDb.port}/${config.targetDb.database}

WITH include drop, create tables, create indexes, reset sequences

SET MySQL PARAMETERS
  net_read_timeout = '600',
  net_write_timeout = '600'

SET PostgreSQL PARAMETERS
  maintenance_work_mem to '128 MB',
  work_mem to '12 MB',
  search_path to 'public'

CAST
  type datetime with time zone drop typemod using zero-dates-to-null,
  type date drop not null using zero-dates-to-null,
  -- Add any custom type mappings here
  default values when missing,
  drop typemod;

-- Include only WordPress tables
INCLUDING ONLY TABLE NAMES MATCHING 'wp_%'
EXCLUDING TABLE NAMES MATCHING 'wp_options', 'wp_usermeta', 'wp_users'
`;
  
  fs.writeFileSync(migrationFile, pgloaderConfig);
  log(`✓ Created pgloader config: ${migrationFile}`);
  
  try {
    execSync(`pgloader ${migrationFile}`, { stdio: 'inherit' });
    log('✓ Database migration completed successfully', 'success');
  } catch (error) {
    log(`✗ Database migration failed: ${error.message}`, 'error');
    throw error;
  }
}

function verifyMigration() {
  log('Verifying migration...');
  
  const testQueries = [
    'SELECT COUNT(*) as post_count FROM wp_posts WHERE post_status = \'publish\';',
    'SELECT COUNT(*) as category_count FROM wp_terms t JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id WHERE tt.taxonomy = \'category\';',
    'SELECT COUNT(*) as tag_count FROM wp_terms t JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id WHERE tt.taxonomy = \'post_tag\';'
  ];
  
  for (const query of testQueries) {
    try {
      const result = execSync(`psql -h ${config.targetDb.host} -U ${config.targetDb.user} -d ${config.targetDb.database} -c "${query}"`, { 
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: config.targetDb.password }
      });
      log(`✓ Query result: ${result.toString().trim()}`);
    } catch (error) {
      log(`✗ Query failed: ${error.message}`, 'error');
    }
  }
}

function testLambdaConnection() {
  log('Testing Lambda function connection...');
  
  const testPayload = {
    query: `
      query {
        posts(first: 1) {
          nodes {
            title
            slug
          }
        }
      }
    `
  };
  
  try {
    const result = execSync(`curl -X POST "https://org9qz2q03.execute-api.us-east-1.amazonaws.com/prod/graphql" -H "Content-Type: application/json" -d '${JSON.stringify(testPayload)}'`, { 
      stdio: 'pipe' 
    });
    log('✓ Lambda function is responding', 'success');
    log(`Response: ${result.toString().substring(0, 200)}...`);
  } catch (error) {
    log(`✗ Lambda function test failed: ${error.message}`, 'error');
  }
}

async function runMigration() {
  try {
    log('Starting WordPress to Aurora migration...');
    
    // Initialize log file
    fs.writeFileSync(config.logFile, `Migration started at ${new Date().toISOString()}\n`);
    
    // Step 1: Check prerequisites
    checkPrerequisites();
    
    // Step 2: Create backup
    const backupFile = createBackup();
    
    // Step 3: Migrate data
    migrateData();
    
    // Step 4: Verify migration
    verifyMigration();
    
    // Step 5: Test Lambda connection
    testLambdaConnection();
    
    log('🎉 Migration completed successfully!', 'success');
    log('Next steps:');
    log('1. Test the blog functionality');
    log('2. Monitor Lambda function performance');
    log('3. Update environment variables if needed');
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, config }; 