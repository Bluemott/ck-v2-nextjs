import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'REST API Test - Cowboy Kimono',
  description: 'Test page for REST API endpoints',
};

export default function TestRestAPIPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            REST API Test Page
          </h1>
          
          <div className="space-y-8">
            {/* Health Check */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Health Check
              </h2>
              <p className="text-gray-600 mb-4">
                Test the health check endpoint to verify API status.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Test Health Check
                </a>
                <span className="text-sm text-gray-500">
                  GET /api/health
                </span>
              </div>
            </div>

            {/* API Documentation */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                API Documentation
              </h2>
              <p className="text-gray-600 mb-4">
                View complete API documentation and available endpoints.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  View API Docs
                </a>
                <span className="text-sm text-gray-500">
                  GET /api/docs
                </span>
              </div>
            </div>

            {/* Posts Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Posts API
              </h2>
              <p className="text-gray-600 mb-4">
                Test the posts endpoint with various parameters.
              </p>
              <div className="space-y-2">
                <div className="flex space-x-4">
                  <a
                    href="/api/posts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    All Posts
                  </a>
                  <span className="text-sm text-gray-500">
                    GET /api/posts
                  </span>
                </div>
                <div className="flex space-x-4">
                  <a
                    href="/api/posts?per_page=5&with_pagination=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Posts with Pagination
                  </a>
                  <span className="text-sm text-gray-500">
                    GET /api/posts?per_page=5&with_pagination=true
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Categories API
              </h2>
              <p className="text-gray-600 mb-4">
                Test the categories endpoint.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/api/categories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  All Categories
                </a>
                <span className="text-sm text-gray-500">
                  GET /api/categories
                </span>
              </div>
            </div>

            {/* Tags Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tags API
              </h2>
              <p className="text-gray-600 mb-4">
                Test the tags endpoint.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/api/tags"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  All Tags
                </a>
                <span className="text-sm text-gray-500">
                  GET /api/tags
                </span>
              </div>
            </div>

            {/* Search Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search API
              </h2>
              <p className="text-gray-600 mb-4">
                Test the search endpoint with a sample query.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/api/search?q=cowboy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Search "cowboy"
                </a>
                <span className="text-sm text-gray-500">
                  GET /api/search?q=cowboy
                </span>
              </div>
            </div>

            {/* Development Info */}
            <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Development Information
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Development URL:</strong> http://localhost:3000</p>
                <p><strong>API Base URL:</strong> http://localhost:3000/api</p>
                <p><strong>WordPress REST API:</strong> https://api.cowboykimono.com</p>
                <p><strong>Environment:</strong> Development</p>
                <p><strong>Framework:</strong> Next.js 15.3.4 with Turbopack</p>
                <p><strong>Architecture:</strong> AWS Amplify + WordPress REST API</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="border border-gray-200 rounded-lg p-6 bg-yellow-50">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Testing Instructions
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>1. Click on any of the test buttons above to open the API endpoint in a new tab</p>
                <p>2. Verify that the response is valid JSON with a <code>success: true</code> field</p>
                <p>3. Check the browser's Network tab to see response times and headers</p>
                <p>4. Test different query parameters to ensure filtering works correctly</p>
                <p>5. Verify that caching headers are properly set</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 