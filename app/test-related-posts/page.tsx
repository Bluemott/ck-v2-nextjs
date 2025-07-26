import { Metadata } from 'next';
import { fetchPosts } from '../lib/wpgraphql';
import RelatedPosts from '../components/RelatedPosts';

export const metadata: Metadata = {
  title: 'Test Related Posts - Cowboy Kimono',
  description: 'Test page for enhanced related posts functionality',
};

export default async function TestRelatedPostsPage() {
  // Get a sample post to test with
  const posts = await fetchPosts({ first: 5 });
  const samplePost = posts[0];

  if (!samplePost) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Test Related Posts</h1>
          <p className="text-gray-600">No posts available for testing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Test Related Posts</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Sample Post</h2>
          <h3 className="text-md font-medium mb-2">{samplePost.title}</h3>
          <p className="text-sm text-gray-600 mb-2">
            Categories: {samplePost.categories.nodes.map(cat => cat.name).join(', ')}
          </p>
          <p className="text-sm text-gray-600">
            Tags: {samplePost.tags.nodes.map(tag => tag.name).join(', ')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Related Posts Test</h2>
          <RelatedPosts
            currentPost={samplePost}
            categories={samplePost.categories.nodes.map(cat => cat.databaseId)}
            tags={samplePost.tags.nodes.map(tag => tag.databaseId)}
            limit={6}
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Algorithm Information</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Enhanced Related Posts Algorithm:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Exact Tag Matches (10 points per tag)</li>
              <li>Exact Category Matches (8 points per category)</li>
              <li>Content & Title Similarity (up to 20 points)</li>
              <li>Partial Tag Matches (3 points per match)</li>
              <li>Recent Posts from Same Categories (1 point)</li>
            </ul>
            <p className="mt-4">
              <strong>Features:</strong> Relevance scoring, detailed reasoning, visual indicators, and debug information in development mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 