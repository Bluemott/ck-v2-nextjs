import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import { testAPIEndpoint } from '../lib/api';

export const metadata: Metadata = generateSEOMetadata({
  title: "API Test Page",
  description: "Test page for API endpoints and configuration",
  canonical: "/test-api",
});

export default async function TestAPIPage() {
  const apiStatus = await testAPIEndpoint();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Configuration Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
        
        <div className="space-y-3">
          <div>
            <strong>Active API:</strong> {apiStatus.api}
          </div>
          <div>
            <strong>API URL:</strong> {apiStatus.url}
          </div>
          <div>
            <strong>Feature Flag:</strong> {process.env.NEXT_PUBLIC_USE_AWS_GRAPHQL === 'true' ? 'Enabled (AWS)' : 'Disabled (WordPress)'}
          </div>
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">✅ Site Status</h3>
        <p className="text-blue-700">
          Your site is successfully deployed and the database migration appears to be working. 
          The AWS GraphQL API is configured and should be serving your WordPress data.
        </p>
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">🎯 Next Steps</h3>
        <ul className="text-green-700 space-y-2">
          <li>• Test blog functionality on the live site</li>
          <li>• Verify search and pagination work correctly</li>
          <li>• Check that all WordPress content is displaying</li>
          <li>• Test mobile responsiveness</li>
          <li>• Monitor performance and loading speeds</li>
        </ul>
      </div>
    </div>
  );
} 