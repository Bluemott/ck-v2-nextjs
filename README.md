# Cowboy Kimonos Website

A modern Next.js website for Cowboy Kimonos featuring:

- **Responsive Design**: Optimized for all devices
- **Blog Integration**: WordPress REST API integration with pagination
- **Shop Integration**: Etsy RSS feed integration for product display
- **Interactive Components**: Floating social media icons and navigation
- **Optimized Images**: Next.js Image optimization for all assets
- **Advanced SEO**: Complete SEO optimization with structured data
- **AWS Integration**: Serverless REST API with enhanced recommendations
- **Monitoring & Logging**: Comprehensive CloudWatch monitoring and X-Ray tracing
- **Caching Strategy**: Intelligent caching to reduce API calls

## Features

### 🏠 Homepage
- Hero section with brand imagery
- About section with company information
- Featured blog posts preview
- Responsive navigation and footer

### 📝 Blog
- WordPress REST API integration
- Pinterest-style masonry layout
- Advanced search functionality
- Pagination support
- Smart recommendations algorithm
- Individual post pages with full content
- **NEW**: Enhanced recommendations with Lambda functions
- **NEW**: Intelligent caching for improved performance

### 🛍️ Shop
- Etsy RSS feed integration
- Product grid layout
- Direct links to Etsy listings
- Product images and descriptions

### 📱 Components
- Responsive navbar with logo
- Floating social media icons
- Reusable footer
- SEO-optimized components

### 📊 Monitoring & Logging
- CloudWatch Dashboard for comprehensive monitoring
- X-Ray tracing for performance analysis
- Custom metrics and logging
- Cost monitoring and optimization
- Proactive alarms and notifications

## Tech Stack

- **Framework**: Next.js 15.3.4
- **Styling**: Tailwind CSS 4.0
- **Language**: TypeScript
- **Image Optimization**: Next.js Image component
- **API Integration**: WordPress REST API, Etsy RSS feed
- **Deployment**: AWS Amplify
- **SEO**: Yoast SEO integration, structured data, IndexNow
- **AWS Services**: Lambda, API Gateway, CloudFront, CloudWatch, X-Ray
- **Monitoring**: Custom metrics, logging, and tracing
- **Caching**: Memory-based caching with TTL management

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see `.env.local.example`)
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# WordPress REST API
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
NEXT_PUBLIC_GTM_ID=GTM-PNZTN4S4
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code

# AWS Configuration (for monitoring)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring Configuration
NEXT_PUBLIC_ENABLE_MONITORING=true
NEXT_PUBLIC_ENABLE_XRAY=true
NEXT_PUBLIC_LOG_GROUP_NAME=/aws/wordpress/application

# WordPress Admin
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com

# CloudFront (optional)
NEXT_PUBLIC_CLOUDFRONT_URL=https://your-cloudfront-distribution.cloudfront.net
```

## Available Scripts

```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run lint:fix              # Fix ESLint errors
npm run type-check            # Run TypeScript type checking
npm run deploy:infrastructure # Deploy AWS infrastructure
npm run deploy:monitoring     # Deploy monitoring stack
```

## Monitoring & Logging

The application includes comprehensive monitoring and logging:

### CloudWatch Dashboard
- Application performance metrics
- API Gateway monitoring
- CloudFront cache statistics
- Database performance metrics
- Lambda function monitoring
- Cost tracking and optimization

### X-Ray Tracing
- Distributed tracing across services
- Performance bottleneck identification
- Request flow visualization
- Error tracking and debugging

### Caching Strategy
- Memory-based caching with TTL
- Intelligent cache invalidation
- Cache hit/miss monitoring
- Performance optimization

For detailed setup instructions, see [MONITORING_SETUP.md](./MONITORING_SETUP.md).

## Project Structure

```
ck-v2-nextjs/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/              # Utility libraries
│   └── ...
├── infrastructure/        # AWS CDK infrastructure
├── lambda/               # Lambda functions
├── scripts/              # Data import scripts
├── public/               # Static assets
└── ...
```

## Deployment

The application is deployed on AWS Amplify with the following architecture:

- **Frontend**: Next.js on Amplify with CloudFront CDN
- **Backend**: WordPress on EC2 (headless CMS via REST API)
- **Serverless**: Lambda functions with API Gateway
- **Database**: Aurora Serverless for enhanced features
- **Storage**: S3 for static assets, images optimized via CloudFront
- **Monitoring**: CloudWatch, X-Ray, and custom metrics

## Support

For issues or questions:
1. Check CloudWatch logs first
2. Review X-Ray traces for performance issues
3. Check alarm history in CloudWatch
4. Review cost analysis in Cost Explorer

---

**Last Updated**: January 25, 2025  
**Version**: 2.0.0  
**Status**: Production Ready with Monitoring
