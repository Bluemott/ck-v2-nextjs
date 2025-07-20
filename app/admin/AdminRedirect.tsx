'use client';

import { useEffect } from 'react';
import { getWordPressAdminUrl } from '../lib/wordpress';

export default function AdminRedirect() {
  useEffect(() => {
    const adminUrl = getWordPressAdminUrl();
    window.location.href = adminUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e2939] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to WordPress admin...</p>
        <p className="text-sm text-gray-500 mt-2">
          If you&apos;re not redirected automatically,{' '}
          <a 
            href={getWordPressAdminUrl()} 
            className="text-[#1e2939] hover:text-[#2a3441] underline"
          >
            click here
          </a>
        </p>
      </div>
    </div>
  );
} 