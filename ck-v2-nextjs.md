# Cowboy Kimono v2 - Next.js Project Documentation

## Project Overview

**Cowboy Kimono v2** is a modern Next.js 15+ e-commerce and content website for handcrafted western-inspired robes and apparel. The project combines artistic content, e-commerce functionality, and a blog platform with a focus on sustainability and unique fashion.

### Key Features
- **E-commerce Platform**: Shop for handcrafted kimonos and apparel
- **Content Blog**: Artistic content and lifestyle posts with WordPress headless CMS
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
- **WordPress REST API**: Headless CMS integration

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
│   │   ├── WordPressBlog.tsx    # WordPress blog component
│   │   ├── BlogSidebar.tsx      # Blog sidebar with search
│   │   └── ...                  # Other components
│   ├── lib/                      # Utility functions and configurations
│   │   ├── wordpress.ts         # WordPress API integration
│   │   ├── seo.ts              # SEO utilities
│   │   └── analytics.ts        # Analytics utilities
│   ├── blog/                    # Blog pages
│   │   ├── page.tsx            # Blog listing page
│   │   └── [slug]/             # Individual blog posts
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── public/                       # Static assets
│   ├── images/                  # Image assets
│   └── downloads/               # Downloadable resources
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── amplify.yml                  # AWS Amplify deployment config
├── .env.local                   # Environment variables
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

#### WordPress Components
- **WordPressBlog**: Main blog component with posts, categories, and pagination
- **BlogSidebar**: Blog sidebar with search, recent posts, and suggestions
- **WordPress API**: Centralized WordPress API utilities in `app/lib/wordpress.ts`

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

#### WordPress Component Structure
```typescript
// WordPress blog component pattern
import { fetchPosts, type WordPressPost } from '../lib/wordpress';

interface WordPressBlogProps {
  initialPosts?: WordPressPost[];
  postsPerPage?: number;
  showCategories?: boolean;
  showPagination?: boolean;
}

export default function WordPressBlog({ 
  initialPosts = [], 
  postsPerPage = 6,
  showCategories = true,
  showPagination = true
}: WordPressBlogProps) {
  // Component implementation
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
- **IndexNow Integration**: Automatic URL submission to search engines for faster indexing

### Performance Optimizations
- **Image Optimization**: Next.js Image component with WebP support
- **Font Optimization**: Google Fonts with display swap
- **Code Splitting**: Automatic code splitting by routes
- **Static Generation**: Pre-rendered pages where possible

### Analytics Integration
- **Google Analytics**: GA4 implementation with measurement ID `G-CLVLQ2YNPF`
- **Google Tag Manager**: GTM setup for advanced tracking and third-party tags with container ID `GTM-PNZTN4S4`
- **Social Media Pixels**: Ready for Facebook, Pinterest, and Instagram pixel integration via GTM
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
- **WordPress REST API**: Clean, centralized API integration in `app/lib/wordpress.ts`
- **TypeScript Interfaces**: Full typing for WordPress data structures
- **Error Handling**: Comprehensive error handling and loading states
- **SEO Integration**: WordPress SEO metadata and structured data
- **Admin Access**: WordPress admin portal via `admin.cowboykimono.com`

### WordPress Features
- **Content Management**: WordPress admin interface for non-technical users
- **Dynamic Blog Posts**: Real-time content from WordPress CMS
- **Category Filtering**: WordPress taxonomy integration
- **Search Functionality**: Real-time search with debouncing
- **Media Management**: WordPress media library for images and assets
- **Recent Posts**: Sidebar with recent posts and intelligent suggestions
- **Responsive Design**: Mobile-optimized blog layout

### Blog Structure
- **WordPress API**: Real-time content from WordPress CMS
- **Dynamic Routes**: `[slug]` for individual blog posts
- **Client Components**: Interactive blog features with WordPress data
- **Category Navigation**: WordPress taxonomy filtering
- **Search Integration**: Real-time search functionality
- **Sidebar Features**: Search, recent posts, and suggested content

### WordPress API Utilities
```typescript
// Core WordPress functions
export async function fetchPosts(params?: {
  per_page?: number;
  page?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  _embed?: boolean;
}): Promise<WordPressPost[]>

export async function fetchPostBySlug(slug: string): Promise<WordPressPost | null>
export async function fetchCategories(): Promise<WordPressCategory[]>
export async function fetchTags(): Promise<WordPressTag[]>
export async function fetchMedia(mediaId: number): Promise<WordPressMedia | null>
export async function fetchAuthor(authorId: number): Promise<WordPressAuthor | null>

// Utility functions
export function decodeHtmlEntities(text: string): string
export function getWordPressAdminUrl(): string
export function getMediaUrl(mediaId: number, size?: string): string
```

### IndexNow Integration
```typescript
// Core IndexNow functions
export async function submitToIndexNow(urls: string[], searchEngines?: string[]): Promise<IndexNowResponse>
export async function submitUrlToIndexNow(url: string, searchEngines?: string[]): Promise<IndexNowResponse>

// WordPress-specific IndexNow functions
export async function submitWordPressPostToIndexNow(slug: string, searchEngines?: string[]): Promise<IndexNowResponse>
export async function submitWordPressCategoryToIndexNow(slug: string, searchEngines?: string[]): Promise<IndexNowResponse>
export async function submitWordPressTagToIndexNow(slug: string, searchEngines?: string[]): Promise<IndexNowResponse>

// Configuration and utilities
export function getIndexNowConfig(): IndexNowConfig
export function validateIndexNowKey(key: string): boolean
```

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
- **Redirect Rules**: Handle old WordPress media URLs with permanent redirects to API subdomain

### Environment Variables
```env
# WordPress API Configuration
NEXT_PUBLIC_WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_MEDIA_URL=https://api.cowboykimono.com/wp-content/uploads

# Analytics and SEO
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VYVT6J7XLS
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com

# IndexNow Configuration
NEXT_PUBLIC_INDEXNOW_KEY=your-indexnow-key-here
WORDPRESS_WEBHOOK_SECRET=your-webhook-secret-here
```

### Amplify Configuration
- **Static Site Generation**: Optimized for static hosting
- **Image Domains**: Configured for external image sources including WordPress
- **Build Commands**: Automated build and deployment
- **Environment Setup**: Production-ready configuration with WordPress API
- **WordPress Integration**: API endpoints for dynamic content
- **URL Redirects**: Permanent redirects for old WordPress media URLs to prevent 404 errors

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
import WordPressBlog from "./components/WordPressBlog";

// Utility imports
import { generateSEOMetadata } from "./lib/seo";
import { fetchPosts, type WordPressPost } from "./lib/wordpress";
```

## Error Handling and Validation

### Error Boundaries
- **React Error Boundaries**: Catch and handle component errors
- **Graceful Degradation**: Fallback UI for failed components
- **User Feedback**: Clear error messages for users

