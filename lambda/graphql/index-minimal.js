
exports.handler = async (event) => {
    console.log('Lambda function started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Return a simple GraphQL response for now
        const query = event.body ? JSON.parse(event.body).query : '';
        
        console.log('Query received:', query);
        
        // Simple hardcoded response for testing
        const response = {
            data: {
                __typename: "Query",
                posts: {
                    nodes: [
                        {
                            id: "1",
                            title: "Test Post",
                            slug: "test-post",
                            excerpt: "This is a test post to verify the API is working",
                            date: "2025-07-31T00:00:00Z"
                        }
                    ],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                }
            }
        };
        
        console.log('Returning response:', JSON.stringify(response, null, 2));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify(response)
        };
        
    } catch (error) {
        console.error('Error in Lambda function:', error);
        
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
