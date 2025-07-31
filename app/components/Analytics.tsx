'use client';

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
  // Don't render scripts if no valid measurement ID
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    console.warn('Google Analytics: Invalid or missing measurement ID');
    return null;
  }

  return (
    <>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          // Google Analytics script loaded successfully
        }}
        onError={(e) => {
          console.error('Failed to load Google Analytics script:', e);
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: true
          });
          console.log('GA4 configured for:', '${measurementId}');
        `}
      </Script>
    </>
  );
};

export default Analytics;
