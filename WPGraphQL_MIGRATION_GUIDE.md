# WPGraphQL Migration Guide for Cowboy Kimono v2

## Overview

This guide provides step-by-step instructions for migrating from WordPress REST API to WPGraphQL for better performance, flexibility, and modern GraphQL-based data querying.

## Benefits of WPGraphQL

### Performance Improvements
- **Single Request**: Fetch multiple related data types in one request
- **Reduced Over-fetching**: Only request the data you need
- **Better Caching**: GraphQL responses are more cacheable
- **Faster Loading**: Fewer HTTP requests mean faster page loads

### Developer Experience
- **Type Safety**: Better TypeScript integration with GraphQL schema
- **IntelliSense**: Better IDE support with GraphQL queries
- **Flexible Queries**: Request exactly the data you need
- **Real-time Schema**: GraphQL introspection provides live schema information

### Advanced Features
- **SEO Integration**: Built-in SEO metadata support
- **Custom Fields**: Easy integration with custom fields (if needed)
- **WooCommerce**: Full e-commerce integration when needed
- **Real-time Updates**: Better support for real-time features

## Step 1: WordPress Plugin Installation

### 1.1 Install Core WPGraphQL Plugin

1. **Access WordPress Admin**: Go to `https://admin.cowboykimono.com`
2. **Navigate to Plugins**: Go to Plugins → Add New
3. **Search for WPGraphQL**: Search for "WPGraphQL" by WPGraphQL
4. **Install and Activate**: Click "Install Now" then "Activate"

### 1.2 Install Recommended Extensions

#### WPGraphQL for Yoast SEO (SEO Support)
1. Search for "WPGraphQL for Yoast SEO"
2. Install and activate the plugin
3. This provides SEO metadata in GraphQL queries



#### WPGraphQL for WooCommerce (Future E-commerce)
1. Search for "WPGraphQL for WooCommerce"
2. Install and activate when ready for e-commerce features
3. Provides full WooCommerce integration

### 1.3 Configure WPGraphQL Settings

1. **Access Settings**: Go to GraphQL → Settings
2. **General Settings**:
   - Enable GraphQL endpoint at `/graphql`
   - Enable public introspection (default: enabled)
   - Set up any custom post types or taxonomies
3. **Access Control**:
   - Configure public access settings
   - Set up authentication if needed

## Step 2: Environment Configuration

### 2.1 Update Environment Variables

Your existing environment variables will work, but you can optionally add:

```env
# WordPress GraphQL Configuration
NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL=https://api.cowboykimono.com/graphql

# Keep existing REST API URL for gradual migration
NEXT_PUBLIC_WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
```

### 2.2 GraphQL Endpoint

The GraphQL endpoint will be available at:
- **URL**: `https://api.cowboykimono.com/graphql`
- **GraphiQL IDE**: `https://api.cowboykimono.com/graphql` (when logged in as admin)

## Step 3: Next.js Implementation

### 3.1 Install Dependencies

The GraphQL dependency has been added to `package.json`:

```bash
npm install
```

### 3.2 New WPGraphQL Integration

The new WPGraphQL integration is available in `app/lib/wpgraphql.ts` with:

- **TypeScript Interfaces**: Full typing for GraphQL responses
- **GraphQL Queries**: Optimized queries for posts, categories, tags
- **Utility Functions**: Image handling, SEO metadata, pagination
- **Compatibility Layer**: Convert GraphQL data to REST API format

### 3.3 Key Functions Available

```typescript
// Core functions
import { 
  fetchPosts, 
  fetchPostBySlug, 
  fetchCategories, 
  fetchTags,
  fetchCategoryBySlug,
  fetchTagBySlug,
  fetchPostsWithPagination,
  fetchRelatedPosts
} from '../lib/wpgraphql';

// Utility functions
import {
  getFeaturedImageUrl,
  getFeaturedImageAlt,
  decodeHtmlEntities,
  convertToWordPressPost
} from '../lib/wpgraphql';
```

## Step 4: Gradual Migration Strategy

### 4.1 Phase 1: Parallel Implementation

1. **Keep Existing Code**: Current REST API code continues to work
2. **Add GraphQL Functions**: New WPGraphQL functions are available
3. **Test Both**: Compare performance and functionality
4. **Monitor Performance**: Use browser dev tools to measure improvements

### 4.2 Phase 2: Component Migration

1. **Blog Components**: Migrate `WordPressBlog.tsx` to use GraphQL
2. **Individual Posts**: Update `[slug]/page.tsx` for GraphQL
3. **Category/Tag Pages**: Migrate archive pages
4. **Sidebar Components**: Update `BlogSidebar.tsx`

### 4.3 Phase 3: Full Migration

1. **Remove REST API Code**: Clean up old WordPress REST API code
2. **Update All Components**: Ensure all components use GraphQL
3. **Performance Testing**: Verify performance improvements
4. **Documentation Update**: Update project documentation

