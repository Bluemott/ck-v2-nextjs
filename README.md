# Cowboy Kimonos Website

A modern Next.js website for Cowboy Kimonos featuring:

- **Responsive Design**: Optimized for all devices
- **Blog Integration**: WordPress WPGraphQL integration with pagination
- **Shop Integration**: Etsy RSS feed integration for product display
- **Interactive Components**: Floating social media icons and navigation
- **Optimized Images**: Next.js Image optimization for all assets
- **Advanced SEO**: Complete SEO optimization with structured data
- **AWS Integration**: Serverless GraphQL API with Aurora database

## Features

### 🏠 Homepage
- Hero section with brand imagery
- About section with company information
- Featured blog posts preview
- Responsive navigation and footer

### 📝 Blog
- WordPress WPGraphQL integration
- Pinterest-style masonry layout
- Advanced search functionality
- Pagination support
- Related posts algorithm
- Individual post pages with full content
- **NEW**: AWS GraphQL API integration for improved performance

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

## Tech Stack

- **Framework**: Next.js 15.3.4
- **Styling**: Tailwind CSS 4.0
- **Language**: TypeScript
- **Image Optimization**: Next.js Image component
- **API Integration**: WordPress WPGraphQL, Etsy RSS feed
- **Deployment**: AWS Amplify
- **SEO**: Yoast SEO integration, structured data, IndexNow
- **AWS Services**: Lambda, Aurora Serverless, API Gateway, CloudFront

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
# WordPress API
NEXT_PUBLIC_WPGRAPHQL_URL=https://api.cowboykimono.com/graphql

# AWS GraphQL API (optional - for enhanced performance)
NEXT_PUBLIC_AWS_GRAPHQL_URL=https://your-api-gateway-url/prod/graphql
NEXT_PUBLIC_USE_AWS_GRAPHQL=false

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
NEXT_PUBLIC_GTM_ID=your-gtm-id
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-verification-code

# AWS S3 (for media uploads)
AWS_S3_BUCKET=your-s3-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Deployment to AWS Amplify

This project is configured for deployment to AWS Amplify via GitHub integration.

### Prerequisites
- GitHub repository
- AWS Account with Amplify access

### Setup Steps

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository

2. **Connect to Amplify**:
   - Go to AWS Amplify Console
   - Choose "Host your web app"
   - Select GitHub as your repository service
   - Authorize AWS Amplify to access your GitHub account
   - Select your repository and branch

3. **Build Settings**: 
   - Amplify will automatically detect the `amplify.yml` file
   - The build process is configured to:
     - Install dependencies with `npm ci`
     - Build the project with `npm run build`
     - Cache `node_modules` and `.next/cache` for faster builds

4. **Environment Variables**:
   - Add all required environment variables in the Amplify console
   - Go to App Settings > Environment variables

5. **Deploy**: 
   - Click "Save and deploy"
   - Amplify will build and deploy your app
   - Subsequent pushes to your main branch will trigger automatic deployments

### Build Configuration

The `amplify.yml` file is configured for Next.js SSR deployment:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Starting preBuild phase"
        - node --version
        - npm --version
        - echo "Installing dependencies..."
        - npm ci
        - echo "Dependencies installed successfully"
    build:
      commands:
        - echo "Starting build phase"
        - echo "Running Next.js build..."
        - npm run build
        - echo "Build completed successfully"
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Domain Configuration

After deployment:
1. Your app will be available at a generated Amplify URL
2. You can add a custom domain in the Amplify console
3. Amplify provides free SSL certificates for custom domains

## API Integrations

### WordPress Blog
- **GraphQL Endpoint**: `https://api.cowboykimono.com/graphql`
- **Features**: WPGraphQL integration, pagination, featured images, full content
- **SEO**: Yoast SEO integration with structured data
- **AWS Integration**: Optional serverless GraphQL API for enhanced performance

### Etsy Shop
- **RSS Feed**: `https://www.etsy.com/shop/CowboyKimono/rss`
- **CORS Proxy**: `https://api.allorigins.win/raw?url=`
- **Next.js config**: Allows images from Etsy CDNs

### AWS GraphQL API (Optional)
- **Endpoint**: Configurable via environment variables
- **Features**: Serverless GraphQL with Aurora database
- **Performance**: Reduced latency and improved scalability
- **Activation**: Set `NEXT_PUBLIC_USE_AWS_GRAPHQL=true` in environment

## Performance Optimizations

- Next.js Image optimization for all images
- Responsive image loading
- CSS-in-JS with Tailwind CSS
- Build-time optimization
- Caching configuration for faster builds
- Pinterest-style masonry layout for blog
- AWS CloudFront integration for global CDN
- Lambda function optimization for API calls

## SEO & Analytics

### Complete SEO Implementation
- **Meta Tags**: Dynamic title, description, keywords for each page
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Optimized Twitter sharing
- **Structured Data**: JSON-LD schema markup
- **Sitemap**: Auto-generated XML sitemap
- **Robots.txt**: Search engine crawling instructions
- **IndexNow**: Instant search engine indexing

### Google Analytics 4 Integration
- **Page View Tracking**: Automatic page view tracking
- **Custom Events**: Button clicks, navigation, product views
- **E-commerce Tracking**: Product interactions and external link clicks
- **Performance Optimized**: Uses Next.js Script component

## Development Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run type-check            # TypeScript type checking

# AWS Infrastructure
npm run deploy:infrastructure # Deploy AWS CDK infrastructure
npm run deploy:lambda         # Deploy Lambda functions
npm run test:aws-graphql      # Test AWS GraphQL API

# Testing
npm run test:build            # Test build process
npm run check:workspaces      # Check workspace dependencies
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run lint` and `npm run type-check`
5. Submit a pull request

## Next Steps

### Immediate Tasks
1. **AWS GraphQL API Setup**: Configure the serverless GraphQL API for production use
2. **Data Migration**: Import WordPress content to Aurora database
3. **Performance Testing**: Benchmark API performance improvements
4. **Monitoring**: Set up CloudWatch monitoring for AWS services

### Future Enhancements
1. **Media Management**: Implement S3-based media upload system
2. **Caching Strategy**: Implement Redis caching for frequently accessed data
3. **CDN Optimization**: Configure CloudFront for optimal content delivery
4. **Security**: Implement WAF and additional security measures

## License

Private repository - All rights reserved.

---

For detailed project documentation, see `ck-v2-nextjs.md`.
