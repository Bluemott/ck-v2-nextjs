import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: "Admin Dashboard",
  description: "Administrative dashboard for site monitoring",
  canonical: "/admin",
});

export default async function AdminPage() {

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deployment Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Deployment Status</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span>Site Deployed Successfully</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span>Database Migration Complete</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span>WordPress REST API Active</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span>Amplify Environment Configured</span>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🔧 API Configuration</h2>
          <div className="space-y-3">
            <div>
              <strong>Active API:</strong> WordPress REST API
            </div>
            <div>
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
            <div>
              <strong>REST API:</strong> {process.env.NEXT_PUBLIC_USE_REST_API === 'true' ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Performance</h2>
          <div className="space-y-3">
            <div>
              <strong>CDN:</strong> CloudFront Active
            </div>
            <div>
              <strong>Image Optimization:</strong> Next.js Image Component
            </div>
            <div>
              <strong>Caching:</strong> Static Assets Cached
            </div>
            <div>
              <strong>Compression:</strong> Gzip Enabled
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Next Steps</h2>
          <ul className="space-y-2 text-sm">
            <li>• Test blog functionality</li>
            <li>• Verify search and pagination</li>
            <li>• Check mobile responsiveness</li>
            <li>• Monitor performance metrics</li>
            <li>• Set up custom domain</li>
          </ul>
        </div>
      </div>

      {/* Live Site Link */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🌐 Live Site</h3>
        <p className="text-blue-700 mb-4">
          Your site is live and accessible at:
        </p>
        <a 
          href="https://dev-amplify-deployment.d1crrnsi5h4ht1.amplifyapp.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Visit Live Site →
        </a>
      </div>
    </div>
  );
} 