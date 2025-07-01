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

### Troubleshooting Deployment Issues

If your deployment fails, try these solutions:

#### Option 1: Standard SSR Build (Current Configuration)
The current setup uses `output: 'standalone'` for server-side rendering:

```typescript
// next.config.ts
output: 'standalone'
```

#### Option 2: Static Export (If SSR fails)
If the SSR build fails, switch to static export:

1. **Replace `next.config.ts` with `next.config.static.ts`**:
   ```bash
   mv next.config.ts next.config.backup.ts
   mv next.config.static.ts next.config.ts
   ```

2. **Replace `amplify.yml` with `amplify.static.yml`**:
   ```bash
   mv amplify.yml amplify.backup.yml
   mv amplify.static.yml amplify.yml
   ```

3. **Commit and push the changes**

#### Common Issues and Solutions:

1. **Node.js Version**: 
   - Amplify uses Node.js 18 by default
   - Added `engines` field to package.json to specify Node.js >= 18

2. **Build Timeout**:
   - Increased verbosity in build commands for better debugging
   - Added caching to speed up builds

3. **Memory Issues**:
   - Using `npm ci` instead of `npm install` for faster, more reliable installs
   - Caching node_modules between builds

4. **Image Loading Issues**:
   - **Problem**: Images loading slowly or not at all on deployed site
   - **Solution**: Added `unoptimized: true` to Next.js config for better Amplify compatibility
   - **Enhanced**: Created `OptimizedImage` component with loading states and error handling
   - **Fallbacks**: Added placeholder images and graceful error states

5. **Image Optimization**:
   - All external image domains are properly configured
   - Static export version includes `unoptimized: true` for images
   - Custom `OptimizedImage` component provides loading states and fallbacks

#### Build Configuration Options

**Current (SSR):**
```yaml
artifacts:
  baseDirectory: .next
  files:
    - '**/*'
```

**Static Export Alternative:**
```yaml
artifacts:
  baseDirectory: out
  files:
    - '**/*'
```

### Build Configuration

The `amplify.yml` file is configured for Next.js SSR deployment:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: /
```

### Domain Configuration

After deployment:
1. Your app will be available at a generated Amplify URL
2. You can add a custom domain in the Amplify console
3. Amplify provides free SSL certificates for custom domains

## API Integrations

### WordPress Blog
- Endpoint: `https://cowboykimono.com/blog.html/wp-json/wp/v2/posts`
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
