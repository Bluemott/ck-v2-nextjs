import { Metadata } from 'next';
import { fetchPosts, fetchPostBySlug } from '../lib/wpgraphql';

export const metadata: Metadata = {
  title: 'Debug Yoast SEO Integration',
  description: 'Debugging Yoast SEO integration with WPGraphQL',
};

export default async function DebugYoastSEOPage() {
  try {
    // Test fetching posts with SEO data
    const posts = await fetchPosts({ first: 3 });
    
    // Test fetching a single post by slug
    const firstPost = posts[0];
    const singlePost = firstPost ? await fetchPostBySlug(firstPost.slug) : null;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Debug Yoast SEO Integration</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Posts List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Posts with SEO Data</h2>
              
              {posts.length === 0 ? (
                <p className="text-red-600">No posts found</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded p-4">
                      <h3 className="font-medium mb-2">{post.title}</h3>
                      <div className="text-sm space-y-1">
                        <div><strong>Slug:</strong> {post.slug}</div>
                        <div><strong>Has SEO Data:</strong> {post.seo ? '✅ Yes' : '❌ No'}</div>
                        {post.seo && (
                          <div className="mt-2 p-2 bg-gray-100 rounded">
                            <div><strong>SEO Title:</strong> {post.seo.title || 'Not set'}</div>
                            <div><strong>Meta Desc:</strong> {post.seo.metaDesc || 'Not set'}</div>
                            <div><strong>Focus KW:</strong> {post.seo.focuskw || 'Not set'}</div>
                            <div><strong>OG Title:</strong> {post.seo.opengraphTitle || 'Not set'}</div>
                            <div><strong>OG Desc:</strong> {post.seo.opengraphDescription || 'Not set'}</div>
                            <div><strong>Has Schema:</strong> {post.seo.schema?.raw ? '✅ Yes' : '❌ No'}</div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Single Post Test */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Single Post Test</h2>
              
              {singlePost ? (
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium mb-2">{singlePost.title}</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Slug:</strong> {singlePost.slug}</div>
                    <div><strong>Has SEO Data:</strong> {singlePost.seo ? '✅ Yes' : '❌ No'}</div>
                    {singlePost.seo && (
                      <div className="mt-2 p-2 bg-gray-100 rounded">
                        <div><strong>SEO Title:</strong> {singlePost.seo.title || 'Not set'}</div>
                        <div><strong>Meta Desc:</strong> {singlePost.seo.metaDesc || 'Not set'}</div>
                        <div><strong>Focus KW:</strong> {singlePost.seo.focuskw || 'Not set'}</div>
                        <div><strong>OG Title:</strong> {singlePost.seo.opengraphTitle || 'Not set'}</div>
                        <div><strong>OG Desc:</strong> {singlePost.seo.opengraphDescription || 'Not set'}</div>
                        <div><strong>Has Schema:</strong> {singlePost.seo.schema?.raw ? '✅ Yes' : '❌ No'}</div>
                      </div>
                    )}
                    
                  </div>
                </div>
              ) : (
                <p className="text-red-600">No single post data available</p>
              )}
            </div>
          </div>

          {/* GraphQL Endpoint Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">GraphQL Endpoint Information</h2>
            <div className="text-blue-700 space-y-1">
              <div><strong>GraphQL URL:</strong> {process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL || 'https://api.cowboykimono.com/graphql'}</div>
              <div><strong>Posts Found:</strong> {posts.length}</div>
              <div><strong>Posts with SEO:</strong> {posts.filter(p => p.seo).length}</div>
              
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting</h2>
            <div className="text-yellow-700 space-y-2">
              <p>If you&apos;re not seeing SEO data:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Ensure WPGraphQL for Yoast SEO plugin is installed and activated</li>
                
                <li>Check that posts have Yoast SEO data configured in WordPress</li>
                <li>Verify the GraphQL endpoint is accessible</li>
                <li>Check browser console for any GraphQL errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Debug Yoast SEO Integration</h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Error Occurred</h2>
            <div className="text-red-700">
              <p><strong>Error:</strong> {error instanceof Error ? error.message : String(error)}</p>
              <p className="mt-2">This could indicate:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>GraphQL endpoint is not accessible</li>
                <li>WordPress plugins are not properly configured</li>
                <li>Network connectivity issues</li>
                <li>GraphQL schema errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 