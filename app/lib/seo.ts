import { Metadata } from 'next';
import { env } from './env';

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
  // Yoast SEO specific fields
  yoastSEO?: {
    title?: string;
    metaDesc?: string;
    canonical?: string;
    opengraphTitle?: string;
    opengraphDescription?: string;
    opengraphImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    focuskw?: string;
    metaKeywords?: string;
    metaRobotsNoindex?: string;
    metaRobotsNofollow?: string;
    opengraphType?: string;
    opengraphUrl?: string;
    opengraphSiteName?: string;
    opengraphAuthor?: string;
    opengraphPublishedTime?: string;
    opengraphModifiedTime?: string;
    schema?: string;
  };
}

const defaultSEO = {
  title: 'Cowboy Kimono - Handcrafted Western Robes',
  description: 'Discover unique handcrafted cowboy kimonos blending Western and Eastern aesthetics. Premium quality robes, jackets, and apparel with artistic flair.',
  keywords: [
    'cowboy kimono',
    'western kimono',
    'handcrafted robes',
    'western apparel',
    'artistic clothing',
    'unique fashion',
    'handmade kimonos',
    'western wear',
    'bohemian style',
    'artisan clothing'
  ],
  ogImage: '/images/CK_New_Hero_Red_Head-1.webp',
  ogType: 'website' as const,
  author: 'Cowboy Kimono',
      siteUrl: env.NEXT_PUBLIC_SITE_URL
};

// Helper function to truncate titles to reasonable length
function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) return title;
  return `${title.substring(0, maxLength).trim()}...`;
}

// Helper function to ensure HTML entities are decoded
function ensureDecodedText(text: string): string {
  // Simple HTML entity decoding for common entities
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  canonical,
  ogImage,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  yoastSEO
}: SEOProps = {}): Metadata {
  // Use Yoast SEO data if available, otherwise fall back to provided data
  const yoastTitle = yoastSEO?.title ? ensureDecodedText(yoastSEO.title) : '';
  const yoastDescription = yoastSEO?.metaDesc || '';
  const yoastCanonical = yoastSEO?.canonical || '';
  const yoastOgTitle = yoastSEO?.opengraphTitle ? ensureDecodedText(yoastSEO.opengraphTitle) : '';
  const yoastOgDescription = yoastSEO?.opengraphDescription || '';
  const yoastOgImage = yoastSEO?.opengraphImage || '';
  const yoastTwitterTitle = yoastSEO?.twitterTitle ? ensureDecodedText(yoastSEO.twitterTitle) : '';
  const yoastTwitterDescription = yoastSEO?.twitterDescription || '';
  const yoastTwitterImage = yoastSEO?.twitterImage || '';
  const yoastKeywords = yoastSEO?.metaKeywords ? yoastSEO.metaKeywords.split(',').map(k => k.trim()) : [];
  const yoastFocusKw = yoastSEO?.focuskw ? [yoastSEO.focuskw] : [];
  
  const decodedTitle = title ? ensureDecodedText(title) : '';
  const truncatedTitle = decodedTitle ? truncateTitle(decodedTitle) : '';
  
  // Priority: Yoast SEO > Provided data > Default
  const seoTitle = yoastTitle || (truncatedTitle ? `${truncatedTitle} | ${defaultSEO.title}` : defaultSEO.title);
  const seoDescription = yoastDescription || description || defaultSEO.description;
  const seoKeywords = [...defaultSEO.keywords, ...keywords, ...tags, ...yoastKeywords, ...yoastFocusKw];
  
  // Use the original image URL (no S3 conversion needed for REST API)
  const convertedOgImage = ogImage;
  const seoImage = yoastOgImage || convertedOgImage || defaultSEO.ogImage;
  const seoAuthor = author || defaultSEO.author;
  const seoCanonical = yoastCanonical || canonical || '/';
  
  // Enhanced robots meta tag logic
  const shouldIndex = (() => {
    // If Yoast SEO has explicitly set noindex, respect it
    if (yoastSEO?.metaRobotsNoindex) {
      const noindexValue = yoastSEO.metaRobotsNoindex.toLowerCase();
      // Check for various noindex values that Yoast might return
      if (noindexValue === '1' || noindexValue === 'true' || noindexValue === 'noindex') {
        return false;
      }
    }
    // Default to allowing indexing for blog posts
    return true;
  })();
  
  const shouldFollow = (() => {
    // If Yoast SEO has explicitly set nofollow, respect it
    if (yoastSEO?.metaRobotsNofollow) {
      const nofollowValue = yoastSEO.metaRobotsNofollow.toLowerCase();
      // Check for various nofollow values that Yoast might return
      if (nofollowValue === '1' || nofollowValue === 'true' || nofollowValue === 'nofollow') {
        return false;
      }
    }
    // Default to allowing following for blog posts
    return true;
  })();
  
  const metadata: Metadata = {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords.join(', '),
    authors: [{ name: seoAuthor }],
    creator: seoAuthor,
    publisher: 'Cowboy Kimono',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(defaultSEO.siteUrl),
    alternates: {
      canonical: `${defaultSEO.siteUrl}${seoCanonical}`,
    },
    openGraph: {
      title: yoastOgTitle || seoTitle,
      description: yoastOgDescription || seoDescription,
      url: `${defaultSEO.siteUrl}${seoCanonical}`,
      siteName: yoastSEO?.opengraphSiteName || 'Cowboy Kimono',
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: decodedTitle || defaultSEO.title,
        },
      ],
      locale: 'en_US',
      type: (yoastSEO?.opengraphType as 'website' | 'article') || ogType,
      ...(yoastSEO?.opengraphPublishedTime && { publishedTime: yoastSEO.opengraphPublishedTime }),
      ...(yoastSEO?.opengraphModifiedTime && { modifiedTime: yoastSEO.opengraphModifiedTime }),
      ...(publishedTime && !yoastSEO?.opengraphPublishedTime && { publishedTime }),
      ...(modifiedTime && !yoastSEO?.opengraphModifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: yoastTwitterTitle || seoTitle,
      description: yoastTwitterDescription || seoDescription,
      images: yoastTwitterImage ? [yoastTwitterImage] : [seoImage],
      creator: '@cowboykimono',
      site: '@cowboykimono',
    },
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: {
        index: shouldIndex,
        follow: shouldFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'your-google-verification-code',
      other: {
        'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || 'your-bing-verification-code',
      },
    },
  };

  return metadata;
}



