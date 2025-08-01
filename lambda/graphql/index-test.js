exports.handler = async (event) => {
    console.log('Test Lambda function started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Simple response without any dependencies
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Lambda function is working!',
                timestamp: new Date().toISOString(),
                event: event
            })
        };
        
    } catch (error) {
        console.error('Error in test Lambda function:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            })
        };
    }
}; 