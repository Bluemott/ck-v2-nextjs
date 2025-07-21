# Cowboy Kimonos Website

A modern Next.js website for Cowboy Kimonos featuring:

- **Responsive Design**: Optimized for all devices
- **Blog Integration**: WordPress REST API integration with pagination
- **Shop Integration**: Etsy RSS feed integration for product display
- **Interactive Components**: Floating social media icons and navigation
- **Optimized Images**: Next.js Image optimization for all assets

## Features

### 🏠 Homepage
- Hero section with brand imagery
- About section with company information
- Featured blog posts preview
- Responsive navigation and footer

### 📝 Blog
- WordPress API integration
- Pagination support
- Featured images
- Responsive card layout
- Individual post pages with full content

### 🛍️ Shop
- Etsy RSS feed integration
- Product grid layout
- Direct links to Etsy listings
- Product images and descriptions

### 📱 Components
- Responsive navbar with logo
- Floating social media icons
- Reusable footer
- Under construction page for about section

## Tech Stack

- **Framework**: Next.js 15.3.4
- **Styling**: Tailwind CSS 4.0
- **Language**: TypeScript
- **Image Optimization**: Next.js Image component
- **API Integration**: WordPress REST API, Etsy RSS feed
- **Deployment**: AWS Amplify

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

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

4. **Environment Variables** (if needed):
   - Add any environment variables in the Amplify console
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
- Endpoint: `https://api.cowboykimono.com/wp-json/wp/v2/posts`
- Features: Pagination, featured images, full content
- Next.js config allows images from `cowboykimono.com`

### Etsy Shop
- RSS Feed: `https://www.etsy.com/shop/CowboyKimono/rss`
- CORS Proxy: `https://api.allorigins.win/raw?url=`
- Next.js config allows images from Etsy CDNs

## Performance Optimizations

- Next.js Image optimization for all images
- Responsive image loading
- CSS-in-JS with Tailwind CSS
- Build-time optimization
- Caching configuration for faster builds

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

Private repository - All rights reserved.

## Image Optimization & AWS Amplify Compatibility

### Migration to SimpleImage Component

This project has been fully migrated from Next.js Image components to a custom `SimpleImage` component for maximum AWS Amplify compatibility:

- **Removed**: OptimizedImage component (Next.js Image wrapper)
- **Added**: SimpleImage component using standard `<img>` tags
- **Benefits**: 
  - Full compatibility with AWS Amplify static hosting
  - Robust loading states and error handling
  - Graceful fallbacks to placeholder images
  - No hydration issues in production

### Optimized Images

The `/public/images` directory contains optimized versions of images:
- WebP format for better compression and performance
- Properly sized images for web display
- Fallback formats (PNG, JPG) for older browsers

### Image Loading Strategy

1. **Local Images**: Served directly from `/public/images`
2. **External Images**: Loaded from WordPress, Etsy (with CORS handling)
3. **Fallbacks**: Placeholder SVG for failed image loads
4. **Loading States**: Visual feedback during image loading

## SEO & Analytics Setup

### 🔍 Complete SEO Implementation

The site now includes comprehensive SEO optimization:

#### Core SEO Components:
- **Meta Tags**: Dynamic title, description, keywords for each page
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Optimized Twitter sharing
- **Structured Data**: JSON-LD schema markup for better search engine understanding
- **Sitemap**: Auto-generated XML sitemap
- **Robots.txt**: Search engine crawling instructions
- **Manifest**: PWA capabilities for mobile optimization

#### SEO Files Added:
- `app/lib/seo.ts` - Main SEO configuration and metadata generation
- `app/components/StructuredData.tsx` - JSON-LD structured data
- `app/sitemap.ts` - XML sitemap generation
- `app/robots.ts` - Robots.txt configuration
- `app/manifest.ts` - PWA manifest

### 📊 Google Analytics 4 Integration

#### Analytics Components:
- `app/components/Analytics.tsx` - GA4 implementation with Next.js Script optimization
- `app/lib/analytics.ts` - Custom event tracking utilities

#### Analytics Features:
- **Page View Tracking**: Automatic page view tracking
- **Custom Events**: Button clicks, navigation, product views, etc.
- **E-commerce Tracking**: Product interactions and external link clicks
- **Performance Optimized**: Uses Next.js Script component with `afterInteractive` strategy

