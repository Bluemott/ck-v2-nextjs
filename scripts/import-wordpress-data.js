const fs = require('fs');
const path = require('path');

// Load WordPress data
function loadWordPressData() {
  try {
    const postsPath = path.join(__dirname, '../wordpress-export/posts.json');
    const categoriesPath = path.join(__dirname, '../wordpress-export/categories.json');
    const tagsPath = path.join(__dirname, '../wordpress-export/tags.json');
    
    console.log('📂 Loading WordPress data...');
    
    const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    
    console.log(`✅ Loaded data:`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tags: ${tags.length}`);
    
    return { posts, categories, tags };
  } catch (error) {
    console.error('❌ Error loading WordPress data:', error.message);
    throw error;
  }
}

// Send data to Lambda function
async function sendDataToLambda(data) {
  const { default: fetch } = await import('node-fetch');
  
  const apiUrl = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/import-data';
  
  console.log('🚀 Sending data to Lambda function...');
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Data import successful!');
      console.log('📊 Summary:', result.summary);
    } else {
      console.error('❌ Data import failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending data to Lambda:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🔄 Starting WordPress data import...');
    
    // Load data
    const data = loadWordPressData();
    
    // Send to Lambda
    await sendDataToLambda(data);
    
    console.log('🎉 WordPress data import completed!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 