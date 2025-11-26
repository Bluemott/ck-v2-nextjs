import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import DownloadsClient from './DownloadsClient';

// ISR: Revalidate every 10 minutes for fresh content
export const revalidate = 600;

export const metadata: Metadata = generateSEOMetadata({
  title: "Downloads",
  description: "Free downloadable resources from Cowboy Kimono - coloring pages, craft templates, and DIY tutorials. Enhance your western fashion experience with our free patterns and guides.",
  keywords: ["free downloads", "coloring pages", "craft templates", "DIY tutorials", "western patterns", "cowboy kimono resources"],
  canonical: "/downloads",
});

export default function DownloadsPage() {
  return (
    <div className="pt-16">
      <DownloadsClient />
    </div>
  );
}
