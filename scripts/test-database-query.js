const { Client } = require('pg');

const dbConfig = {
  host: 'wordpressblogstack-wordpressauroracaf35a28-l7qlgwhkiu93.cluster-cwp008gg4ymh.us-east-1.rds.amazonaws.com',
  user: 'postgres',
  password: 'kcSgEFyE-1uqQqep9-g01-j5Y-VmvA',
  database: 'wordpress',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

async function testDatabase() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    // Test basic query
    console.log('\n📊 Testing basic query...');
    const result = await client.query('SELECT COUNT(*) FROM wp_posts');
    console.log(`Total posts: ${result.rows[0].count}`);
    
    // Test posts query
    console.log('\n📝 Testing posts query...');
    const postsResult = await client.query(`
      SELECT 
        p.id,
        p.wordpress_id as database_id,
        p.post_date,
        p.post_modified,
        p.slug,
        p.post_status,
        p.post_title,
        p.post_content,
        p.post_excerpt,
        p.wordpress_data
      FROM wp_posts p
      WHERE p.post_type = 'post' 
        AND p.post_status = 'publish'
      LIMIT 5
    `);
    
    console.log(`Found ${postsResult.rows.length} posts`);
    
    if (postsResult.rows.length > 0) {
      console.log('\n📋 First post sample:');
      const firstPost = postsResult.rows[0];
      console.log(`ID: ${firstPost.id}`);
      console.log(`WordPress ID: ${firstPost.database_id}`);
      console.log(`Title: ${firstPost.post_title}`);
      console.log(`Slug: ${firstPost.slug}`);
      console.log(`Status: ${firstPost.post_status}`);
      console.log(`Type: ${firstPost.post_type}`);
      
      if (firstPost.wordpress_data) {
        const wpData = JSON.parse(firstPost.wordpress_data);
        console.log(`WordPress data keys: ${Object.keys(wpData).join(', ')}`);
      }
    }
    
    // Test categories
    console.log('\n📂 Testing categories...');
    const categoriesResult = await client.query('SELECT COUNT(*) FROM wp_categories');
    console.log(`Total categories: ${categoriesResult.rows[0].count}`);
    
    // Test tags
    console.log('\n🏷️  Testing tags...');
    const tagsResult = await client.query('SELECT COUNT(*) FROM wp_tags');
    console.log(`Total tags: ${tagsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

testDatabase(); 