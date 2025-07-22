'use client';

import { useEffect } from 'react';

const GoogleAnalytics = () => {
  useEffect(() => {
    // Load Google Analytics asynchronously after page load
    const loadGoogleAnalytics = () => {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${
        process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-DL317B831Y"
      }`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.async = true;
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${
          process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-DL317B831Y"
        }');
      `;
      document.head.appendChild(script2);
    };

    // Load analytics after a short delay to prioritize page content
    const timer = setTimeout(loadGoogleAnalytics, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default GoogleAnalytics; 