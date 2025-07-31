const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

const testEvent = {
  body: JSON.stringify({
    query: `
      query {
        posts(first: 1) {
          nodes {
            id
            title
          }
        }
      }
    `
  })
};

async function testCount() {
  try {
    console.log('🧪 Testing database count...');
    
    const command = new InvokeCommand({
      FunctionName: 'WordPressBlogStack-WordPressGraphQLC0771999-wnF0kY4NTVtm',
      Payload: JSON.stringify(testEvent),
      LogType: 'Tail'
    });
    
    const response = await lambda.send(command);
    
    console.log('✅ Lambda response:');
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log(JSON.stringify(payload, null, 2));
    
    if (response.LogResult) {
      console.log('\n📋 Lambda logs:');
      const logs = Buffer.from(response.LogResult, 'base64').toString();
      console.log(logs);
    }
    
  } catch (error) {
    console.error('❌ Error testing count:', error.message);
  }
}

testCount(); 