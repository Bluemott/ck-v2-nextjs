import Link from 'next/link';

async function testGraphQLEndpoint(): Promise<boolean> {
  try {
    const response = await fetch('https://api.cowboykimono.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function DebugGraphQLPage() {
  let isGraphQLAvailable = false;
  let errorMessage = '';

  try {
    isGraphQLAvailable = await testGraphQLEndpoint();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('GraphQL test error:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">GraphQL Connection Diagnostic</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* GraphQL Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">GraphQL Endpoint Status</h2>
          {isGraphQLAvailable ? (
            <div className="text-green-600">
              <p className="text-lg font-medium">✅ GraphQL Endpoint Available</p>
              <p className="text-sm mt-2">The GraphQL endpoint is responding correctly.</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="text-lg font-medium">❌ GraphQL Endpoint Unavailable</p>
              <p className="text-sm mt-2">The GraphQL endpoint is not responding.</p>
              {errorMessage && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                  <strong>Error:</strong> {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* WordPress Admin */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">WordPress Admin</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Admin URL:</strong> 
              <a href="https://admin.cowboykimono.com" target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:text-blue-800 ml-2">
                https://admin.cowboykimono.com
              </a>
            </p>
            <p className="text-sm">
              <strong>GraphQL Endpoint:</strong> 
              <a href="https://api.cowboykimono.com/graphql" target="_blank" rel="noopener noreferrer"
                 className="text-blue-600 hover:text-blue-800 ml-2">
                https://api.cowboykimono.com/graphql
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting Steps */}
      <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔧 Troubleshooting Steps</h3>
        
        {!isGraphQLAvailable ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-yellow-800">1. Check WordPress Plugin</h4>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li>• Go to WordPress Admin: <a href="https://admin.cowboykimono.com" target="_blank" rel="noopener noreferrer" className="text-blue-600">https://admin.cowboykimono.com</a></li>
                <li>• Navigate to Plugins → Installed Plugins</li>
                <li>• Look for &quot;WPGraphQL&quot; plugin</li>
                <li>• If not installed, go to Plugins → Add New → Search &quot;WPGraphQL&quot;</li>
                <li>• Install and activate the plugin</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-800">2. Test GraphQL Endpoint</h4>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li>• Visit: <a href="https://api.cowboykimono.com/graphql" target="_blank" rel="noopener noreferrer" className="text-blue-600">https://api.cowboykimono.com/graphql</a></li>
                <li>• You should see a GraphiQL interface or GraphQL response</li>
                <li>• If you see a 404 or error, the plugin is not properly configured</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-800">3. Check WordPress Site Status</h4>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li>• Ensure WordPress site is running and accessible</li>
                <li>• Check for any maintenance mode or server issues</li>
                <li>• Verify the domain is correctly configured</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-yellow-800">4. Manual Test</h4>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li>• Open browser Dev Tools (F12)</li>
                <li>• Go to Network tab</li>
                <li>• Visit the GraphQL endpoint directly</li>
                <li>• Check for any network errors or timeouts</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-green-700">
            <p>✅ GraphQL is working correctly! You can now use the blog features.</p>
            <p className="text-sm mt-2">Try visiting <Link href="/blog" className="text-blue-600 hover:text-blue-800">the blog page</Link> to test the functionality.</p>
          </div>
        )}
      </div>

      {/* Environment Info */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Environment Information</h3>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Configuration</h3>
          <p><strong>GraphQL URL (Primary):</strong> {process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || 'https://api.cowboykimono.com/graphql'}</p>
          <p><strong>REST API URL (Legacy):</strong> {process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.cowboykimono.com/wp-json/wp/v2'}</p>
          <p><strong>Admin URL:</strong> {process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL || 'https://admin.cowboykimono.com'}</p>
          <p><strong>Media URL:</strong> {process.env.NEXT_PUBLIC_WORDPRESS_MEDIA_URL || 'https://api.cowboykimono.com/wp-content/uploads'}</p>
        </div>
      </div>

      {/* Quick Test Links */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Test Links</h3>
        <div className="space-y-2">
          <p className="text-sm">
            <Link href="/test-graphql" className="text-blue-600 hover:text-blue-800 font-medium">
              → Test GraphQL Queries
            </Link>
            <span className="text-gray-600 ml-2">- Test basic GraphQL functionality</span>
          </p>
          <p className="text-sm">
            <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
              → Test Blog Page
            </Link>
            <span className="text-gray-600 ml-2">- Test the main blog functionality</span>
          </p>
        </div>
      </div>
    </div>
  );
} 