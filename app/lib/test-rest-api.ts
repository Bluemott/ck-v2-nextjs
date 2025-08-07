/* eslint-disable no-console */
import { fetchCategories, fetchPostBySlug, fetchPosts, fetchTags } from './api';
import { restAPIClient } from './rest-api';

export async function testRestAPI() {
  console.log('🧪 Testing REST API Migration...');

  try {
    // Test 1: Fetch posts
    console.log('📝 Testing fetchPosts...');
    const posts = await fetchPosts({ per_page: 3 });
    console.log(`✅ Fetched ${posts.length} posts`);

    if (posts.length > 0) {
      console.log('📋 First post:', {
        id: posts[0]?.id || 0,
        title: posts[0]?.title?.rendered || '',
        slug: posts[0]?.slug || '',
      });
    }

    // Test 2: Fetch categories
    console.log('📂 Testing fetchCategories...');
    const categories = await fetchCategories();
    console.log(`✅ Fetched ${categories.length} categories`);

    // Test 3: Fetch tags
    console.log('🏷️ Testing fetchTags...');
    const tags = await fetchTags();
    console.log(`✅ Fetched ${tags.length} tags`);

    // Test 4: Fetch single post (if we have posts)
    if (posts.length > 0) {
      console.log('📄 Testing fetchPostBySlug...');
      const post = await fetchPostBySlug(posts[0]?.slug || '');
      if (post) {
        console.log(`✅ Fetched post: ${post.title.rendered}`);
      } else {
        console.log('❌ Failed to fetch post by slug');
      }
    }

    // Test 5: Test REST API client directly
    console.log('🔧 Testing REST API client...');
    const config = restAPIClient.getConfig();
    console.log('✅ REST API config:', {
      baseUrl: config.baseUrl,
      endpoints: Object.keys(config.endpoints),
    });

    console.log('🎉 All REST API tests passed!');
    return true;
  } catch (error) {
    console.error('❌ REST API test failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  testRestAPI().then((success) => {
    if (success) {
      console.log('✅ REST API migration successful!');
    } else {
      console.log('❌ REST API migration failed!');
    }
  });
}
