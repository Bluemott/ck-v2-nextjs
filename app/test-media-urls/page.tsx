import { fetchPosts, getFeaturedImageUrl, convertToS3Url, debugUrlConversion } from '../lib/api';

export default async function TestMediaUrlsPage() {
  const posts = await fetchPosts({ first: 5 });
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Media URL Test</h1>
      
      <div className="space-y-8">
        {posts.map((post) => (
          <div key={post.databaseId} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{post.title}</h2>
            
            {post.featuredImage?.node && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Original WordPress URL:</h3>
                  <p className="text-sm text-gray-600 break-all">
                    {post.featuredImage.node.sourceUrl}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Converted S3 URL:</h3>
                  <p className="text-sm text-blue-600 break-all">
                    {getFeaturedImageUrl(post)}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Direct Conversion Test:</h3>
                  <p className="text-sm text-green-600 break-all">
                    {convertToS3Url(post.featuredImage.node.sourceUrl)}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Debug Information:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(debugUrlConversion(post.featuredImage.node.sourceUrl), null, 2)}
                  </pre>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium">Image Preview:</h3>
                  <img 
                    src={getFeaturedImageUrl(post) || ''} 
                    alt={post.featuredImage.node.altText || post.title}
                    className="max-w-xs rounded"
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {!post.featuredImage?.node && (
              <p className="text-gray-500">No featured image</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 