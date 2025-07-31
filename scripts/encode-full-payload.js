const fs = require('fs');

// Read the full payload
const payload = JSON.parse(fs.readFileSync('lambda-payload.json', 'utf8'));

// Encode to base64
const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');

// Write to file
fs.writeFileSync('full-encoded-payload.txt', encoded);

console.log('✅ Full payload encoded successfully');
console.log(`📊 Payload contains:`);
console.log(`   Posts: ${payload.posts.length}`);
console.log(`   Categories: ${payload.categories.length}`);
console.log(`   Tags: ${payload.tags.length}`);
console.log(`📄 Encoded size: ${encoded.length} characters`); 