### WordPress Error Handling
- **API Error Handling**: Comprehensive error handling for WordPress API calls
- **Loading States**: Skeleton loading states for better UX
- **Fallback Content**: Graceful fallbacks when content fails to load
- **Retry Mechanisms**: User-friendly retry options
- **Error Boundaries**: React error boundaries for component-level error handling

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
- **Advanced Search**: Enhanced search with filters and sorting
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

## [2024-12-19] WordPress Headless CMS Integration - Clean Implementation

### WordPress API Integration
- **WordPress REST API**: Clean, centralized integration in `app/lib/wordpress.ts`
- **TypeScript Interfaces**: Complete typing for all WordPress data structures
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Skeleton loading states for better user experience
- **SEO Integration**: WordPress SEO metadata and structured data
- **Admin Access**: WordPress admin portal via `admin.cowboykimono.com`
- **SSL Certificates**: Both subdomains secured with Let's Encrypt certificates
- **Image Handling**: Proper WordPress media URL extraction and fallback handling
- **Next.js Image Configuration**: Updated to use `remotePatterns` instead of deprecated `domains` array

### Troubleshooting and Maintenance
- **Diagnostic Tools**: PHP diagnostic script (`wordpress-diagnostic.php`) for server health checks
- **Fix Scripts**: Automated fix script (`wordpress-fix.sh`) for common WordPress issues
- **Error Handling**: Comprehensive troubleshooting guide for 503 errors and server issues
- **Monitoring**: Health check scripts and backup procedures for production stability
- **Recovery Procedures**: Step-by-step recovery process for database and file issues

### WordPress Features
- **Content Management**: WordPress admin interface for non-technical users
- **Dynamic Blog Posts**: Real-time content from WordPress CMS
- **Category Filtering**: WordPress taxonomy integration with clean UI
- **Search Functionality**: Real-time search with debouncing
- **Media Management**: WordPress media library integration with proper image URL extraction
- **Recent Posts**: Sidebar with recent posts and intelligent suggestions
- **Responsive Design**: Mobile-optimized blog layout
- **HTTPS Security**: All WordPress endpoints secured with SSL certificates
- **Featured Images**: Proper handling of WordPress featured images with fallback placeholders

### Technology Stack (update)
- **WordPress REST API**: Headless CMS for content management
- **TypeScript Interfaces**: Full typing for WordPress data structures
- **Next.js Integration**: Seamless WordPress content in Next.js components
- **Admin Portal**: WordPress admin access via `admin.cowboykimono.com` subdomain
- **API Endpoint**: WordPress REST API via `api.cowboykimono.com` subdomain
- **Centralized API**: All blog components use `app/lib/wordpress.ts` utilities
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **SSL Security**: Let's Encrypt certificates for both subdomains
- **Image Optimization**: Proper WordPress media URL extraction and Next.js Image component integration

### Development Guidelines (update)
- **WordPress API**: Use centralized functions from `app/lib/wordpress.ts`
- **Component Integration**: Use `WordPressBlog` component for blog pages
- **Environment Setup**: Configure WordPress API URLs in environment variables
- **Image Optimization**: WordPress media works with Next.js Image component
- **Admin Access**: Use `getWordPressAdminUrl()` utility for admin portal links
- **Error Handling**: Implement proper error states and loading indicators
- **SEO**: Ensure all WordPress content includes proper metadata
- **SSL Security**: All WordPress endpoints use HTTPS with valid certificates
- **Image Handling**: Use `getFeaturedImageUrl()` and `getFeaturedImageAlt()` for proper image display

### WordPress Component Architecture
- **WordPressBlog**: Main blog component with posts, categories, and pagination
- **BlogClient**: Enhanced blog component with conditional header display
- **BlogSidebar**: Sidebar with search, recent posts, and suggestions
- **Individual Posts**: Dynamic routes with `[slug]` for individual blog posts
- **Category/Tag Pages**: Archive pages with custom headers and no blog logo
- **Error States**: User-friendly error messages with retry options
- **Loading States**: Skeleton loading for better perceived performance
- **Image Handling**: Proper featured image display with fallback placeholders

### WordPress API Utilities
```typescript
// Core WordPress functions
export async function fetchPosts(params?: {
  per_page?: number;
  page?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  _embed?: boolean;
}): Promise<WordPressPost[]>

export async function fetchPostBySlug(slug: string): Promise<WordPressPost | null>
export async function fetchCategories(): Promise<WordPressCategory[]>
export async function fetchTags(): Promise<WordPressTag[]>
export async function fetchMedia(mediaId: number): Promise<WordPressMedia | null>
export async function fetchAuthor(authorId: number): Promise<WordPressAuthor | null>

// Image handling utilities
export function getFeaturedImageUrl(post: WordPressPost, size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'): string | null
export function getFeaturedImageAlt(post: WordPressPost): string
export function getMediaUrl(mediaId: number): string

// Utility functions
export function decodeHtmlEntities(text: string): string
export function getWordPressAdminUrl(): string
```

### WordPress Error Handling
- **API Error Handling**: Comprehensive error handling for WordPress API calls
- **Loading States**: Skeleton loading states for better UX
- **Fallback Content**: Graceful fallbacks when content fails to load
- **Retry Mechanisms**: User-friendly retry options
- **Error Boundaries**: React error boundaries for component-level error handling
- **Image Fallbacks**: Placeholder images when featured images are not available

### Production Environment Variables
```env
# WordPress API Configuration (Production with SSL)
NEXT_PUBLIC_WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_MEDIA_URL=https://api.cowboykimono.com/wp-content/uploads

# Analytics and SEO
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VYVT6J7XLS
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
```

### SSL Certificate Management
- **Let's Encrypt Certificates**: Automatic SSL certificates for both subdomains
- **Auto-Renewal**: Certificates automatically renew every 60 days
- **HTTPS Redirects**: All HTTP traffic automatically redirects to HTTPS
- **Security Headers**: CORS headers configured for API access
- **Certificate Monitoring**: Regular checks for certificate expiration

### Subdomain Configuration
- **API Subdomain**: `api.cowboykimono.com` - WordPress REST API endpoint
- **Admin Subdomain**: `admin.cowboykimono.com` - WordPress admin interface
- **DNS Records**: Route 53 A records pointing to EC2 instance
- **Virtual Hosts**: Apache virtual host configuration for both subdomains
- **SSL Certificates**: Individual certificates for each subdomain

## [2024-12-19] WordPress Image Handling Fixes

### Image Display Issues Resolved
- **Featured Image Extraction**: Proper extraction of WordPress featured image URLs from `_embedded` data
- **Image URL Construction**: Fixed WordPress media URL construction to use actual file paths
- **Fallback Handling**: Added placeholder images when no featured image is available
- **Alt Text Support**: Proper alt text extraction from WordPress media data
- **Image Optimization**: WordPress images now work correctly with Next.js Image component

### WordPress Media Integration
- **Embedded Media**: Proper handling of WordPress `_embedded` media data
- **Multiple Sizes**: Support for thumbnail, medium, large, and full image sizes
- **Source URL Extraction**: Correct extraction of `source_url` from WordPress media objects
- **Media Details**: Proper parsing of WordPress media details and file information
- **Error Handling**: Graceful fallback when media data is missing or corrupted

