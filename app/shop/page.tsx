import { Metadata } from 'next';
import Script from 'next/script';
import {
  faqStructuredData,
  generateProductStructuredData,
} from '../components/StructuredData';
import { generateSEOMetadata } from '../lib/seo';
import ShopClient from './ShopClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Shop',
  description:
    'Shop our unique collection of handpainted denim jackets and artistic apparel. Each piece is carefully crafted with attention to detail and artistic flair.',
  keywords: [
    'cowboy kimono shop',
    'handpainted denim',
    'handpainted jackets',
    'western apparel',
    'artistic clothing',
    'unique fashion',
    'etsy shop',
  ],
  canonical: '/shop',
});

export default function ShopPage() {
  const productData = generateProductStructuredData({
    name: 'Handpainted Denim Jacket',
    description:
      'Unique handpainted denim jacket blending Western and Eastern aesthetics with premium materials and artistic design. Each piece is one-of-a-kind wearable art.',
    price: '150.00',
    image: 'https://www.cowboykimono.com/images/CK_New_Hero_Red_Head-1.webp',
    url: 'https://www.cowboykimono.com/shop',
    availability: 'InStock',
    sku: 'CK-DJ-001',
    brand: 'Cowboy Kimono',
    category: 'Apparel > Jackets > Denim',
    material: 'Recycled Denim, Premium Fabric Paints',
    color: 'Red, Blue, Black, Multi-color',
    size: 'One Size Fits Most (S-XL)',
    condition: 'New',
    weight: '1.5 lbs',
    height: '24 inches',
    width: '18 inches',
    depth: '2 inches',
  });

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cowboy Kimono Shop',
    url: 'https://www.cowboykimono.com/shop',
    description:
      'Shop our unique collection of handpainted denim jackets and western-inspired apparel',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.cowboykimono.com/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* Structured Data for WebSite - Server-side rendered */}
      <Script
        id="structured-data-website-shop"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />

      {/* Structured Data for Featured Product - Server-side rendered */}
      <Script
        id="structured-data-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productData),
        }}
      />

      {/* Structured Data for FAQ - Server-side rendered */}
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <div className="pt-16">
        <ShopClient />
      </div>
    </>
  );
}
