# GraphQL Setup & API Gateway Compatibility

## Overview

This document explains the GraphQL setup for Cowboy Kimono's blog system, including the WordPress GraphQL integration and the AWS Lambda-based GraphQL proxy that ensures API Gateway compatibility.

## Architecture

```
Frontend → CloudFront → API Gateway → Lambda → WordPress (Lightsail)
```

### Components

1. **WordPress GraphQL (WPGraphQL)**: Primary data source with rich schema
2. **AWS Lambda GraphQL**: Proxy/transformer that matches WordPress schema
3. **API Gateway**: AWS service that requires specific data formats
4. **CloudFront**: CDN for global content delivery
5. **Next.js Frontend**: React application consuming GraphQL data

## The Problem

AWS API Gateway was rejecting GraphQL responses from the Lambda function because:

1. **Schema Mismatch**: Lambda returned flat objects while WordPress uses nested structures
2. **Missing Fields**: Lambda schema lacked critical fields like `databaseId`, nested `author.node`, etc.
3. **Incompatible Types**: API Gateway expected specific data structures that didn't match

## The Solution

### 1. Updated Lambda GraphQL Schema

The Lambda function now returns data in the exact same structure as WordPress GraphQL:

```javascript
// Before (incompatible)
{
  id: "post-1",
  title: "Post Title",
  author: "Cowboy Kimono"
}

// After (compatible)
{
  id: "post-1",
  databaseId: 1,
  title: "Post Title",
  author: {
    node: {
      id: "author-1",
      databaseId: 1,
      name: "Cowboy Kimono",
      slug: "cowboy-kimono",
      avatar: { url: null }
    }
  }
}
```

### 2. Nested Object Structure

All complex objects now use the WordPress GraphQL pattern:

```javascript
// Categories and Tags
categories: {
  nodes: [
    {
      id: "category-1",
      databaseId: 1,
      name: "Crafts",
      slug: "crafts",
      description: "Craft tutorials",
      count: 5
    }
  ]
}

// Featured Images
featuredImage: {
  id: "media-1",
  databaseId: 1,
  sourceUrl: "https://...",
  altText: "Image description",
  mediaDetails: {
    width: 800,
    height: 600,
    sizes: [...]
  }
}
```

### 3. SEO Fields Support

The Lambda now includes all WordPress SEO fields:

```javascript
seo: {
  title: "SEO Title",
  metaDesc: "Meta description",
  canonical: "https://...",
  opengraphTitle: "OG Title",
  opengraphDescription: "OG Description",
  opengraphImage: { sourceUrl: "https://..." },
  twitterTitle: "Twitter Title",
  twitterDescription: "Twitter Description",
  twitterImage: { sourceUrl: "https://..." },
  focuskw: "keyword",
  metaKeywords: "keywords",
  metaRobotsNoindex: "index",
  metaRobotsNofollow: "follow",
  opengraphType: "article",
  opengraphUrl: "https://...",
  opengraphSiteName: "Cowboy Kimono",
  opengraphAuthor: "Cowboy Kimono",
  opengraphPublishedTime: "2024-01-01T00:00:00Z",
  opengraphModifiedTime: "2024-01-01T00:00:00Z",
  schema: { raw: "..." }
}
```

## Files Updated

### Lambda Function
- `lambda/graphql/index.js`: Updated schema and resolvers to match WordPress structure

### Frontend Client
- `app/lib/aws-graphql.ts`: Updated TypeScript interfaces and queries
- `app/lib/api.ts`: Updated API layer for compatibility

### Deployment Scripts
- `scripts/deploy-lambda-graphql.js`: New deployment script
- `scripts/test-graphql-schema.js`: Schema compatibility testing

## Usage

### Deploy Lambda Function

```bash
npm run deploy:lambda-graphql
```

### Test Schema Compatibility

```bash
npm run test:graphql-schema
```

### Switch Between APIs

Set environment variables:

```bash
# Use AWS GraphQL (recommended for production)
NEXT_PUBLIC_USE_AWS_GRAPHQL=true
NEXT_PUBLIC_AWS_GRAPHQL_URL=https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql

# Use WordPress GraphQL (fallback)
NEXT_PUBLIC_USE_AWS_GRAPHQL=false
NEXT_PUBLIC_WPGRAPHQL_URL=https://api.cowboykimono.com/graphql
```

## SEO Benefits

The updated GraphQL setup maintains full SEO compatibility:

1. **Structured Data**: All schema.org markup preserved
2. **Meta Tags**: Complete Open Graph and Twitter Card support
3. **Yoast SEO**: Full integration with WordPress SEO plugin
4. **Performance**: Lambda caching improves page load times
5. **CDN**: CloudFront provides global content delivery

## Monitoring

### CloudWatch Logs

Monitor Lambda function performance:

```bash
aws logs tail /aws/lambda/cowboy-kimono-graphql --follow
```

### API Gateway Metrics

Track API Gateway performance in AWS Console:
- Request count
- Latency
- Error rates
- Cache hit rates

## Troubleshooting

### Common Issues

1. **Schema Errors**: Run `npm run test:graphql-schema` to verify compatibility
2. **Timeout Errors**: Check Lambda function timeout settings (currently 8 seconds)
3. **CORS Errors**: Verify API Gateway CORS configuration
4. **Database Errors**: Check Aurora connection settings

### Debug Commands

```bash
# Test AWS GraphQL endpoint
curl -X POST https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ posts(first: 1) { nodes { id title } } }"}'

# Test WordPress GraphQL endpoint
curl -X POST https://api.cowboykimono.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ posts(first: 1) { nodes { id title } } }"}'
```

## Performance Optimization

### Lambda Configuration

- **Memory**: 512MB (sufficient for GraphQL operations)
- **Timeout**: 8 seconds (optimized for cost)
- **Concurrency**: Auto-scaling based on demand

### Caching Strategy

- **CloudFront**: Static content caching
- **API Gateway**: Response caching (if enabled)
- **Lambda**: Connection pooling for database

### Cost Optimization

- **Cold Start**: Lambda functions optimized for quick startup
- **Connection Pooling**: Database connections reused
- **Query Optimization**: Efficient GraphQL queries

## Future Enhancements

1. **Redis Caching**: Add Redis for frequently accessed data
2. **Real-time Updates**: WebSocket support for live content
3. **Advanced Search**: Elasticsearch integration
4. **Media Optimization**: S3-based media management
5. **Analytics**: Enhanced tracking and reporting

## Security

### API Gateway Security

- **API Keys**: Optional authentication
- **Rate Limiting**: Built-in protection
- **CORS**: Properly configured for frontend
- **HTTPS**: SSL/TLS encryption

### Lambda Security

- **IAM Roles**: Least privilege access
- **Environment Variables**: Secure configuration
- **VPC**: Network isolation (if needed)
- **Secrets Manager**: Database credentials

## Conclusion

The updated GraphQL setup ensures:

✅ **API Gateway Compatibility**: Lambda returns data in expected format  
✅ **SEO Preservation**: All WordPress SEO features maintained  
✅ **Performance**: Optimized for speed and cost  
✅ **Scalability**: Auto-scaling with demand  
✅ **Reliability**: Fallback to WordPress GraphQL if needed  

This architecture provides the best of both worlds: WordPress's rich content management with AWS's scalable infrastructure. 