### Image Handling Functions
```typescript
// Get featured image URL with proper WordPress media handling
export function getFeaturedImageUrl(post: WordPressPost, size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'): string | null

// Get featured image alt text
export function getFeaturedImageAlt(post: WordPressPost): string

// Get media URL with fallback
export function getMediaUrl(mediaId: number): string
```

### Component Updates
- **WordPressBlog Component**: Updated to use new image handling functions
- **Individual Post Pages**: Proper featured image display with fallbacks
- **Loading States**: Improved loading states for image-heavy content
- **Error States**: Better error handling for missing or broken images
- **Placeholder Images**: Custom SVG placeholder for posts without featured images

### Image Optimization
- **Next.js Image Component**: WordPress images now work with Next.js optimization
- **Responsive Sizing**: Proper `sizes` attribute for responsive images
- **Performance**: Optimized image loading with priority and lazy loading
- **CDN Ready**: Images served from WordPress media library with proper caching

### WordPress Media Structure
- **Media Details**: Proper handling of WordPress media_details object
- **Size Variants**: Support for multiple image sizes (thumbnail, medium, large, full)
- **File Paths**: Correct construction of WordPress media file paths
- **Alt Text**: Extraction of alt text from WordPress media objects
- **Source URLs**: Proper extraction of source_url for direct image access

## [2024-12-19] Blog Layout and Navigation Enhancements

### New Blog Features
- **Featured Posts Section**: Three highlighted posts displayed at the top of the blog page (only on page 1)
- **Sidebar Navigation**: Right sidebar with recent posts and quick links
- **Proper Pagination**: Real pagination with total post count from WordPress API
- **Clean Layout**: Blue background design with white content cards
- **Responsive Design**: Mobile-first design with sidebar that stacks on mobile
- **Interactive States**: Loading states, hover effects, and smooth transitions

### Blog Layout Structure
- **Header Section**: Blog logo and description (only on main blog page)
- **Featured Posts**: Three highlighted posts in a responsive grid (1 column mobile, 3 desktop)
- **Main Content (2/3 width)**: Blog posts grid with pagination (12 posts per page, 3 columns on desktop)
- **Sidebar (1/3 width)**: Recent posts, categories, and tags
- **Pagination**: Bottom pagination with proper total page count

### Featured Posts Section
- **Three Highlighted Posts**: Displays the first 3 posts from WordPress
- **Responsive Grid**: 1 column on mobile, 3 columns on desktop
- **Hover Effects**: Smooth transitions and scaling on hover
- **Page 1 Only**: Only shows on the first page of the blog

### Sidebar Features
- **Recent Posts**: Shows the latest 4 posts with thumbnails
- **Categories**: Lists all blog categories with post counts and links to category pages
- **Tags**: Displays all blog tags as clickable badges linking to tag pages
- **Clean Design**: White cards with proper spacing and hover effects
- **Responsive**: Stacks below main content on mobile devices

### Pagination Features
- **Real Total Count**: Gets actual total posts from WordPress API headers
- **Proper Page Count**: Calculates total pages based on posts per page
- **Navigation Controls**: Previous/Next buttons and page numbers
- **Smooth Scrolling**: Scrolls to top when changing pages
- **Loading States**: Shows loading indicator during page transitions

### User Experience Improvements
- **Clean Blue Background**: Professional `bg-[#f0f8ff]` design
- **Proper Post Count**: Shows accurate total posts and pages
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Loading Indicators**: Visual feedback during data loading
- **Error States**: User-friendly error messages and retry options

### Technical Implementation
- **WordPress API Integration**: Uses `fetchPostsWithCount()` for proper pagination
- **Image Optimization**: Proper WordPress media URL extraction
- **Performance**: Efficient API calls with embedded media data
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **SEO Friendly**: Maintains SEO benefits with proper URL structure

### Blog Component Architecture
```typescript
// Enhanced BlogClient component with featured posts and sidebar
interface BlogClientProps {
  // Component handles all state internally
}

// New state management for proper pagination
const [totalPosts, setTotalPosts] = useState(0);
const [totalPages, setTotalPages] = useState(1);
const [featuredPosts, setFeaturedPosts] = useState<WordPressPost[]>([]);
const [recentPosts, setRecentPosts] = useState<WordPressPost[]>([]);
```

### WordPress API Integration
- **fetchPostsWithCount()**: New function that returns posts with total count
- **Proper Headers**: Reads `X-WP-Total` and `X-WP-TotalPages` from WordPress API
- **Embedded Media**: Includes `_embed: true` for proper image handling
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Pagination and Navigation Features
- **Real Total Count**: `totalPosts` from WordPress API headers
- **Proper Page Count**: `totalPages` calculated from WordPress API
- **Page Navigation**: `handlePageChange()` for smooth page transitions
- **State Synchronization**: Proper state management between posts and pagination
- **Loading States**: Comprehensive loading indicators for all operations

## [2024-12-19] URL-Based Blog Navigation

### URL Navigation Features
- **URL Parameters**: Blog state is reflected in URL parameters for bookmarking and sharing
- **Direct Navigation**: Users can navigate directly to specific pages, categories, and searches
- **Browser History**: Full browser back/forward support with proper state management
- **SEO Friendly**: URL parameters work with search engine indexing
- **Shareable Links**: Users can share specific blog views with direct URLs

### URL Structure
```
/blog                    # All posts, page 1
/blog?page=2            # All posts, page 2
/blog?category=1        # Posts from category 1
/blog?category=2&page=3 # Posts from category 2, page 3
/blog?search=velvet     # Search results for "velvet"
/blog?search=denim&page=2 # Search results for "denim", page 2
```

### URL Parameter Handling
- **Page Parameter**: `page` - Current page number (defaults to 1)
- **Category Parameter**: `category` - WordPress category ID for filtering
- **Search Parameter**: `search` - Search query for finding posts
- **Parameter Combination**: Multiple parameters can be used together
- **Parameter Validation**: Invalid parameters are handled gracefully

### Navigation Implementation
- **URL Updates**: All navigation actions update the URL automatically
- **State Synchronization**: URL parameters sync with component state
- **Initial Load**: URL parameters are read on page load for direct navigation
- **Router Integration**: Uses Next.js router for clean URL updates
- **History Management**: Proper browser history management

### User Experience Benefits
- **Bookmarkable Pages**: Users can bookmark specific blog views
- **Shareable Links**: Easy sharing of filtered or searched blog views
- **Browser Navigation**: Full back/forward button support
- **Direct Access**: Users can navigate directly to specific content
- **State Persistence**: Blog state persists across page refreshes

### Technical Implementation
```typescript
// URL update function
const updateURL = (page: number, category: number | null, search: string) => {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', page.toString());
  if (category) params.set('category', category.toString());
  if (search.trim()) params.set('search', search.trim());
  
  const newURL = params.toString() ? `/blog?${params.toString()}` : '/blog';
  router.push(newURL);
};

// Enhanced component props
interface WordPressBlogProps {
  initialPage?: number;
  initialCategory?: number | null;
  initialSearch?: string;
  // ... existing props
}
```

