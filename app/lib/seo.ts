import { Metadata } from 'next';
import { WPGraphQLPost } from './api';

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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cowboykimono.com'
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
  // Import the convertToS3Url function
  const { convertToS3Url } = await import('./wpgraphql');
  
  // Convert any WordPress URLs to S3 URLs
  const convertedOgImage = ogImage ? convertToS3Url(ogImage) : undefined;
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

// Helper function to extract Yoast SEO data from WordPress posts
export function extractYoastSEOData(post: WPGraphQLPost): SEOProps['yoastSEO'] {
  if (!post?.seo) return undefined;
  
  // Import the convertToS3Url function
  const { convertToS3Url } = await import('./wpgraphql');
  
  return {
    title: post.seo.title,
    metaDesc: post.seo.metaDesc,
    canonical: post.seo.canonical,
    opengraphTitle: post.seo.opengraphTitle,
    opengraphDescription: post.seo.opengraphDescription,
    opengraphImage: post.seo.opengraphImage?.sourceUrl ? convertToS3Url(post.seo.opengraphImage.sourceUrl) : undefined,
    twitterTitle: post.seo.twitterTitle,
    twitterDescription: post.seo.twitterDescription,
    twitterImage: post.seo.twitterImage?.sourceUrl ? convertToS3Url(post.seo.twitterImage.sourceUrl) : undefined,
    focuskw: post.seo.focuskw,
    metaKeywords: post.seo.metaKeywords,
    metaRobotsNoindex: post.seo.metaRobotsNoindex,
    metaRobotsNofollow: post.seo.metaRobotsNofollow,
    opengraphType: post.seo.opengraphType,
    opengraphUrl: post.seo.opengraphUrl,
    opengraphSiteName: post.seo.opengraphSiteName,
    opengraphAuthor: post.seo.opengraphAuthor,
    opengraphPublishedTime: post.seo.opengraphPublishedTime,
    opengraphModifiedTime: post.seo.opengraphModifiedTime,
    schema: post.seo.schema?.raw,
  };
}

export const defaultMetadata = generateSEOMetadata();
