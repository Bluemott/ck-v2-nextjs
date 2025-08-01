# Cowboy Kimonos Website

A modern Next.js website for Cowboy Kimonos featuring:

- **Responsive Design**: Optimized for all devices
- **Blog Integration**: WordPress REST API integration with pagination
- **Shop Integration**: Etsy RSS feed integration for product display
- **Interactive Components**: Floating social media icons and navigation
- **Optimized Images**: Next.js Image optimization for all assets
- **Advanced SEO**: Complete SEO optimization with structured data
- **AWS Integration**: Serverless REST API with enhanced recommendations

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
- **API Integration**: WordPress REST API, Etsy RSS feed
- **Deployment**: AWS Amplify
- **SEO**: Yoast SEO integration, structured data, IndexNow
- **AWS Services**: Lambda, API Gateway, CloudFront

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

# AWS Configuration (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-s3-bucket

# WordPress Admin
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com

# CloudFront (optional)
NEXT_PUBLIC_CLOUDFRONT_URL=https://your-cloudfront-distribution.cloudfront.net
```

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # TypeScript type checking
npm run build:simple     # Simple build process
npm run test:build       # Test build process
npm run deploy:infrastructure  # Deploy AWS infrastructure
```

## Deployment

### AWS Amplify

The project is configured for AWS Amplify deployment with:

- **Build Configuration**: Optimized for REST API usage
- **Environment Variables**: Properly configured for production
- **Caching**: Static asset optimization
- **Performance**: Next.js Image optimization

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to your hosting platform

## Architecture

### Frontend
- **Next.js 15.3.4**: App Router with server components
- **React 19**: Latest React features
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling

### Backend Integration
- **WordPress REST API**: Primary content source
- **Etsy RSS Feed**: Shop product integration
- **AWS Lambda**: Serverless functions for recommendations

### Performance Optimizations
- **Static Generation**: Pre-rendered pages for SEO
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic bundle optimization
- **Caching**: Strategic caching for performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary to Cowboy Kimono.

## Support

For support, contact the development team or create an issue in the repository.
