import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GoogleTagManager from './components/GoogleTagManager';
import GoogleAnalytics from './components/GoogleAnalytics';
import { env, isDevelopment } from './lib/env';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Cowboy Kimono - Western Fashion & Handcraft Stories',
    template: '%s | Cowboy Kimono'
  },
  description: 'Discover western fashion, handcraft stories, and design inspiration from Cowboy Kimono. Explore our blog for creative DIY projects, fashion tips, and western lifestyle content.',
  keywords: [
    'cowboy kimono',
    'western fashion',
    'handcraft stories',
    'design inspiration',
    'DIY projects',
    'western lifestyle',
    'fashion blog',
    'craft blog'
  ],
  authors: [{ name: 'Cowboy Kimono' }],
  creator: 'Cowboy Kimono',
  publisher: 'Cowboy Kimono',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Cowboy Kimono',
    title: 'Cowboy Kimono - Western Fashion & Handcraft Stories',
    description: 'Discover western fashion, handcraft stories, and design inspiration from Cowboy Kimono.',
    images: [
      {
        url: `${env.NEXT_PUBLIC_SITE_URL}/images/CK_Logo_Blog.webp`,
        width: 1200,
        height: 630,
        alt: 'Cowboy Kimono - Western Fashion & Handcraft Stories',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cowboy Kimono - Western Fashion & Handcraft Stories',
    description: 'Discover western fashion, handcraft stories, and design inspiration from Cowboy Kimono.',
    images: [`${env.NEXT_PUBLIC_SITE_URL}/images/CK_Logo_Blog.webp`],
    creator: '@cowboykimono',
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
    google: env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = env.NEXT_PUBLIC_GTM_ID || 'GTM-PNZTN4S4';

  return (
    <html lang="en" className={playfair.variable}>
      <head>
        {/* Google Tag Manager */}
        <GoogleTagManager gtmId={gtmId} />
        
        {/* Google Analytics */}
        <GoogleAnalytics />
        
        {/* Google and Bing verification */}
        {env.NEXT_PUBLIC_GOOGLE_VERIFICATION && (
          <meta name="google-site-verification" content={env.NEXT_PUBLIC_GOOGLE_VERIFICATION} />
        )}
        
        {/* Bing verification */}
        <meta name="msvalidate.01" content="BING_VERIFICATION_CODE" />
        
        {/* Additional meta tags for better SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8B4513" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cowboy Kimono" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Cowboy Kimono",
              "url": env.NEXT_PUBLIC_SITE_URL,
              "logo": `${env.NEXT_PUBLIC_SITE_URL}/images/CK_Logo_Blog.webp`,
              "description": "Western fashion and handcraft stories",
              "sameAs": [
                "https://www.instagram.com/cowboykimono",
                "https://www.facebook.com/cowboykimono",
                "https://www.pinterest.com/cowboykimono"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "hello@cowboykimono.com"
              }
            })
          }}
        />
      </head>
      <body className={playfair.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
        
        {/* Development mode indicator */}
        {isDevelopment && (
          <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold z-50">
            DEV MODE
          </div>
        )}
      </body>
    </html>
  );
}
