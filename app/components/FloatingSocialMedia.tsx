'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FloatingSocialMedia = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/cowboykimono/',
      icon: '/images/instagram.webp'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/me.marisa.mott/',
      icon: '/images/facebook.webp'
    },
    {
      name: 'Pinterest',
      url: 'https://www.pinterest.com/mottmarisa6quincy1fl/',
      icon: '/images/pinterest.webp'
    },
    {
      name: 'Etsy',
      url: 'https://www.etsy.com/shop/CowboyKimono?ref=shop_sugg_market&dd_referrer=https%3A%2F%2Fwww.etsy.com%2Fmarket%2Fcowboy_kimono%3Fref%3Dlp_queries_internal_bottom-2',
      icon: '/images/etsy.webp'
    }
  ];

  return (
    <div className="fixed bottom-20 right-6 z-40">
      {/* Social Media Links */}
      <div className={`flex flex-col space-y-3 mb-3 transition-all duration-300 ease-in-out ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {socialLinks.map((social, index) => (
          <Link
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
            }}
          >
            {social.icon.startsWith('/images/') ? (
              <Image
                src={social.icon}
                alt={`${social.name} icon`}
                width={24}
                height={24}
                className="w-6 h-6 drop-shadow-md"
              />
            ) : (
              <span className="text-lg drop-shadow-md">{social.icon}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleExpanded}
        className={`w-14 h-14 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-lg transition-all duration-300 transform ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        } hover:scale-110 border-2 border-gray-300`}
        aria-label="Toggle social media links"
      >
        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`}>
          {isExpanded ? (
            <span className="text-2xl text-gray-700">✕</span>
          ) : (
            <Image
              src="/images/CK_Social_Link.webp"
              alt="Social Media"
              width={36}
              height={36}
              className="w-9 h-9"
            />
          )}
        </div>
      </button>
    </div>
  );
};

export default FloatingSocialMedia;
