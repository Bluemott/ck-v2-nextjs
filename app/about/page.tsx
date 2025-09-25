import { Metadata } from 'next';
import Image from 'next/image';
import { generateSEOMetadata } from '../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Us',
  description:
    'Learn about Cowboy Kimono - our story, craftsmanship, and passion for creating unique western-inspired apparel. Discover the artistry behind our handpainted denim jackets.',
  keywords: [
    'about cowboy kimono',
    'artisan story',
    'handpainted denim',
    'western fashion history',
  ],
  canonical: '/about',
});

const AboutPage = () => {
  return (
    <div className="min-h-screen w-full relative">
      <Image
        src="/images/CK_Web_Head_Under_Construction.webp"
        alt="Cowboy Kimono Under Construction"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
};

export default AboutPage;
