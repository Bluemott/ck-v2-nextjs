const https = require('https');

async function testGraphQLEndpoint(url, query, description) {
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

async function runTests() {
    console.log('🚀 Testing GraphQL API Endpoints');
    console.log('================================\n');
    
    const directApiUrl = 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql';
    const amplifyProxyUrl = 'https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/api/graphql';
    
    try {
        // Test 1: Health check on direct API
        await testGraphQLEndpoint(directApiUrl, '{ health }', 'Direct API Health Check');
        
        // Test 2: Database status on direct API
        await testGraphQLEndpoint(directApiUrl, '{ dbStatus }', 'Direct API Database Status');
        
        // Test 3: Posts query on direct API
        await testGraphQLEndpoint(directApiUrl, '{ posts(first: 2) { id title slug } }', 'Direct API Posts Query');
        
        // Test 4: Health check through Amplify proxy
        await testGraphQLEndpoint(amplifyProxyUrl, '{ health }', 'Amplify Proxy Health Check');
        
        // Test 5: Posts query through Amplify proxy
        await testGraphQLEndpoint(amplifyProxyUrl, '{ posts(first: 2) { id title slug } }', 'Amplify Proxy Posts Query');
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

runTests();