import { Metadata } from 'next';
import WordPressImage from '../components/WordPressImage';
import { fetchPosts } from '../lib/api';

export const metadata: Metadata = {
  title: 'Thumbnail Test - Cowboy Kimono',
  description: 'Testing thumbnail loading functionality',
};

export default async function ThumbnailTestPage() {
  const posts = await fetchPosts({ per_page: 5, _embed: true });

  return (
    <div className="pt-16 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Thumbnail Test Page</h1>

        <div className="space-y-8">
          {posts.map((post, index) => (
            <div key={post.id} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Post {index + 1}: {post.title?.rendered}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Post Details:</h3>
                  <ul className="text-sm space-y-1">
                    <li>ID: {post.id}</li>
                    <li>Featured Media ID: {post.featured_media}</li>
                    <li>Has _embedded: {post._embedded ? 'Yes' : 'No'}</li>
                    <li>
                      Has featured media:{' '}
                      {post._embedded?.['wp:featuredmedia'] ? 'Yes' : 'No'}
                    </li>
                    <li>
                      Featured media length:{' '}
                      {post._embedded?.['wp:featuredmedia']?.length || 0}
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Thumbnail:</h3>
                  <div className="w-32 h-32 border rounded-lg overflow-hidden">
                    <WordPressImage
                      post={post}
                      fill
                      className="w-full h-full"
                      objectFit="cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
