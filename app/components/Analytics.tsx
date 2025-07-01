'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface AnalyticsProps {
  measurementId: string;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const Analytics = ({ measurementId }: AnalyticsProps) => {
  useEffect(() => {
    // Only run in production or if measurementId is valid
    if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
      console.warn('Google Analytics: Invalid or missing measurement ID');
      return;
    }

    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    
    // Configure Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true,
      // Enable debug mode in development
      debug_mode: process.env.NODE_ENV === 'development'
    });

    console.log('Google Analytics initialized with ID:', measurementId);
  }, [measurementId]);

  // Don't render scripts if no valid measurement ID
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    return null;
  }

  return (
    <>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true,
            debug_mode: ${process.env.NODE_ENV === 'development'}
          });
          console.log('GA4 Script loaded for:', '${measurementId}');
        `}
      </Script>
    </>
  );
};

export default Analytics;