## Step 5: Testing and Validation

### 5.1 GraphQL Endpoint Testing

1. **Test GraphQL Endpoint**: Visit `https://api.cowboykimono.com/graphql`
2. **Use GraphiQL IDE**: Test queries in the browser interface
3. **Verify Schema**: Check that all post types and fields are available

### 5.2 Sample GraphQL Queries

#### Test Posts Query
```graphql
query {
  posts(first: 5) {
    nodes {
      id
      title
      slug
      date
      author {
        node {
          name
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
}
```

#### Test Single Post Query
```graphql
query {
  post(id: "your-post-slug", idType: SLUG) {
    title
    content
    excerpt
    author {
      node {
        name
      }
    }
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    categories {
      nodes {
        name
        slug
      }
    }
  }
}
```

### 5.3 Performance Comparison

#### Before (REST API)
- Multiple HTTP requests for related data
- Over-fetching of unnecessary data
- Slower page loads

#### After (GraphQL)
- Single request for all needed data
- Precise data fetching
- Faster page loads
- Better caching

## Step 6: Advanced Features

### 6.1 SEO Integration

WPGraphQL provides built-in SEO metadata:

```typescript
// SEO data is automatically included in post queries
const post = await fetchPostBySlug('example-post');
console.log(post.seo?.title); // SEO title
console.log(post.seo?.metaDesc); // Meta description
console.log(post.seo?.opengraphImage?.sourceUrl); // OG image
```

### 6.2 Custom Fields Support

If using custom fields in the future:

```typescript
// Custom fields can be added when needed
const post = await fetchPostBySlug('example-post');
// Custom field access would be implemented here
```

### 6.3 Real-time Features

GraphQL subscriptions for real-time updates:

```typescript
// Future: Real-time post updates
const subscription = graphqlRequest(`
  subscription {
    postUpdated {
      id
      title
      content
    }
  }
`);
```

## Step 7: Troubleshooting

### 7.1 Common Issues

#### GraphQL Endpoint Not Found
- **Check Plugin**: Ensure WPGraphQL plugin is activated
- **Check URL**: Verify endpoint at `/graphql`
- **Check Permissions**: Ensure public access is enabled

#### Missing Fields in Queries
- **Check Schema**: Use GraphiQL to explore available fields
- **Check Extensions**: Ensure required extensions are installed
- **Check Permissions**: Some fields may require authentication

#### Performance Issues
- **Optimize Queries**: Only request needed fields
- **Use Pagination**: Implement cursor-based pagination
- **Enable Caching**: Configure GraphQL caching

### 7.2 Debug Tools

#### GraphiQL IDE
- **URL**: `https://api.cowboykimono.com/graphql`
- **Features**: Interactive query testing, schema exploration
- **Authentication**: Login as admin for full access

#### Browser Dev Tools
- **Network Tab**: Monitor GraphQL requests
- **Performance Tab**: Compare REST vs GraphQL performance
- **Console**: Check for GraphQL errors

## Step 8: Production Deployment

### 8.1 Pre-deployment Checklist

- [ ] WPGraphQL plugin installed and configured
- [ ] GraphQL endpoint accessible and tested
- [ ] New WPGraphQL functions implemented
- [ ] Performance testing completed
- [ ] Error handling implemented
- [ ] Documentation updated

### 8.2 Deployment Steps

1. **Install Plugins**: Install WPGraphQL plugins on production
2. **Deploy Code**: Deploy updated Next.js code
3. **Test Endpoints**: Verify GraphQL endpoint works
4. **Monitor Performance**: Track performance improvements
5. **Gradual Rollout**: Migrate components one by one

### 8.3 Monitoring

#### Performance Metrics
- **Page Load Times**: Compare before/after
- **Network Requests**: Count HTTP requests
- **Bundle Size**: Monitor JavaScript bundle size
- **User Experience**: Track user engagement metrics

#### Error Monitoring
- **GraphQL Errors**: Monitor GraphQL query errors
- **Network Errors**: Track failed requests
- **User Reports**: Monitor user feedback

## Benefits Summary

### Immediate Benefits
- **Better Performance**: Fewer HTTP requests, faster loading
- **Type Safety**: Better TypeScript integration
- **Developer Experience**: Better IDE support and debugging
- **Flexibility**: Request exactly the data you need

### Long-term Benefits
- **Scalability**: Better performance as content grows
- **Advanced Features**: SEO, custom fields, real-time updates
- **E-commerce Ready**: WooCommerce integration when needed
- **Future-proof**: Modern GraphQL architecture

### Migration Timeline
- **Week 1**: Install plugins, test GraphQL endpoint
- **Week 2**: Implement new functions, test performance
- **Week 3**: Migrate blog components
- **Week 4**: Full migration, cleanup, documentation

This migration will significantly improve your website's performance and provide a solid foundation for future features and growth. 