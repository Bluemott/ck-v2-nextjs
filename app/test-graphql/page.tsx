import Link from 'next/link';

interface GraphQLNode {
  id: string;
  title?: string;
  name?: string;
  slug: string;
}

async function testBasicGraphQL(): Promise<{ success: boolean; posts?: GraphQLNode[]; categories?: GraphQLNode[]; tags?: GraphQLNode[]; error?: string }> {
  try {
    // Test posts query
    const postsResponse = await fetch('https://api.cowboykimono.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            posts(first: 3) {
              nodes {
                id
                title
                slug
              }
            }
          }
        `
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!postsResponse.ok) {
      throw new Error(`Posts query failed: ${postsResponse.status}`);
    }

    const postsData = await postsResponse.json();
    
    if (postsData.errors) {
      throw new Error(`GraphQL errors: ${postsData.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    // Test categories query
    const categoriesResponse = await fetch('https://api.cowboykimono.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            categories(first: 5) {
              nodes {
                id
                name
                slug
              }
            }
          }
        `
      }),
      signal: AbortSignal.timeout(10000),
    });

    const categoriesData = await categoriesResponse.json();

    // Test tags query
    const tagsResponse = await fetch('https://api.cowboykimono.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            tags(first: 5) {
              nodes {
                id
                name
                slug
              }
            }
          }
        `
      }),
      signal: AbortSignal.timeout(10000),
    });

    const tagsData = await tagsResponse.json();

    return {
      success: true,
      posts: postsData.data?.posts?.nodes || [],
      categories: categoriesData.data?.categories?.nodes || [],
      tags: tagsData.data?.tags?.nodes || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default async function TestGraphQLPage() {
  const result = await testBasicGraphQL();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">GraphQL Test Page</h1>
      
      {result.success ? (
        <div className="space-y-8">
          {/* Success Message */}
          <div className="p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ GraphQL Integration Working</h3>
            <p className="text-green-700">
              All GraphQL queries are working correctly. The WPGraphQL integration has been successfully fixed.
            </p>
          </div>

          {/* Posts Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Posts Test</h2>
            <p className="text-green-600 mb-2">✅ Success: {result.posts?.length || 0} posts loaded</p>
            {result.posts?.slice(0, 2).map((post: GraphQLNode) => (
              <div key={post.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-gray-600">{post.slug}</p>
              </div>
            ))}
          </div>

          {/* Categories Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Categories Test</h2>
            <p className="text-green-600 mb-2">✅ Success: {result.categories?.length || 0} categories loaded</p>
            {result.categories?.slice(0, 3).map((category: GraphQLNode) => (
              <div key={category.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-gray-600">{category.slug}</p>
              </div>
            ))}
          </div>

          {/* Tags Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tags Test</h2>
            <p className="text-green-600 mb-2">✅ Success: {result.tags?.length || 0} tags loaded</p>
            {result.tags?.slice(0, 3).map((tag: GraphQLNode) => (
              <div key={tag.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">{tag.name}</p>
                <p className="text-sm text-gray-600">{tag.slug}</p>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🚀 Next Steps</h3>
            <div className="space-y-2">
              <p className="text-blue-700">
                <Link href="/blog" className="font-medium hover:underline">→ Test the Blog Page</Link>
                <span className="text-sm ml-2">- See the blog in action</span>
              </p>
              <p className="text-blue-700">
                <Link href="/debug-graphql" className="font-medium hover:underline">→ View Diagnostic Page</Link>
                <span className="text-sm ml-2">- Detailed troubleshooting info</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Error Message */}
          <div className="p-6 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ GraphQL Error</h3>
            <p className="text-red-700 mb-4">
              There was an error testing the GraphQL integration:
            </p>
            <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">
              {result.error}
            </pre>
          </div>

          {/* Troubleshooting Steps */}
          <div className="p-6 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Troubleshooting Steps</h3>
            <ul className="text-yellow-700 space-y-2">
              <li>• Ensure WPGraphQL plugin is installed and activated on WordPress</li>
              <li>• Check that the GraphQL endpoint is accessible at: https://api.cowboykimono.com/graphql</li>
              <li>• Verify WordPress admin access at: https://admin.cowboykimono.com</li>
              <li>• Check browser console for detailed error messages</li>
            </ul>
          </div>

          {/* Diagnostic Link */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Get More Information</h3>
            <p className="text-blue-700">
              <Link href="/debug-graphql" className="font-medium hover:underline">→ Visit Diagnostic Page</Link>
              <span className="text-sm ml-2">- Detailed troubleshooting and testing</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 