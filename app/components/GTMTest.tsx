'use client';

import { useEffect } from 'react';

export default function GTMTest() {
  useEffect(() => {
    // Test if GTM is working
    if (typeof window !== 'undefined') {
      // Check if dataLayer exists
      if (window.dataLayer) {
        console.log('✅ Google Tag Manager is loaded');
        console.log('GTM ID:', process.env.NEXT_PUBLIC_GTM_ID);
        
        // Push a test event
        window.dataLayer.push({
          event: 'gtm_test',
          category: 'test',
          action: 'page_view',
          label: 'GTM Test'
        });
        
        console.log('Test event pushed to dataLayer');
      } else {
        console.log('❌ Google Tag Manager not loaded - dataLayer not found');
      }
    }
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-green-500 text-white p-2 rounded text-xs z-50">
      GTM Test Active - Check Console
    </div>
  );
} 