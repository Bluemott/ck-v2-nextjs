'use client';

import { useState } from 'react';
import Link from 'next/link';

const FloatingSocialMedia = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://instagram.com/cowboykimonos',
      icon: '📷',
      bgColor: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/cowboykimonos',
      icon: '📘',
      bgColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/cowboykimonos',
      icon: '🐦',
      bgColor: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      name: 'Pinterest',
      url: 'https://pinterest.com/cowboykimonos',
      icon: '📌',
      bgColor: 'bg-red-600 hover:bg-red-700'
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
            className={`w-12 h-12 rounded-full ${social.bgColor} text-white flex items-center justify-center text-xl shadow-lg transition-all duration-200 transform hover:scale-110`}
            style={{
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
            }}
          >
            <span className="text-lg">{social.icon}</span>
          </Link>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleExpanded}
        className={`w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-800 text-white flex items-center justify-center text-2xl shadow-lg transition-all duration-300 transform ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        } hover:scale-110`}
        aria-label="Toggle social media links"
      >
        <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`}>
          {isExpanded ? '✕' : '🔗'}
        </span>
      </button>
    </div>
  );
};

export default FloatingSocialMedia;
