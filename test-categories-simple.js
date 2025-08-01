const https = require('https');

function testQuery(query) {
    const postData = JSON.stringify({ query });
    
    const options = {
        hostname: '0m6piyoypi.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/prod/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
        });
    });
    
    req.on('error', (e) => {
        console.error('Error:', e.message);
    });
    
    req.write(postData);
    req.end();
}

console.log('Testing categories query...');
testQuery('{ categories(first: 3) { id name slug count } }');

setTimeout(() => {
    console.log('\nTesting tags query...');
    testQuery('{ tags(first: 3) { id name slug count } }');
}, 1000);

setTimeout(() => {
    console.log('\nTesting posts query...');
    testQuery('{ posts(first: 2) { id title slug } }');
}, 2000);