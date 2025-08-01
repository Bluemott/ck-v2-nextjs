
exports.handler = async (event) => {
    console.log('Test function executed');
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Test function working!',
            timestamp: new Date().toISOString()
        })
    };
};
