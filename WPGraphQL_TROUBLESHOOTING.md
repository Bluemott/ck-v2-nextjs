# WPGraphQL Troubleshooting Guide

## Overview

This guide addresses common GraphQL errors encountered when using WPGraphQL with the Cowboy Kimono v2 Next.js project.

## Common Errors and Solutions

### 1. "Unknown type PostObjectsConnectionWhereArgs"

**Error Message:**
```
GraphQL errors: Unknown type "PostObjectsConnectionWhereArgs". 
Did you mean "PostToCommentConnectionWhereArgs", "PostToTagConnectionWhereArgs", 
"PostToCategoryConnectionWhereArgs", "PostToRevisionConnectionWhereArgs", 
or "TagToPostConnectionWhereArgs"?
```

**Cause:** The GraphQL schema doesn't recognize the complex `PostObjectsConnectionWhereArgs` type.

**Solution:** ✅ **FIXED**
- Updated queries to use simplified filtering
- Removed complex `where` arguments
- Used basic GraphQL filtering instead

**Fixed Query Example:**
```graphql
# Before (causing error)
query GetPosts($where: PostObjectsConnectionWhereArgs) {
  posts(where: $where) { ... }
}

# After (working)
query GetPosts {
  posts(where: { status: PUBLISH }) { ... }
}
```

### 2. "Cannot query field 'seo' on type 'Post'"

**Error Message:**
```
Cannot query field "seo" on type "Post"
```

**Cause:** The SEO fields require the "WPGraphQL for Yoast SEO" plugin to be installed.

**Solution:** ✅ **FIXED**
- Made SEO fields optional in TypeScript interfaces
- Removed SEO fields from basic queries
- Added instructions for optional plugin installation

**Fixed Interface:**
```typescript
// Before (causing error)
seo: {
  title: string;
  metaDesc: string;
  // ...
}

// After (optional)
seo?: {
  title: string;
  metaDesc: string;
  // ...
} | null;
```

## WordPress Plugin Setup

### Required Plugin

1. **WPGraphQL Core Plugin**
   - Go to WordPress Admin: `https://admin.cowboykimono.com`
   - Navigate to: Plugins → Add New
   - Search for: "WPGraphQL"
   - Install and activate the plugin
   - GraphQL endpoint will be available at: `https://api.cowboykimono.com/graphql`

### Optional Plugins (for enhanced features)

2. **WPGraphQL for Yoast SEO** (for SEO fields)
   - Go to: Plugins → Add New
   - Search for: "WPGraphQL for Yoast SEO"
   - Install and activate
   - Enables SEO metadata in GraphQL queries


   - Go to: Plugins → Add New
   
   - Install and activate
   

4. **WPGraphQL for WooCommerce** (for e-commerce)
   - Go to: Plugins → Add New
   - Search for: "WPGraphQL for WooCommerce"
   - Install and activate
   - Provides WooCommerce data in GraphQL

## Testing GraphQL Endpoint

### 1. Test Basic Endpoint
Visit: `https://api.cowboykimono.com/graphql`

You should see a GraphiQL interface or a GraphQL response.

### 2. Test Simple Query
```graphql
query {
  posts(first: 1) {
    nodes {
      id
      title
      slug
    }
  }
}
```

### 3. Test Categories
```graphql
query {
  categories(first: 5) {
    nodes {
      id
      name
      slug
    }
  }
}
```

### 4. Test Tags
```graphql
query {
  tags(first: 5) {
    nodes {
      id
      name
      slug
    }
  }
}
```

## Development Testing

### 1. Use the Test Page
Visit: `http://localhost:3000/test-graphql`

This page will test all basic GraphQL queries and show results.

### 2. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for GraphQL error messages
- Check Network tab for failed requests

### 3. Monitor Network Requests
- Open Developer Tools (F12)
- Go to Network tab
- Filter by "graphql"
- Check request/response details

## Error Diagnosis

### Common Error Patterns

1. **404 Not Found**
   - WordPress plugin not installed
   - GraphQL endpoint not accessible
   - WordPress site down

2. **500 Internal Server Error**
   - WordPress plugin configuration issue
   - PHP memory limit exceeded
   - Plugin conflict

3. **GraphQL Schema Errors**
   - Plugin not activated
   - Wrong plugin version
   - Missing dependencies

4. **CORS Errors**
   - Cross-origin request blocked
   - WordPress CORS configuration
   - Browser security settings

## Debugging Steps

### Step 1: Verify WordPress Setup
1. Check WordPress admin: `https://admin.cowboykimono.com`
2. Verify WPGraphQL plugin is installed and activated
3. Check plugin settings in GraphQL → Settings

### Step 2: Test GraphQL Endpoint
1. Visit: `https://api.cowboykimono.com/graphql`
2. Try a simple query in GraphiQL
3. Check for error messages

### Step 3: Check Environment Variables
1. Verify `NEXT_PUBLIC_WORDPRESS_API_URL` is set correctly
2. Ensure GraphQL URL is derived properly
3. Check for typos in URLs

### Step 4: Test Individual Queries
1. Test posts query: `fetchPosts({ first: 1 })`
2. Test categories query: `fetchCategories()`
3. Test tags query: `fetchTags()`

### Step 5: Check Network Requests
1. Open browser Dev Tools
2. Go to Network tab
3. Filter by "graphql"
4. Check request/response details

## Performance Optimization

### 1. Query Optimization
- Only request needed fields
- Use pagination for large datasets
- Implement proper caching

### 2. Error Handling
- Graceful fallbacks for failed requests
- User-friendly error messages
- Retry logic for temporary failures

### 3. Caching Strategy
- Browser caching for static data
- Server-side caching for dynamic data
- CDN caching for better performance

## Monitoring and Maintenance

### 1. Regular Checks
- Monitor GraphQL endpoint availability
- Check for plugin updates
- Review error logs

### 2. Performance Monitoring
- Track query response times
- Monitor memory usage
- Check for slow queries

### 3. Security Considerations
- Keep plugins updated
- Monitor for security vulnerabilities
- Implement proper access controls

## Support Resources

### Documentation
- [WPGraphQL Documentation](https://docs.wpgraphql.com/)
- [WordPress GraphQL Schema](https://api.cowboykimono.com/graphql)

### Community
- [WPGraphQL GitHub](https://github.com/wp-graphql/wp-graphql)
- [WordPress Support Forums](https://wordpress.org/support/)

### Testing Tools
- GraphiQL IDE: `https://api.cowboykimono.com/graphql`
- Browser Dev Tools
- Network monitoring tools

## Recent Fixes Applied

### December 2024 Fixes
1. **Removed PostObjectsConnectionWhereArgs dependency**
2. **Made SEO fields optional**
3. **Simplified GraphQL queries**
4. **Improved error handling**
5. **Added comprehensive testing**

### Files Updated
- `app/lib/wpgraphql.ts` - Fixed GraphQL queries
- `ck-v2-nextjs.md` - Updated documentation
- `app/test-graphql/page.tsx` - Added test page

### Testing
- All basic queries now work with minimal WPGraphQL setup
- SEO fields are optional and require additional plugin
- Error handling provides clear feedback
- Test page available at `/test-graphql`

---

**Last Updated**: December 2024
**Status**: All major GraphQL issues resolved
**Compatibility**: Works with basic WPGraphQL installation 