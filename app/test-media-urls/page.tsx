import { fetchPosts, getFeaturedImageUrl } from '../lib/api';
import Image from 'next/image';

export default async function TestMediaUrlsPage() {
  let posts: any[] = [];
  let error: string | null = null;

  try {
    // Fetch posts with error handling
    posts = await fetchPosts({ per_page: 10 });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch posts';
    // Continue with empty posts array
  }

  // Test URLs for media display
  const testUrls = [
    'https://cowboykimono.com/wp-content/uploads/2024/01/test-image-1.jpg',
    'https://cowboykimono.com/wp-content/uploads/2024/01/test-image-2.jpg',
    'https://cowboykimono.com/wp-content/uploads/2024/01/test-image-3.jpg',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Media URL Conversion Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing WordPress to S3 URL conversion functionality
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-red-500 mt-2">
              This is expected if the AWS GraphQL API is not available. The test will continue with sample URLs.
            </p>
          </div>
        )}



        {/* Image Display Test */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Image Display Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testUrls.map((url, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Test URL {index + 1}</h3>
                <p className="text-sm text-gray-600 mb-2 break-all">{url}</p>
                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={url}
                    alt={`Test image ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog Posts Test */}
        {posts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Blog Posts Test</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(0, 6).map((post, index) => {
                const featuredImageUrl = getFeaturedImageUrl(post);
                return (
                  <div key={post.id || index} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {post.title?.rendered || `Post ${index + 1}`}
                    </h3>
                    {featuredImageUrl && (
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-4">
                        <Image
                          src={featuredImageUrl}
                          alt={post.title?.rendered || `Post ${index + 1}`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {post.excerpt?.rendered || 'No excerpt available'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {posts.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts available</h3>
            <p className="text-gray-500">
              No blog posts were found to test with.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 