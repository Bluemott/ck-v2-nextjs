exports.handler = async (event) => {
    console.log('Simple test Lambda function started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
            message: 'Simple test function working!',
            timestamp: new Date().toISOString(),
            event: event
        })
    };
}; 