import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import ShopClient from './ShopClient';
import StructuredData, { generateProductStructuredData, faqStructuredData } from '../components/StructuredData';

export const metadata: Metadata = generateSEOMetadata({
  title: "Shop",
  description: "Shop our unique collection of handcrafted cowboy kimonos, western-inspired robes, and artistic apparel. Each piece is carefully crafted with attention to detail and artistic flair.",
  keywords: ["cowboy kimono shop", "handcrafted robes", "western apparel", "artistic clothing", "unique fashion", "etsy shop"],
  canonical: "/shop",
});

export default function ShopPage() {
  return (
    <>
      {/* Structured Data for WebSite */}
      <StructuredData
        type="WebSite"
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Cowboy Kimono Shop',
          url: 'https://www.cowboykimono.com/shop',
          description: 'Shop our unique collection of handcrafted cowboy kimonos and western-inspired apparel',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://www.cowboykimono.com/shop?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      
      {/* Structured Data for Featured Product */}
      <StructuredData
        type="Product"
        data={generateProductStructuredData({
          name: 'Handcrafted Cowboy Kimono',
          description: 'Unique handcrafted cowboy kimono blending Western and Eastern aesthetics with premium materials and artistic design.',
          price: '150.00',
          image: 'https://www.cowboykimono.com/images/CK_New_Hero_Red_Head-1.webp',
          url: 'https://www.cowboykimono.com/shop',
          availability: 'InStock',
          brand: 'Cowboy Kimono',
          category: 'Apparel',
          material: 'Cotton, Silk',
          color: 'Red, Blue, Black',
          size: 'One Size Fits Most'
        })}
      />
      
      {/* Structured Data for FAQ */}
      <StructuredData
        type="FAQPage"
        data={faqStructuredData}
      />
      
      <div className="pt-16">
        <ShopClient />
      </div>
    </>
  );
}
