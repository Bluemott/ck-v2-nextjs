import { Metadata } from 'next';

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

const defaultSEO = {
  title: 'Cowboy Kimono - Handcrafted Western-Inspired Robes & Apparel',
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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com'
};

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
  tags = []
}: SEOProps = {}): Metadata {
  const seoTitle = title ? `${title} | ${defaultSEO.title}` : defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = [...defaultSEO.keywords, ...keywords, ...tags];
  const seoImage = ogImage || defaultSEO.ogImage;
  const seoAuthor = author || defaultSEO.author;
  
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
      canonical: canonical || '/',
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonical || '/',
      siteName: 'Cowboy Kimono',
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: title || defaultSEO.title,
        },
      ],
      locale: 'en_US',
      type: ogType,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
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

  return metadata;
}

export const defaultMetadata = generateSEOMetadata();
