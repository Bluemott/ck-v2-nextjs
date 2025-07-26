import { Metadata } from 'next';
import { fetchPosts } from '../lib/wpgraphql';
import { extractYoastSEOData } from '../lib/seo';

export const metadata: Metadata = {
  title: 'Yoast SEO Integration Test',
  description: 'Testing Yoast SEO integration with WPGraphQL',
};

export default async function TestYoastSEOPage() {
  const posts = await fetchPosts({ first: 5 });
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Yoast SEO Integration Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">SEO Data from WordPress Posts</h2>
          
                     {posts.map((post) => {
             const yoastSEO = extractYoastSEOData(post);
            
            return (
              <div key={post.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
                <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Yoast SEO Data:</h4>
                    <div className="space-y-1">
                      <div><strong>SEO Title:</strong> {yoastSEO?.title || 'Not set'}</div>
                      <div><strong>Meta Description:</strong> {yoastSEO?.metaDesc || 'Not set'}</div>
                      <div><strong>Focus Keyword:</strong> {yoastSEO?.focuskw || 'Not set'}</div>
                      <div><strong>Canonical URL:</strong> {yoastSEO?.canonical || 'Not set'}</div>
                      <div><strong>No Index:</strong> {yoastSEO?.metaRobotsNoindex || 'Not set'}</div>
                      <div><strong>No Follow:</strong> {yoastSEO?.metaRobotsNofollow || 'Not set'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Open Graph Data:</h4>
                    <div className="space-y-1">
                      <div><strong>OG Title:</strong> {yoastSEO?.opengraphTitle || 'Not set'}</div>
                      <div><strong>OG Description:</strong> {yoastSEO?.opengraphDescription || 'Not set'}</div>
                      <div><strong>OG Image:</strong> {yoastSEO?.opengraphImage || 'Not set'}</div>
                      <div><strong>OG Type:</strong> {yoastSEO?.opengraphType || 'Not set'}</div>
                    </div>
                  </div>
                </div>
                
                {yoastSEO?.schema && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Schema Data:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {yoastSEO.schema}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Integration Status</h2>
          <ul className="text-blue-700 space-y-1">
            <li>✅ WPGraphQL queries updated with Yoast SEO fields</li>
            <li>✅ TypeScript interfaces updated for SEO data</li>
            <li>✅ SEO metadata generation enhanced with Yoast data</li>

            <li>✅ Yoast schema component created</li>
            <li>✅ Blog post pages updated to use Yoast SEO</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 