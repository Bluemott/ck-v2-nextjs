# Cowboy Kimono v2 - Next.js Project Documentation

## Project Overview

**Cowboy Kimono v2** is a modern Next.js 15+ e-commerce and content website for handcrafted western-inspired robes and apparel. The project combines artistic content, e-commerce functionality, and a blog platform with a focus on sustainability and unique fashion.

### Key Features
- **E-commerce Platform**: Shop for handcrafted kimonos and apparel
- **Content Blog**: Artistic content and lifestyle posts
- **Download Resources**: Free craft templates and tutorials
- **SEO Optimized**: Comprehensive SEO implementation
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Analytics Integration**: Google Analytics and structured data

## Technology Stack

### Core Technologies
- **Next.js 15.3.4**: App Router with TypeScript
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Strict typing throughout
- **Tailwind CSS 4**: Utility-first CSS framework
- **Node.js 18+**: Runtime environment

### Key Dependencies
- `@tailwindcss/typography`: Enhanced typography styles
- `rss-parser`: RSS feed processing
- `next/font`: Google Fonts integration (Geist fonts)
- WordPress REST API: Headless CMS integration

### Development Tools
- **ESLint 9**: Code linting and quality
- **Turbopack**: Fast development builds
- **TypeScript**: Static type checking

## Project Architecture

### File Structure
```
ck-v2-nextjs/
├── app/                          # Next.js App Router
│   ├── components/               # Reusable UI components
│   ├── lib/                      # Utility functions and configurations
│   ├── [page]/                   # Route pages
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── public/                       # Static assets
│   ├── images/                  # Image assets
│   └── downloads/               # Downloadable resources
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

### App Router Structure
- **Layout-based**: Shared layout with Navbar, Footer, and FloatingSocialMedia
- **Page-based**: Individual pages for each route
- **Component-based**: Reusable components in `/app/components/`
- **Utility-based**: Helper functions in `/app/lib/`

## Component Architecture

### Core Components

#### Layout Components
- **Navbar**: Fixed navigation with logo and menu links
- **Footer**: Site footer with links and information
- **FloatingSocialMedia**: Floating social media buttons
- **StructuredData**: SEO structured data implementation

#### Page Components
- **Home**: Landing page with hero image and featured content
- **Shop**: E-commerce product listings
- **Blog**: Content blog with WordPress integration
- **About**: Company information and story
- **Downloads**: Free resource downloads

#### Utility Components
- **Analytics**: Google Analytics integration
- **GoogleTagManager**: GTM implementation
- **BlogSidebar**: Blog navigation and filtering
- **WordPressBlog**: WordPress CMS integration component
- **Admin Access**: WordPress admin portal integration via navbar and `/admin` route

### Component Patterns

#### TypeScript Interfaces
```typescript
interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}
```

#### Component Structure
```typescript
// Standard component pattern
import { Metadata } from "next";
import { generateSEOMetadata } from "./lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Page Title",
  description: "Page description",
  keywords: ["keyword1", "keyword2"],
  canonical: "/page-path",
});

export default function PageComponent() {
  return (
    <div className="container mx-auto px-4">
      {/* Component content */}
    </div>
  );
}
```

## Styling and Design System

### Tailwind CSS Configuration
- **Custom Colors**: Brand-specific color palette
- **Typography**: Geist font family integration
- **Responsive Design**: Mobile-first approach
- **Component Classes**: Consistent utility patterns

### Design Patterns
- **Hero Sections**: Full-width image sections with overlay content
- **Card Layouts**: Product and blog post cards with hover effects
- **Grid Systems**: Responsive grid layouts for content
- **Navigation**: Fixed navbar with smooth scrolling

### Color Palette
- **Primary**: `#c5e8f9` (Light blue for navbar)
- **Secondary**: `#FFEBCD` (Cream for sections)
- **Accent**: `#1e2939` (Dark blue for text)
- **Background**: `#f0f8ff` (Light blue for sections)

## SEO and Performance

### SEO Implementation
- **Metadata Generation**: Dynamic SEO metadata for all pages
- **Structured Data**: Organization and website structured data
- **Open Graph**: Social media optimization
- **Twitter Cards**: Twitter-specific meta tags
- **Canonical URLs**: Proper canonical URL implementation

### Performance Optimizations
- **Image Optimization**: Next.js Image component with WebP support
- **Font Optimization**: Google Fonts with display swap
- **Code Splitting**: Automatic code splitting by routes
- **Static Generation**: Pre-rendered pages where possible

### Analytics Integration
- **Google Analytics**: GA4 implementation
- **Google Tag Manager**: GTM setup for advanced tracking
- **Site Verification**: Google and Bing verification codes

## Development Workflow

### Scripts
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Development Guidelines
1. **TypeScript First**: All new code must be typed
2. **Component Reusability**: Create reusable components
3. **SEO Optimization**: Implement proper metadata for all pages
4. **Responsive Design**: Mobile-first approach
5. **Performance**: Optimize images and bundle size

