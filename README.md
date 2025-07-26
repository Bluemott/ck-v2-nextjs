# Cowboy Kimonos Website

A modern Next.js website for Cowboy Kimonos featuring:

- **Responsive Design**: Optimized for all devices
- **Blog Integration**: WordPress WPGraphQL integration with pagination
- **Shop Integration**: Etsy RSS feed integration for product display
- **Interactive Components**: Floating social media icons and navigation
- **Optimized Images**: Next.js Image optimization for all assets
- **Advanced SEO**: Complete SEO optimization with structured data

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
- **GraphQL Endpoint**: `https://api.cowboykimono.com/graphql`
- **Features**: WPGraphQL integration, pagination, featured images, full content
- **SEO**: Yoast SEO integration with structured data

### Etsy Shop
- **RSS Feed**: `https://www.etsy.com/shop/CowboyKimono/rss`
- **CORS Proxy**: `https://api.allorigins.win/raw?url=`
- **Next.js config**: Allows images from Etsy CDNs

## Performance Optimizations

- Next.js Image optimization for all images
- Responsive image loading
- CSS-in-JS with Tailwind CSS
- Build-time optimization
- Caching configuration for faster builds
- Pinterest-style masonry layout for blog

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

---

For detailed project documentation, see `ck-v2-nextjs.md`.