export const defaultMetadata: Metadata = {
  title: 'Cowboy Kimono - Creative Crafts & DIY Projects',
  description: 'Discover creative crafts, DIY projects, and artistic inspiration. From coloring pages to craft templates, find everything you need for your next creative project.',
  keywords: ['crafts', 'DIY', 'coloring pages', 'creative projects', 'art', 'crafting'],
  authors: [{ name: 'Cowboy Kimono' }],
  creator: 'Cowboy Kimono',
  publisher: 'Cowboy Kimono',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cowboykimonos.com'),
  alternates: {
    canonical: 'https://cowboykimonos.com/',
  },
  openGraph: {
    title: 'Cowboy Kimono - Creative Crafts & DIY Projects',
    description: 'Discover creative crafts, DIY projects, and artistic inspiration. From coloring pages to craft templates, find everything you need for your next creative project.',
    url: 'https://cowboykimonos.com/',
    siteName: 'Cowboy Kimono',
    images: [
      {
        url: 'https://cowboykimonos.com/images/CK_Logo_Blog.webp',
        width: 1200,
        height: 630,
        alt: 'Cowboy Kimono - Creative Crafts & DIY Projects',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cowboy Kimono - Creative Crafts & DIY Projects',
    description: 'Discover creative crafts, DIY projects, and artistic inspiration.',
    images: ['https://cowboykimonos.com/images/CK_Logo_Blog.webp'],
    creator: '@cowboykimono',
    site: '@cowboykimono',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'your-google-verification-code',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || 'your-bing-verification-code',
    },
  },
};

// Async version for when we need to generate metadata with S3 URL conversion
export async function generateAsyncSEOMetadata(props?: SEOProps): Promise<Metadata> {
  return generateSEOMetadata(props);
}
