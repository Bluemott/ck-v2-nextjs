import { Metadata } from 'next';
import IndexNowSubmitter from '../../components/IndexNowSubmitter';
import { generateSEOMetadata } from '../../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'IndexNow Debug',
  description: 'Debug and test IndexNow URL submission functionality for faster search engine indexing.',
  keywords: ['indexnow', 'seo', 'search engine indexing', 'debug', 'testing'],
  canonical: '/debug/indexnow'
});

export default function IndexNowDebugPage() {
  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">IndexNow Debug & Testing</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test and debug IndexNow URL submission functionality for faster search engine indexing.
            This tool allows you to manually submit URLs to search engines for immediate indexing.
          </p>
        </div>
        
        <IndexNowSubmitter />
        
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">API Endpoints</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">POST /api/indexnow</h3>
                <p className="text-gray-600 mb-2">Submit URLs to IndexNow</p>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`{
  "urls": ["https://www.cowboykimono.com/blog/example-post"],
  "searchEngines": ["google", "bing"]
}`}
                </pre>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">POST /api/wordpress-webhook</h3>
                <p className="text-gray-600 mb-2">WordPress webhook for automatic submissions</p>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`{
  "action": "publish",
  "post_type": "post",
  "post_slug": "example-post",
  "post_status": "publish"
}`}
                </pre>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">GET /api/indexnow</h3>
                <p className="text-gray-600 mb-2">Get IndexNow configuration status</p>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`{
  "isConfigured": true,
  "key": "abc123...",
  "host": "www.cowboykimono.com",
  "keyLocation": "https://www.cowboykimono.com/abc123.txt"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 