#### Setup Instructions:
1. **Get Google Analytics ID**:
   - Create a GA4 property at [Google Analytics](https://analytics.google.com)
   - Copy your Measurement ID (format: G-XXXXXXXXXX)

2. **Configure Environment Variables**:
   ```bash
   # In .env.local
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_SITE_URL=https://cowboykimonos.com
   ```

3. **Verification Codes** (optional):
   ```bash
   NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
   NEXT_PUBLIC_BING_VERIFICATION=your-bing-verification-code
   ```

### 🎯 SEO Best Practices Implemented

#### Page-Level SEO:
- **Homepage**: Optimized for brand and product keywords
- **About Page**: Company story and brand keywords
- **Blog**: Article-specific metadata and structured data
- **Shop**: Product and e-commerce focused optimization

#### Technical SEO:
- **Mobile-First**: Responsive design and mobile optimization
- **Page Speed**: Optimized images and lazy loading
- **Accessibility**: Proper alt tags, semantic HTML
- **Schema Markup**: Organization, Website, Blog, and Article schemas

#### Content SEO:
- **Keyword Optimization**: Strategic keyword placement
- **Meta Descriptions**: Compelling, action-oriented descriptions
- **Image SEO**: Optimized alt tags and file names
- **Internal Linking**: Strategic cross-page linking

### 🚀 Search Console Setup

#### Next Steps for Complete SEO:
1. **Google Search Console**:
   - Add and verify your domain
   - Submit your sitemap
   - Monitor search performance

2. **Bing Webmaster Tools**:
   - Add and verify your domain
   - Submit your sitemap

3. **Social Media**:
   - Test Open Graph tags with Facebook Debugger
   - Test Twitter Cards with Twitter Card Validator

### 📈 Analytics Events Implemented

The site includes comprehensive event tracking:

#### Automatic Tracking:
- Page views
- External link clicks
- Social media interactions
- Product views
- Navigation events

#### Custom Events Available:
- `trackButtonClick(buttonName, location)`
- `trackProductView(productName, productId)`
- `trackBlogPostView(postTitle)`
- `trackExternalLink(url, linkText)`
- `trackSocialMediaClick(platform, location)`

### 🔧 Configuration Files

#### Environment Variables (.env.local):
```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://cowboykimonos.com
NEXT_PUBLIC_SITE_NAME="Cowboy Kimonos"

# Social Media
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/cowboykimonos
NEXT_PUBLIC_FACEBOOK_URL=https://www.facebook.com/cowboykimonos
NEXT_PUBLIC_ETSY_URL=https://www.etsy.com/shop/CowboyKimono

# SEO Verification Codes
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_BING_VERIFICATION=your-bing-verification-code
```

### ✅ SEO Checklist

#### Before Deployment:
- [ ] Add actual Google Analytics Measurement ID
- [ ] Update Google Search Console verification code
- [ ] Update Bing Webmaster Tools verification code
- [ ] Test all meta tags with social media debuggers
- [ ] Verify sitemap accessibility
- [ ] Check robots.txt functionality
- [ ] Test structured data with Google's Rich Results Test

#### After Deployment:
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Monitor Core Web Vitals
- [ ] Set up Google Analytics goals and conversions
- [ ] Monitor search rankings and traffic

### 📱 Progressive Web App (PWA) Features

The site includes basic PWA capabilities:
- Web App Manifest for mobile app-like experience
- Proper theme colors and icons
- Offline-ready structure (can be extended)

## Project Cleanup and Long-term Deployment

### Recent Cleanup (December 2024)

The project has been cleaned up for long-term deployment by removing unnecessary development and setup files:

#### Removed Files:
- **WordPress Setup Files**: Configuration templates and setup scripts
- **EC2 Setup Files**: Server setup scripts and guides
- **Deployment Scripts**: Outdated deployment scripts
- **Troubleshooting Files**: Development diagnostic files
- **Alternative Configs**: Backup configuration files

#### Current Clean Structure:
```
ck-v2-nextjs/
├── app/                          # Next.js App Router
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── amplify.yml                   # AWS Amplify deployment
├── ck-v2-nextjs.md              # Project documentation
├── README.md                     # Project readme
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript configuration
```

### Benefits of Cleanup:
- **Reduced Repository Size**: Removed ~50MB of unnecessary files
- **Cleaner Development**: Focus on production-ready code only
- **Easier Maintenance**: Less clutter, clearer project structure
- **Faster Builds**: Reduced file scanning and processing
- **Better Security**: Removed sensitive configuration templates

### Production Readiness:
- **Essential Files Only**: Only production-necessary files remain
- **Clean Documentation**: Updated documentation reflects current state
- **Optimized Build**: Streamlined for AWS Amplify deployment
- **Environment Management**: Proper `.env.local` configuration
- **Deployment Ready**: Clean, maintainable codebase

For detailed project documentation, see `ck-v2-nextjs.md`.

---
