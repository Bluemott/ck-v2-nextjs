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
                    console.log(`❌ JSON Parse Error:`, error.message);
                    console.log(`📄 Raw Response:`, data);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request Error:`, error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    const apiUrl = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';
    
    try {
        // Test categories query
        await testGraphQLQuery(
            apiUrl,
            '{ categories(first: 5) { id name slug description count } }',
            'Categories Query'
        );
        
        // Test tags query
        await testGraphQLQuery(
            apiUrl,
            '{ tags(first: 5) { id name slug description count } }',
            'Tags Query'
        );
        
        // Test health check
        await testGraphQLQuery(
            apiUrl,
            '{ health }',
            'Health Check'
        );
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

runTests();