### Code Standards
- **Naming Conventions**: PascalCase for components, camelCase for functions
- **File Organization**: Group related components and utilities
- **Import Order**: React imports first, then external, then internal
- **Component Structure**: Props interface, component, export

## Content Management

### WordPress Headless CMS Integration
- **WordPress REST API**: Content fetching from headless WordPress
- **Dynamic Routes**: `[slug]` for individual blog posts
- **Client Components**: Interactive blog features with WordPress data
- **Category Filtering**: WordPress taxonomy integration
- **Media Management**: WordPress media library integration
- **SEO Integration**: WordPress SEO metadata

### Blog Structure
- **WordPress API**: Real-time content from WordPress CMS
- **Dynamic Routes**: `[slug]` for individual blog posts
- **Client Components**: Interactive blog features
- **Category Navigation**: WordPress taxonomy filtering
- **RSS Feeds**: Automated RSS generation from WordPress

### Download Resources
- **Craft Templates**: PDF templates for DIY projects
- **Coloring Pages**: Printable coloring activities
- **Tutorials**: Step-by-step craft instructions
- **Organized Structure**: Categorized download sections

### Image Management
- **Optimized Formats**: WebP and AVIF support
- **Responsive Images**: Multiple sizes for different devices
- **Alt Text**: Descriptive alt text for accessibility
- **CDN Ready**: Optimized for content delivery

## Deployment and Build

### Build Configuration
- **Standalone Output**: Optimized for Amplify deployment
- **Image Optimization**: Disabled for Amplify compatibility
- **TypeScript Strict**: Strict type checking enabled
- **ESLint Integration**: Code quality enforcement

### Environment Variables
```env
# WordPress API Configuration
NEXT_PUBLIC_WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_MEDIA_URL=https://api.cowboykimono.com/wp-content/uploads

# Analytics and SEO
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VYVT6J7XLS
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
```

### Amplify Configuration
- **Static Site Generation**: Optimized for static hosting
- **Image Domains**: Configured for external image sources including WordPress
- **Build Commands**: Automated build and deployment
- **Environment Setup**: Production-ready configuration with WordPress API
- **WordPress Integration**: API endpoints for dynamic content

## File Organization Standards

### Component Files
- **Single Responsibility**: One component per file
- **Default Exports**: Use default exports for components
- **Named Exports**: Use named exports for utilities
- **Type Definitions**: Include TypeScript interfaces

### Asset Organization
- **Images**: Organized by category in `/public/images/`
- **Downloads**: Categorized in `/public/downloads/`
- **Icons**: SVG icons in `/public/`
- **Favicon**: Multiple formats for different devices
- **WordPress Media**: External media from WordPress CMS

### Import Patterns
```typescript
// React and Next.js imports
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

// Component imports
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Utility imports
import { generateSEOMetadata } from "./lib/seo";
```

## Error Handling and Validation

### Error Boundaries
- **React Error Boundaries**: Catch and handle component errors
- **Graceful Degradation**: Fallback UI for failed components
- **User Feedback**: Clear error messages for users

### Form Validation
- **Client-side Validation**: Real-time form validation
- **Server-side Validation**: API endpoint validation
- **User Experience**: Clear error messages and feedback

### Image Error Handling
- **Fallback Images**: Default images for failed loads
- **Loading States**: Skeleton or placeholder during load
- **Alt Text**: Descriptive alt text for accessibility

## Testing and Quality Assurance

### Code Quality
- **ESLint**: Automated code linting
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (if configured)
- **Git Hooks**: Pre-commit quality checks

### Performance Testing
- **Lighthouse**: Performance, accessibility, SEO
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **Bundle Analysis**: Webpack bundle analyzer
- **Image Optimization**: Image size and format optimization

### Accessibility
- **WCAG Compliance**: Web Content Accessibility Guidelines
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: Sufficient color contrast ratios

## Security Best Practices

### Content Security
- **CSP Headers**: Content Security Policy implementation
- **Image Security**: Safe image loading practices
- **External Links**: Secure external link handling
- **Form Security**: CSRF protection and validation

### Environment Variables
- **Sensitive Data**: Never commit API keys or secrets
- **Public Variables**: Use NEXT_PUBLIC_ prefix for client-side
- **Validation**: Validate environment variables at startup

## Future Enhancements

### Planned Features
- **E-commerce Integration**: Full shopping cart and checkout
- **User Authentication**: User accounts and profiles
- **Content Management**: WordPress headless CMS integration
- **Search Functionality**: Site-wide search implementation
- **Internationalization**: Multi-language support
- **WordPress Admin**: Content management interface

### Performance Improvements
- **Service Workers**: Offline functionality
- **Progressive Web App**: PWA capabilities
- **Advanced Caching**: Intelligent caching strategies
- **CDN Integration**: Global content delivery

---

## Development Guidelines Summary

