import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingSocialMedia from "./components/FloatingSocialMedia";
import StructuredData, {
  organizationStructuredData,
  websiteStructuredData,
} from "./components/StructuredData";
import { defaultMetadata } from "./lib/seo";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  ...defaultMetadata,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/CK_Logo_Title-01.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-PNZTN4S4';
  
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager - Head Script */}
        <Script
          id="gtm-head"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `,
          }}
        />

        {/* Google Site Verification */}
        <meta
          name="google-site-verification"
          content={
            process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
            "your-google-verification-code"
          }
        />

        {/* Structured Data */}
        <StructuredData type="Organization" data={organizationStructuredData} />
        <StructuredData type="WebSite" data={websiteStructuredData} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#8B4513" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cowboy Kimono" />
        <meta name="application-name" content="Cowboy Kimono" />
        <meta name="msapplication-TileColor" content="#8B4513" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Additional Social Media Meta Tags */}
        <meta name="twitter:site" content="@cowboykimono" />
        <meta name="twitter:creator" content="@cowboykimono" />
        <meta property="og:site_name" content="Cowboy Kimono" />
        <meta property="og:locale" content="en_US" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
        style={{ marginTop: "67px" }} // Adjust margin to match the height of the Navbar
      >
        {/* Google Tag Manager (noscript) - Body Script */}
        <noscript>
          <iframe 
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        
        <Navbar />
        {children}
        <FloatingSocialMedia />
        <Footer />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
