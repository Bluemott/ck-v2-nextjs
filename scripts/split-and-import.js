const fs = require('fs');

// Read the full payload
const fullPayload = JSON.parse(fs.readFileSync('lambda-payload.json', 'utf8'));

// Split posts into chunks of 10
const chunkSize = 10;
const postChunks = [];

for (let i = 0; i < fullPayload.posts.length; i += chunkSize) {
  postChunks.push(fullPayload.posts.slice(i, i + chunkSize));
}

console.log(`📦 Split ${fullPayload.posts.length} posts into ${postChunks.length} chunks`);

// Create chunk files
postChunks.forEach((chunk, index) => {
  const chunkPayload = {
    posts: chunk,
    categories: index === 0 ? fullPayload.categories : [], // Only import categories with first chunk
    tags: index === 0 ? fullPayload.tags : [] // Only import tags with first chunk
  };
  
  const filename = `chunk-${index + 1}.json`;
  fs.writeFileSync(filename, JSON.stringify(chunkPayload, null, 2));
  
  console.log(`📄 Created ${filename}: ${chunk.length} posts`);
});

console.log('\n🚀 To import all data, run these commands:');
console.log('aws lambda invoke --function-name wordpress-import-function --payload file://chunk-1.json response1.json');
console.log('aws lambda invoke --function-name wordpress-import-function --payload file://chunk-2.json response2.json');
console.log('aws lambda invoke --function-name wordpress-import-function --payload file://chunk-3.json response3.json');
console.log('aws lambda invoke --function-name wordpress-import-function --payload file://chunk-4.json response4.json');
console.log('aws lambda invoke --function-name wordpress-import-function --payload file://chunk-5.json response5.json'); 