### Blog Page Integration
- **Client Component**: Blog page is now a client component for URL handling
- **Parameter Reading**: Reads URL parameters on initial load
- **State Initialization**: Initializes component state from URL parameters
- **Search Integration**: Handles initial search from URL parameters
- **Category Integration**: Handles initial category from URL parameters

## [2024-12-19] Google Analytics Tracking ID Update

### Google Analytics Implementation
- **New Tracking ID**: Updated to `G-DL317B831Y` for proper Google Analytics 4 tracking
- **Global Implementation**: Google Analytics script is implemented in the root layout for all pages
- **Proper Script Loading**: Uses async loading for optimal performance
- **Data Layer**: Properly configured data layer for enhanced tracking capabilities
- **Environment Variable Support**: Can be configured via `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable

### Technical Implementation
- **Root Layout**: Google Analytics script is loaded in `app/layout.tsx` for global coverage
- **Async Loading**: Script loads asynchronously to avoid blocking page rendering
- **Configuration**: Proper gtag configuration with data layer initialization
- **Performance**: Minimal impact on page load performance

### Tracking Coverage
- **All Pages**: Google Analytics tracking is active on every page of the website
- **Blog Posts**: Individual blog posts are tracked with proper page views
- **User Interactions**: All user interactions and page navigation are tracked
- **Conversion Tracking**: Ready for conversion tracking and goal setting

## [2024-12-19] Home Page Blog Integration and SEO Enhancement

### Home Page Blog Card Updates
- **Featured Blog Posts**: Updated home page cards to link to actual blog posts instead of placeholder URLs
- **T-Rex Fashion Crisis**: Links to `/blog/do-these-stripes-and-polka-dots-make-my-tail-look-big-t-rexs-fashion-crisis`
- **Poodoodle Journal**: Links to `/blog/introducing-the-poodoodle-journal`
- **Velvet Skirt**: Links to `/blog/new-in-the-shop-a-velvet-skirt-with-some-serious-70s-mojo-2`
- **Enhanced UX**: Entire cards are now clickable links for better user experience
- **Improved Alt Text**: More descriptive alt text for better accessibility and SEO

### SEO Improvements
- **Enhanced Keywords**: Added specific keywords for featured blog posts (dino jacket, poodoodle journal, velvet skirt, 70s fashion)
- **Updated Description**: Home page description now mentions featured blog posts
- **Better Link Structure**: Proper internal linking for improved SEO and user navigation
- **Accessibility**: Improved alt text descriptions for screen readers

### Technical Implementation
- **Link Wrapping**: Entire blog cards are wrapped in Next.js Link components
- **Hover Effects**: Maintained existing hover animations and transitions
- **Responsive Design**: Cards remain fully responsive across all devices
- **Performance**: No impact on page load performance

## [2024-12-19] Comprehensive SEO and Google Search Console Optimization

### Critical SEO Fixes Implemented
- **Blog Post SEO**: Converted blog post pages from client components to server components for proper static metadata generation
- **Shop Page SEO**: Converted shop page to server component with proper SEO metadata
- **Downloads Page SEO**: Converted downloads page to server component with proper SEO metadata
- **Sitemap Fix**: Corrected WordPress API URL in sitemap generation
- **Meta Tags Enhancement**: Added comprehensive meta tags for better mobile and social media compatibility
- **Structured Data**: Enhanced structured data implementation for better search engine understanding
- **Domain Consistency**: Fixed structured data URLs to use correct `cowboykimono.com` domain instead of old `cowboykimonos.com`
- **Social Media Links**: Updated structured data social media links to correct Instagram and Facebook URLs
- **Canonical URL Fix**: Fixed canonical URL generation to use full URLs with correct www domain to prevent duplicate content issues
- **Ahrefs Compatibility**: Resolved non-200 status and canonicalization issues that were causing Ahrefs to flag pages as non-indexable
- **Page Title Optimization**: Shortened default title from 67 to 42 characters and added automatic title truncation to prevent overly long page titles that hurt SEO
- **Internal Linking System**: Comprehensive internal linking solution to fix orphaned blog pages including category/tag archive pages, breadcrumb navigation, and enhanced sidebar with category/tag links
- **Category/Tag Display Fix**: Fixed individual blog posts to show actual category and tag names instead of placeholder numbers, with proper links to category/tag archive pages
- **HTML Entity Decoding**: Fixed breadcrumbs, blog titles, and browser tab titles to properly decode HTML entities like `&#038;` to display as `&` instead of showing raw entity codes

## [2024-12-19] Google Search Console Sitemap Fixes

### Sitemap Issues Resolved
- **Invalid Date Format**: Fixed sitemap date format to use ISO 8601 format (`.toISOString()`) instead of JavaScript Date objects
- **Domain Correction**: Fixed incorrect domain from `cowboykimonos.com` to `cowboykimono.com` in sitemap and robots.txt
- **URL Validation**: All sitemap URLs now use the correct domain and are properly formatted for Google Search Console
- **WordPress Integration**: Blog post dates from WordPress API are properly converted to ISO format for sitemap entries

### Technical Fixes
- **Sitemap Generation**: Updated `app/sitemap.ts` to use proper ISO date formatting
- **Robots.txt**: Fixed domain reference in `app/robots.ts` to use correct domain
- **Date Handling**: All `lastModified` fields now use `.toISOString()` for proper Google Search Console compatibility
- **Domain Consistency**: Ensured all SEO-related files use the correct `cowboykimono.com` domain

### Google Search Console Compatibility
- **Valid Date Format**: All sitemap dates now use ISO 8601 format required by Google Search Console
- **Correct Domain**: Sitemap URLs now use the proper domain without typos
- **Proper URL Structure**: All URLs in sitemap are valid and accessible
- **WordPress Blog Posts**: Individual blog post URLs are properly included with correct dates

### SEO Architecture Improvements
- **Server Components**: All main pages now use server components for optimal SEO performance
- **Static Metadata**: Proper static metadata generation for all pages including dynamic blog posts
- **Client Components**: Interactive functionality moved to separate client components
- **Meta Tags**: Enhanced meta tags for mobile apps, social media, and search engines
- **Structured Data**: Comprehensive structured data for organization, website, and blog content

### Google Search Console Compatibility
- **Proper Meta Tags**: All required meta tags for Google Search Console verification
- **Structured Data**: Rich snippets support for better search result display
- **Sitemap**: Corrected sitemap with proper WordPress integration
- **Robots.txt**: Proper robots.txt configuration for search engine crawling
- **Canonical URLs**: Proper canonical URL implementation for all pages

### Technical SEO Implementation
- **Metadata Generation**: Centralized SEO metadata generation in `app/lib/seo.ts`
- **Dynamic Blog SEO**: Server-side metadata generation for individual blog posts
- **Image Optimization**: Proper alt text and image optimization for SEO
- **URL Structure**: Clean, SEO-friendly URL structure
- **Performance**: Server components for faster initial page loads

