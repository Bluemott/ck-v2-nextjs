import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingSocialMedia from './components/FloatingSocialMedia';
import GoogleTagManager from './components/GoogleTagManager';
import GoogleAnalytics from './components/GoogleAnalytics';
import RealUserMonitoring from './components/RealUserMonitoring';
import { env } from './lib/env';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
  fallback: ['serif'],
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
    'artisan clothing',
    'handmade kimonos',
    'western robes',
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
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cowboy Kimono - Western Fashion & Handcraft Stories',
    description: 'Discover western fashion, handcraft stories, and design inspiration from Cowboy Kimono.',
    images: [`${env.NEXT_PUBLIC_SITE_URL}/images/CK_Logo_Blog.webp`],
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
    google: env.NEXT_PUBLIC_SITE_VERIFICATION,
  },
  category: 'fashion',
  classification: 'business',
  other: {
    'theme-color': '#8B4513',
    'color-scheme': 'light',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Cowboy Kimono',
    'application-name': 'Cowboy Kimono',
    'msapplication-TileColor': '#8B4513',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.cowboykimono.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//api.cowboykimono.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/images/CK_Logo_Blog.webp" as="image" type="image/webp" />
        <link rel="preload" href="/images/CK_Logo_Title-01.webp" as="image" type="image/webp" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Cowboy Kimono",
              "url": env.NEXT_PUBLIC_SITE_URL,
              "logo": `${env.NEXT_PUBLIC_SITE_URL}/images/CK_Logo_Title-01.webp`,
              "description": "Discover western fashion, handcraft stories, and design inspiration from Cowboy Kimono.",
              "sameAs": [
                "https://www.instagram.com/cowboykimono",
                "https://www.facebook.com/cowboykimono",
                "https://www.pinterest.com/cowboykimono"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English"
              },
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "US"
              }
            })
          }}
        />
        
        {/* Structured Data for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Cowboy Kimono",
              "url": env.NEXT_PUBLIC_SITE_URL,
              "description": "Discover western fashion, handcraft stories, and design inspiration from Cowboy Kimono.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${env.NEXT_PUBLIC_SITE_URL}/api/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${playfair.variable} font-serif antialiased`}>
        <GoogleTagManager gtmId={env.NEXT_PUBLIC_GTM_ID || ''} />
        <GoogleAnalytics />
        <RealUserMonitoring enabled={process.env.NODE_ENV === 'production'} />
        
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50">
          Skip to main content
        </a>
        
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
          <FloatingSocialMedia />
        </div>
      </body>
    </html>
  );
}
