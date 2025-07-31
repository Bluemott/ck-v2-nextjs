import { testAPIEndpoint } from '../lib/api';

export default async function TestAPIPage() {
  const apiInfo = await testAPIEndpoint();
  
  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-4xl mx-auto px-8">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current API Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <strong>API Type:</strong> {apiInfo.api}
            </div>
            <div>
              <strong>API URL:</strong> {apiInfo.url}
            </div>
            <div>
              <strong>Feature Flag:</strong> {process.env.NEXT_PUBLIC_USE_AWS_GRAPHQL === 'true' ? 'Enabled (AWS)' : 'Disabled (WordPress)'}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              If you see "AWS GraphQL" above, the blog is using your new AWS infrastructure.
              If you see "WordPress GraphQL", it's still using the old WordPress API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 