## [2024-12-19] WordPress Image Loading Improvements

### Image Loading Issues Resolved
- **Image Loading**: Fixed WordPress image loading issues on blog pages
- **Error Handling**: Graceful fallback to placeholder images when WordPress images fail
- **Loading States**: Visual feedback during image loading with skeleton states
- **Performance Optimization**: Improved image loading performance with proper caching
- **Size Fallback Logic**: Enhanced fallback mechanism to try different image sizes when requested size is unavailable
- **Recent Posts Images**: Fixed recent posts sidebar images by using 'medium' size instead of 'thumbnail' for better availability
- **Layout Fix**: Fixed WordPressImage component to properly handle `fill` prop without conflicting wrapper divs

### New WordPressImage Component
- **Centralized Image Handling**: New `WordPressImage` component for consistent image display
- **Error Recovery**: Automatic fallback to placeholder when images fail to load
- **Loading Indicators**: Skeleton loading states for better user experience
- **Multiple Sizes**: Support for thumbnail, medium, large, and full image sizes
- **TypeScript Support**: Full TypeScript integration with proper type safety


### Component Features
```typescript
// WordPressImage component usage
<WordPressImage
  post={post}
  size="medium"
  className="w-full h-auto"
  fill={false}
  width={400}
  height={300}
  priority={false}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Error Handling Improvements
- **Network Failures**: Graceful handling of network errors and timeouts
- **Invalid URLs**: Automatic detection and fallback for malformed image URLs
- **Missing Images**: Placeholder display when WordPress images are not available
- **Console Logging**: Detailed error logging for debugging image issues
- **User Experience**: Seamless fallback without breaking the layout

### Image Loading Strategy
- **Progressive Loading**: Images load with opacity transitions for smooth UX
- **Loading States**: Skeleton loading with spinner during image fetch
- **Error States**: Clean placeholder with icon when images fail
- **Performance**: Optimized loading with proper Next.js Image component usage
- **Caching**: Browser caching for improved performance on subsequent loads

### Technical Implementation
- **WordPress API Integration**: Proper extraction of image URLs from WordPress `_embedded` data
- **Next.js Image Optimization**: Full integration with Next.js Image component
- **Responsive Design**: Proper `sizes` attribute for responsive image loading
- **Error Boundaries**: Component-level error handling for individual images
- **TypeScript Safety**: Full type safety with WordPressPost interface

### Blog Integration
- **Blog Listing**: All blog post cards now use WordPressImage component
- **Individual Posts**: Featured images on individual post pages use improved handling
- **Sidebar Images**: Recent posts sidebar uses consistent image handling
- **Search Results**: Search results maintain consistent image display
- **Category Pages**: Category-filtered posts use the same image handling

### Benefits
- **Reliability**: Eliminates occasional image loading failures
- **User Experience**: Smooth loading states and graceful error handling
- **Performance**: Optimized image loading with proper caching
- **Maintainability**: Centralized image handling for easier maintenance
- **Consistency**: Uniform image display across all blog components

This improvement ensures that all WordPress blog images load reliably and provide a better user experience with proper loading states and error handling.

## [2024-12-19] Performance Optimization and Image Modernization - COMPLETED

### Total Blocking Time Optimization
- **Google Analytics Loading**: Moved Google Analytics from synchronous head loading to asynchronous client-side loading with 1-second delay
- **Font Optimization**: Added `display: "swap"` and `preload: true` for critical fonts (Geist Sans and Playfair Display)
- **Script Loading**: Created dedicated `GoogleAnalytics` component for non-blocking analytics loading
- **Performance Impact**: Expected 2-3 second improvement in total blocking time, especially on mobile

### Image Optimization Implementation
- **Quality Settings**: Added `quality={85}` to all Next.js Image components for optimal compression
- **Responsive Sizing**: Implemented proper `sizes` attributes for all images with responsive breakpoints
- **Priority Loading**: Maintained `priority` only for hero image and logo, removed from non-critical images
- **Image Analysis**: Created comprehensive image analysis showing 15.5MB total image size with 9 large images (>500KB)

### Critical Image Optimization Targets - COMPLETED ✅
1. **Father_Day_Muffins.jpg** (4.75MB) → **Father_Day_Muffins.webp** (372KB) - 92% reduction
2. **Grocery_Bag_Birds_Green.jpg** (1.83MB) → **Grocery_Bag_Birds_Green.webp** (320KB) - 83% reduction  
3. **Paint_application_CU.png** (1.74MB) → **Paint_application_CU.webp** (optimized) - Significant reduction
4. **CK_Social_Link.png** (1.34MB) → **CK_Social_Link.webp** (52KB) - 96% reduction
5. **Neon_Coloring_Mock.jpg** (1.23MB) → **Neon_Coloring_Mock.webp** (optimized) - Significant reduction
6. **CK_Coloring_Button.jpg** (1.03MB) → **CK_Coloring_Button.webp** (185KB) - 82% reduction

### Next.js Configuration Enhancements
- **Image Caching**: Added 30-day cache TTL for images
- **Compression**: Enabled gzip compression
- **Security Headers**: Added security headers for better performance and security
- **Experimental Features**: Enabled package import optimization (removed CSS optimization due to Amplify compatibility)
- **Build Fix**: Resolved critters module error by removing experimental CSS optimization

### Performance Monitoring Tools
- **Image Analysis Script**: Created `optimize-images.js` for automated image size analysis
- **Optimization Plan**: Comprehensive plan in `image-optimization-plan.md` with specific targets
- **Code Updates**: Updated all image references from .jpg/.png to .webp across entire codebase
- **Results Achieved**: 80-96% file size reduction, significant Lighthouse score improvement expected

### Code Updates Completed ✅
- **app/page.tsx**: Updated all hero and blog post images to .webp, converted to dynamic WordPress posts
- **app/layout.tsx**: Updated Apple touch icon to .webp
- **app/downloads/DownloadsClient.tsx**: Updated all download section images to .webp
- **app/shop/ShopClient.tsx**: Updated shop header image to .webp
- **app/components/FloatingSocialMedia.tsx**: Updated social media icon to .webp
- **app/blog/BlogClient.tsx**: Updated blog header image to .webp
- **app/about/page.tsx**: Updated about page image to .webp
- **app/components/Navbar.tsx**: Already using .webp format
- **app/components/HomeBlogCards.tsx**: New component for dynamic WordPress posts on home page

## [2024-12-19] Home Page Dynamic Blog Integration

### Home Page Blog Cards Update
- **Dynamic WordPress Integration**: Home page now fetches and displays the three most recent WordPress blog posts
- **Same Card Styling**: Maintains the exact same visual design and hover effects as the original static cards
- **Automatic Updates**: Blog cards automatically update when new posts are published in WordPress
- **Fallback Handling**: Graceful fallback for posts without featured images
- **Loading States**: Skeleton loading animation while fetching posts
- **Error Handling**: User-friendly error messages if WordPress API is unavailable
- **HTML Entity Decoding**: Blog post titles now properly decode HTML entities (like &amp;, &quot;, &#39;) to display correctly instead of showing raw entity codes

### Technical Implementation
- **HomeBlogCards Component**: New client component that fetches recent posts from WordPress API
- **WordPress Integration**: Uses existing `fetchPosts` function from `app/lib/wordpress.ts`
- **HTML Entity Handling**: Uses `decodeHtmlEntities()` function and `dangerouslySetInnerHTML` for proper title display
- **Responsive Design**: Maintains responsive grid layout (1 column mobile, 3 columns desktop)
- **Image Optimization**: Uses WordPress featured images with Next.js Image optimization
- **SEO Friendly**: Server-side metadata generation maintained for SEO benefits

### User Experience Benefits
- **Always Fresh Content**: Home page always shows the latest blog posts
- **Consistent Design**: Same beautiful card design with hover animations
- **Fast Loading**: Optimized image loading with proper fallbacks
- **Mobile Responsive**: Works perfectly on all device sizes
- **Accessibility**: Proper alt text and keyboard navigation

## [2024-12-19] Google Tag Manager Implementation

### Google Tag Manager Setup
- **GTM Integration**: Added Google Tag Manager alongside existing GA4 setup
- **Third-Party Tags**: Ready to implement tags from other sites that require GTM
- **Dual Analytics**: Both GA4 and GTM work together for comprehensive tracking
- **Environment Configuration**: GTM ID can be set via `NEXT_PUBLIC_GTM_ID` environment variable
- **Fallback Handling**: GTM component gracefully handles missing or placeholder IDs

### Technical Implementation
- **GTM Component**: Enhanced `GoogleTagManager` component with robust error handling
- **Layout Integration**: GTM script loads in root layout alongside GA4
- **Script Strategy**: Uses `afterInteractive` strategy for optimal performance
- **NoScript Fallback**: Includes noscript iframe for users with JavaScript disabled
- **Environment Variables**: Configurable via `NEXT_PUBLIC_GTM_ID` environment variable

### Benefits for Third-Party Tags
- **Marketing Tags**: Ready for Facebook Pixel, LinkedIn Insight Tag, etc.
- **Conversion Tracking**: Can implement conversion tracking from various platforms
- **Custom Events**: GTM allows custom event tracking and data layer management
- **Tag Management**: Centralized tag management without code changes
- **A/B Testing**: Ready for A/B testing tools that require GTM

### Setup Instructions
1. **Get GTM Container ID**: Create a GTM container at https://tagmanager.google.com/
2. **Environment Variable**: Add `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` to `.env.local`
3. **Replace Placeholder**: Replace `GTM-XXXXXXX` with your actual GTM container ID
4. **Deploy**: The GTM script will automatically load on all pages
5. **Configure Tags**: Use GTM interface to add third-party tags and tracking

## [2024-12-19] Blog Header Image Control

### Blog Header Image Management
- **Conditional Display**: Blog header image (logo and description) now only shows on the main blog page
- **Category Pages**: Category archive pages show custom category headers without the blog logo
- **Tag Pages**: Tag archive pages show custom tag headers without the blog logo
- **Clean Design**: Archive pages have cleaner, more focused layouts
- **Consistent Branding**: Main blog page maintains brand presence while archive pages focus on content
- **Navigation Links**: Category and tag pages include breadcrumbs and "Back to Blog" links for easy navigation

### Technical Implementation
- **BlogClient Component**: Added `showHeader` prop to control header visibility
- **Default Behavior**: Header shows by default (`showHeader={true}`) for main blog page
- **Archive Pages**: Category and tag pages pass `showHeader={false}` to hide header
- **Custom Headers**: Archive pages have their own custom headers with category/tag names
- **Breadcrumb Navigation**: Category and tag pages include breadcrumb navigation (Home → Blog → Category/Tag)
- **Back Links**: Archive pages include "Back to all posts" links for easy navigation
- **Responsive Design**: All layouts remain fully responsive across devices

### User Experience Benefits
- **Focused Content**: Archive pages focus on category/tag content without brand distraction
- **Clear Navigation**: Users can easily distinguish between main blog and filtered views
- **Better Organization**: Each page type has appropriate header styling
- **Easy Navigation**: Breadcrumbs and back links help users navigate between pages
- **Consistent Layout**: Sidebar and content areas remain consistent across all blog pages
- **Improved SEO**: Archive pages have more focused, relevant headers for search engines
- **User-Friendly**: Multiple navigation options prevent users from getting lost

## [2024-12-19] Main Blog Page Sidebar Enhancement

### Main Blog Page Sidebar Update
- **Categories Section**: Replaced quick links with a comprehensive categories list showing all blog categories
- **Category Counts**: Each category displays the number of posts it contains
- **Tag Cloud**: Added a tags section showing all blog tags as clickable badges
- **Better Navigation**: Users can now browse content by categories and tags directly from the main blog page
- **Consistent Design**: Categories and tags use the same styling as individual blog posts

### Technical Implementation
- **WordPress API Integration**: Fetches all categories and tags using `fetchCategories()` and `fetchTags()`
- **Dynamic Loading**: Categories and tags are loaded alongside recent posts in the sidebar
- **HTML Entity Decoding**: Category and tag names are properly decoded for display
- **Link Structure**: Categories link to `/blog/category/[slug]` and tags link to `/blog/tag/[slug]`
- **Performance**: Efficient API calls with proper error handling and loading states

### User Experience Benefits
- **Content Discovery**: Users can easily browse content by categories and tags
- **Better Organization**: Clear categorization helps users find relevant content
- **Post Counts**: Category post counts help users understand content volume
- **Visual Tags**: Tag badges provide quick visual scanning of available topics
- **Improved Navigation**: More intuitive content browsing experience

## [2024-12-19] Blog Post Related Posts Feature

### Related Posts Implementation
- **Smart Recommendations**: Individual blog posts now show related posts based on WordPress categories and tags
- **Intelligent Matching**: Uses both categories and tags to find the most relevant related content
- **Fallback System**: If no related posts are found, falls back to recent posts
- **Exclusion Logic**: Automatically excludes the current post from related suggestions
- **Performance Optimized**: Efficient API calls with proper caching and error handling

### Technical Implementation
- **fetchRelatedPosts Function**: New WordPress API function that finds posts with matching categories/tags
- **RelatedPosts Component**: New client component for displaying related posts with loading states
- **BlogSidebar Enhancement**: Updated to use related posts instead of generic "You Might Like" suggestions
- **WordPressPost Interface**: Updated to include categories and tags arrays
- **Smart Fallback**: If insufficient related posts, supplements with recent posts

### Related Posts Algorithm
1. **Primary Match**: Finds posts that share categories with the current post
2. **Secondary Match**: Finds posts that share tags with the current post
3. **Fallback**: If not enough related posts, adds recent posts to reach the limit
4. **Exclusion**: Automatically excludes the current post from suggestions
5. **Limit Control**: Configurable limit (default: 6 posts for related, 3 posts for recent)

### Sidebar Layout and Post Counts
- **Related Posts**: Shows 6 related posts based on categories and tags (appears first)
- **Recent Posts**: Shows 3 most recent posts (appears second)
- **Search Section**: Always appears at the top for easy access
- **Smart Positioning**: Related posts appear before recent posts for better relevance

### User Experience Benefits
- **Relevant Suggestions**: Users see posts that are actually related to what they're reading
- **Better Engagement**: More likely to click on related content that matches their interests
- **Improved Navigation**: Helps users discover more content in their areas of interest
- **Consistent Design**: Same beautiful sidebar design with hover effects
- **Loading States**: Smooth loading animations while fetching related posts

## [2024-12-19] Project Cleanup and Long-term Deployment Preparation

### Root Directory Cleanup
The project has been cleaned up for long-term deployment by removing unnecessary development and setup files:

#### Removed Files:
- **WordPress Setup Files**: `check-database.php`, `generate-wp-config.html`, `setup-wordpress-config.sh`, `generate-wp-config.php`, `wp-config-template.php`, `wp-config.php`
- **WordPress Troubleshooting**: `wordpress-fix.sh`, `wordpress-diagnostic.php`, `WORDPRESS_503_TROUBLESHOOTING.md`
- **EC2 Setup Files**: `ec2-setup.sh`, `ec2-setup-al2023.sh`, `manual-mysql-install.sh`, `MANUAL_MYSQL_SETUP.md`, `EC2_SETUP_GUIDE.md`
- **Deployment Scripts**: `deploy-prep.bat`, `deploy-prep.sh`
- **Documentation**: `QUICK_SETUP.md`, `WORDPRESS_INTEGRATION.md`, `WORDPRESS_HEADLESS_SETUP.md`
- **Alternative Configs**: `next.config.static.ts`, `amplify.static.yml`

#### Current Clean File Structure:
```
ck-v2-nextjs/
├── app/                          # Next.js App Router
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── .gitignore                    # Git ignore rules
├── .cursorignore                 # Cursor ignore rules
├── .cursorrules                  # Cursor rules
├── amplify.yml                   # AWS Amplify deployment
├── ck-v2-nextjs.md              # Project documentation
├── eslint.config.mjs            # ESLint configuration
├── next-env.d.ts               # Next.js types
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
├── package-lock.json           # Lock file
├── postcss.config.mjs         # PostCSS configuration
├── README.md                   # Project readme
├── tsconfig.json              # TypeScript configuration
└── node_modules/              # Dependencies (gitignored)
```

### Long-term Deployment Benefits
- **Reduced Repository Size**: Removed ~50MB of unnecessary files
- **Cleaner Development**: Focus on production-ready code only
- **Easier Maintenance**: Less clutter, clearer project structure
- **Faster Builds**: Reduced file scanning and processing
- **Better Security**: Removed sensitive configuration templates

### Production Readiness
- **Essential Files Only**: Only production-necessary files remain
- **Clean Documentation**: Updated documentation reflects current state
- **Optimized Build**: Streamlined for AWS Amplify deployment
- **Environment Management**: Proper `.env.local` configuration
- **Deployment Ready**: Clean, maintainable codebase

### Maintenance Guidelines
- **Keep It Clean**: Only add files that are essential for production
- **Document Changes**: Update documentation for any new additions
- **Regular Reviews**: Periodically review and clean up unnecessary files
- **Version Control**: Maintain clean git history with meaningful commits
- **Environment Management**: Keep environment variables secure and organized

This cleanup ensures the project is optimized for long-term deployment and maintenance while preserving all essential functionality and documentation.

## [2024-12-19] Tag Page 404 Error Fix

### Issue Resolution
- **Problem**: Some individual tag pages were returning 404 errors when tags had no associated posts (`count: 0`)
- **Root Cause**: Tag pages were trying to render `BlogClient` component for tags with no posts, causing rendering errors
- **Solution**: Added graceful handling for tags and categories with no posts by checking the `count` property

### Implementation Details
- **Tag Page Enhancement**: Updated `app/blog/tag/[slug]/page.tsx` to check `tag.count === 0`
- **Category Page Enhancement**: Updated `app/blog/category/[slug]/page.tsx` to check `category.count === 0`
- **Empty State Design**: Added user-friendly empty state with icons, descriptive text, and navigation back to blog
- **Consistent UX**: Maintains breadcrumb navigation and proper page structure even when no posts exist

### Empty State Features
- **Visual Feedback**: Custom SVG icons for tags (document icon) and categories (folder icon)
- **Clear Messaging**: Descriptive text explaining that no posts are currently available
- **Navigation**: "Back to all posts" button for easy navigation
- **SEO Friendly**: Proper page structure and metadata even for empty states
- **Responsive Design**: Works seamlessly on all device sizes

### Technical Implementation
```typescript
// Check if the tag has any posts
if (tag.count === 0) {
  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      {/* Empty state with proper navigation and messaging */}
    </div>
  );
}
```

### User Experience Benefits
- **No More 404s**: Tag pages with no posts now display gracefully instead of errors
- **Clear Communication**: Users understand why no content is shown
- **Easy Navigation**: Simple way to return to the main blog
- **Professional Appearance**: Consistent design with the rest of the site
- **Future-Proof**: Automatically works when new posts are added to empty tags

### Affected Tags
The following tags were causing 404 errors and are now handled gracefully:
- `1970s` (count: 0)
- `animated` (count: 0) 
- `canvas` (count: 0)
- `embroidery` (count: 0)

This fix ensures that all tag and category pages work properly regardless of whether they have associated posts, providing a better user experience and preventing 404 errors.

## [2024-12-19] IndexNow Integration for Faster Search Engine Indexing

### IndexNow Implementation Overview
- **Protocol Integration**: Full IndexNow protocol implementation for instant search engine notification
- **WordPress Integration**: Automatic submission of new WordPress content (posts, categories, tags)
- **API Endpoints**: RESTful API endpoints for manual and automated submissions
- **Debug Interface**: Comprehensive testing and debugging interface
- **Multi-Engine Support**: Support for Google, Bing, Yandex, and other search engines
- **Security Features**: Webhook authentication and URL validation

### Core Features
- **Automatic WordPress Submissions**: New posts, categories, and tags are automatically submitted
- **Manual URL Submission**: Submit any URL for immediate indexing
- **Batch Submissions**: Submit multiple URLs simultaneously
- **Search Engine Selection**: Choose which search engines to submit to
- **Real-time Feedback**: Immediate response on submission success/failure
- **Configuration Management**: Centralized configuration and status monitoring

### Technical Implementation
- **IndexNow Utility**: `app/lib/indexnow.ts` - Core IndexNow functionality
- **API Routes**: 
  - `app/api/indexnow/route.ts` - Main IndexNow API endpoint
  - `app/api/wordpress-webhook/route.ts` - WordPress webhook endpoint
- **Debug Interface**: `app/debug/indexnow/page.tsx` - Testing and debugging interface
- **WordPress Plugin**: `wordpress-indexnow-plugin.php` - WordPress integration plugin

### API Endpoints
```typescript
// Submit URLs to IndexNow
POST /api/indexnow
{
  "urls": ["https://www.cowboykimono.com/blog/example-post"],
  "searchEngines": ["google", "bing"]
}

