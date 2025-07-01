import SimpleImage from '../components/SimpleImage';
import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: "About Us",
  description: "Learn about Cowboy Kimonos - our story, craftsmanship, and passion for creating unique western-inspired apparel. Discover the artistry behind our handcrafted robes and kimonos.",
  keywords: ["about cowboy kimonos", "artisan story", "handcrafted clothing", "western fashion history"],
  canonical: "/about",
});

const AboutPage = () => {
  return (
    <div className="min-h-screen w-full relative">
      <SimpleImage
        src="/images/CK_Web_Head_Under_Construction.jpg"
        alt="Cowboy Kimonos Under Construction"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
};

export default AboutPage;
