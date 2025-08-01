const https = require('https');

async function testGraphQLQuery(url, query, description) {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 URL: ${url}`);
    
    const postData = JSON.stringify({ query });
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ Status: ${res.statusCode}`);
                    console.log(`📊 Response:`, JSON.stringify(jsonData, null, 2));
                    resolve(jsonData);
                } catch (error) {
                    console.log(`❌ Invalid JSON response:`, data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed:`, error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function checkBlogPost() {
    console.log('🔍 Testing Blog Post Availability');
    console.log('=================================\n');
    
    const directApiUrl = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';
    
    try {
        // Test 1: Check all available posts
        await testGraphQLQuery(directApiUrl, '{ posts(first: 10) { id title slug } }', 'All Available Posts');
        
        // Test 2: Try to fetch the specific post
        await testGraphQLQuery(directApiUrl, '{ post(slug: "poodoodle-journal") { id title slug content } }', 'Specific Post: poodoodle-journal');
        
        // Test 3: Check similar slugs
        await testGraphQLQuery(directApiUrl, '{ post(slug: "poodoodle") { id title slug content } }', 'Try: poodoodle');
        
        // Test 4: Check diy-related posts
        await testGraphQLQuery(directApiUrl, '{ post(slug: "diy-sardine-skirt") { id title slug content } }', 'Try: diy-sardine-skirt');
        
        console.log('\n🎯 Analysis complete!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

checkBlogPost();