// WordPress webhook for automatic submissions
POST /api/wordpress-webhook
{
  "action": "publish",
  "post_type": "post",
  "post_slug": "example-post",
  "post_status": "publish"
}

// Get configuration status
GET /api/indexnow
```

### WordPress Integration
- **Automatic Triggers**: Posts, categories, and tags are submitted when published
- **Webhook System**: WordPress calls webhook endpoint for real-time submissions
- **Plugin Support**: WordPress plugin for easy integration and management
- **Manual Functions**: PHP functions for manual submission from themes/plugins
- **Error Logging**: Comprehensive error logging for debugging

### Configuration Requirements
- **IndexNow Key**: Generate key from IndexNow.org or create custom key
- **Key File**: Create `{key}.txt` file at domain root with key content
- **Environment Variables**: 
  - `NEXT_PUBLIC_INDEXNOW_KEY` - Your IndexNow key
  - `WORDPRESS_WEBHOOK_SECRET` - Optional webhook authentication secret

### Debug and Testing
- **Debug Interface**: Visit `/debug/indexnow` for comprehensive testing
- **Configuration Status**: Real-time configuration validation
- **URL Testing**: Test individual URL submissions
- **WordPress Testing**: Test WordPress content submissions
- **Search Engine Selection**: Choose which engines to test with
- **Response Monitoring**: Real-time submission response monitoring

### Benefits for SEO
- **Faster Indexing**: Content indexed within hours instead of days/weeks
- **Better Discovery**: Search engines discover new content immediately
- **Improved Rankings**: Faster indexing can lead to better search rankings
- **Content Freshness**: Search engines see content updates quickly
- **Competitive Advantage**: Stay ahead of competitors in search results

### Security and Performance
- **URL Validation**: All URLs are validated to ensure they're from your domain
- **Webhook Authentication**: Optional secret-based authentication for webhooks
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Built-in protection against excessive submissions
- **Minimal Overhead**: Lightweight implementation with no user impact

### Setup Instructions
1. **Generate IndexNow Key**: Visit IndexNow.org or create custom key
2. **Create Key File**: Place `{key}.txt` at domain root
3. **Configure Environment**: Set `NEXT_PUBLIC_INDEXNOW_KEY` environment variable
4. **Test Integration**: Use debug interface at `/debug/indexnow`
5. **Install WordPress Plugin**: Copy plugin file to WordPress site (optional)
6. **Monitor Results**: Check submission success rates and indexing speed

### WordPress Plugin Features
- **Automatic Submission**: Submits new content automatically when published
- **Admin Interface**: Settings page in WordPress admin (Settings > IndexNow and main IndexNow menu)
- **Test Functionality**: Test submissions with recent posts
- **Manual Submission**: Functions for manual URL submission
- **Error Logging**: Comprehensive error logging for debugging
- **Configuration Management**: Easy webhook URL and secret configuration
- **Plugin Activation**: Automatic setup of default options on activation
- **Status Monitoring**: Real-time status display in admin interface

### Monitoring and Analytics
- **Success Tracking**: Monitor submission success rates
- **Error Logging**: Comprehensive error logging for debugging
- **Response Times**: Track search engine response times
- **Indexing Speed**: Monitor how quickly content appears in search results
- **Configuration Status**: Real-time configuration validation

### Best Practices
- **Submit Only New Content**: Don't submit unchanged URLs
- **Batch Submissions**: Submit multiple URLs together when possible
- **Monitor Success Rates**: Track submission success and failures
- **Regular Testing**: Test the integration regularly
- **Keep Keys Secure**: Rotate keys periodically and keep them secure
- **Use Webhook Secrets**: Enable webhook authentication for production

### Troubleshooting
- **Configuration Issues**: Check environment variables and key file accessibility
- **Submission Failures**: Verify URLs are from your domain and properly formatted
- **WordPress Integration**: Ensure webhook URL is correct and accessible
- **Search Engine Issues**: Check individual search engine endpoints and responses
- **Performance Issues**: Monitor submission frequency and response times

This IndexNow integration provides immediate search engine notification for all new content, significantly improving indexing speed and SEO performance for the Cowboy Kimono website.

## [2024-12-19] Build Error Fixes and ESLint Compliance

### Build Issues Resolved
- **ESLint Errors**: Fixed all ESLint errors that were preventing successful builds on Amplify
- **TypeScript Issues**: Resolved TypeScript type errors and improved type safety
- **Unused Variables**: Removed unused imports and variables throughout the codebase
- **React Hook Dependencies**: Fixed React Hook dependency warnings for proper component behavior
- **Unescaped Entities**: Fixed HTML entity escaping issues in category and tag pages

### Specific Fixes Implemented

#### API Route Fixes
- **IndexNow API**: Removed unused `validateIndexNowKey` import from `/api/indexnow/route.ts`
- **WordPress Webhook**: Removed unused `post_id` variable from `/api/wordpress-webhook/route.ts`

#### Component Fixes
- **IndexNowSubmitter**: 
  - Removed unused `validateIndexNowKey` import
  - Fixed TypeScript `any` type issues with proper type definitions
  - Added `SearchEngine` type for better type safety
  - Removed unused `setConfig` state setter
- **WordPressBlog**: 
  - Added `useCallback` for `handleSearch` function to prevent unnecessary re-renders
  - Fixed useEffect dependencies for proper component behavior
- **BlogClient**: 
  - Added missing dependencies to useEffect for proper state management

#### Page Fixes
- **Category Pages**: Fixed unescaped quotes in empty state messages using proper HTML entities
- **Tag Pages**: Fixed unescaped quotes in empty state messages using proper HTML entities

### Build Configuration
- **ESLint**: Strict ESLint configuration maintained for code quality
- **TypeScript**: Strict TypeScript checking enabled for type safety
- **Build Process**: All builds now complete successfully without errors
- **Amplify Compatibility**: Build configuration optimized for AWS Amplify deployment

### Code Quality Improvements
- **Type Safety**: Enhanced TypeScript types throughout the codebase
- **Performance**: Optimized React components with proper dependency management
- **Maintainability**: Cleaner code with removed unused imports and variables
- **Standards Compliance**: All code now follows ESLint and TypeScript standards

### Deployment Readiness
- **Build Success**: All builds now complete successfully
- **Error Free**: No ESLint errors or TypeScript issues
- **Amplify Ready**: Optimized for AWS Amplify deployment
- **Production Ready**: Clean, maintainable codebase ready for production deployment

These fixes ensure that the project builds successfully on AWS Amplify and maintains high code quality standards for long-term maintainability.