1. **Always consult this documentation before making changes**
2. **Follow the established component patterns**
3. **Maintain SEO optimization for all pages**
4. **Ensure responsive design and accessibility**
5. **Use TypeScript for all new code**
6. **Optimize for performance and user experience**
7. **Keep the codebase clean and maintainable**

This documentation serves as the single source of truth for the Cowboy Kimono v2 Next.js project. All development decisions should align with these guidelines to maintain consistency and quality across the codebase.

## [2024-06-09] Documentation Update: Downloads Page Image Handling

### Main Card Image Refactor
- The downloads page main card images now use the Next.js `<Image />` component instead of CSS `backgroundImage` for improved reliability, optimization, and consistency with project standards.
- All main card images must be present in the `/public/images/` directory, and filenames must match exactly (case-sensitive, no spaces or special characters; use dashes or underscores instead).
- Alt text for images is now descriptive, following accessibility best practices.

#### Example Usage
```tsx
<Image
  src={section.image}
  alt={section.title + ' preview'}
  fill
  className="object-cover object-center"
  sizes="(max-width: 768px) 100vw, 33vw"
  priority
/>
```

### File Organization Standards (Update)
- Ensure all image filenames in `/public/images/` use dashes or underscores instead of spaces or special characters.
- Update all references in code to match the new filenames if changes are made.

### [2024-06-09] UI Consistency Update: Shop Page Etsy Button
- The "Visit Our Etsy Shop" button at the bottom of the shop page now uses the same dark blue color as other action buttons (`bg-[#1e2939]` with `hover:bg-[#2a3441]`) for visual consistency, instead of the previous Etsy orange. This aligns with the project's design system and ensures a cohesive user experience across all call-to-action buttons.

### [2024-06-09] Unicode & Emoji Display Fixes
- Updated the global font stack in `globals.css` to include 'Apple Color Emoji', 'Segoe UI Emoji', and 'Noto Color Emoji' for proper emoji and special character rendering across all platforms and browsers.
- Blog post titles and excerpts now use `dangerouslySetInnerHTML` to preserve special Unicode and emoji characters, ensuring correct display in the blog UI.
- Shop product titles and descriptions are now decoded for HTML entities before rendering, so characters like quotes and apostrophes display correctly instead of as &quot; or &#39;.

## [2024-06-10] Font Update: Playfair Display for Serif/Headings

### New Google Font Integration
- **Playfair Display** has been added via `next/font/google` for all serif and heading use.
- The font is available as a CSS variable: `--font-playfair`.
- Use the `.serif` class or `font-family: var(--font-playfair), serif` in CSS to apply Playfair Display.
- All `.prose` headings (h1–h6) now use Playfair Display by default.
- Example usage:
  ```tsx
  <h1 className="serif">Heading</h1>
  ```

### Technology Stack (update)
- **Google Fonts**: Playfair Display (serif/heading), Geist Sans (default), Geist Mono (mono)

### Styling and Design System (update)
- **Font Families**:
  - Default: Geist Sans (`--font-geist-sans`)
  - Mono: Geist Mono (`--font-geist-mono`)
  - Serif/Headings: Playfair Display (`--font-playfair`)
- **How to Use**:
  - Add `className="serif"` to any element for Playfair Display
  - All `.prose` headings use Playfair Display automatically

## [2024-12-19] WordPress Headless CMS Integration

### WordPress API Integration
- **WordPress REST API**: Full integration with headless WordPress CMS
- **API Utilities**: `app/lib/wordpress.ts` provides TypeScript interfaces and API functions
- **Blog Component**: `app/components/WordPressBlog.tsx` for dynamic blog content
- **Environment Variables**: WordPress API configuration for different environments

### WordPress Features
- **Content Management**: WordPress admin interface for non-technical users
- **Dynamic Blog Posts**: Real-time content from WordPress CMS
- **Category Filtering**: WordPress taxonomy integration
- **Media Management**: WordPress media library for images and assets
- **SEO Integration**: WordPress SEO metadata and structured data
- **Admin Access**: Direct access to WordPress admin via navbar link and `/admin` route
- **Blog Components**: All blog components now use centralized WordPress API utilities

### Technology Stack (update)
- **WordPress REST API**: Headless CMS for content management
- **TypeScript Interfaces**: Full typing for WordPress data structures
- **Next.js Integration**: Seamless WordPress content in Next.js components
- **Admin Portal**: WordPress admin access via `admin.cowboykimono.com` subdomain
- **Centralized API**: All blog components use `app/lib/wordpress.ts` utilities

### Development Guidelines (update)
- **WordPress API**: Use `fetchPosts()`, `fetchPostBySlug()`, `fetchCategories()` functions
- **Component Integration**: Use `WordPressBlog` component for blog pages
- **Environment Setup**: Configure WordPress API URLs in environment variables
- **Image Optimization**: WordPress media works with Next.js Image component
- **Admin Access**: Use `getWordPressAdminUrl()` utility for admin portal links
- **Blog Components**: All blog components updated to use centralized WordPress API utilities
