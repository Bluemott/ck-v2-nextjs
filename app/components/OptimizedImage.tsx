'use client';

import { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  priority = false,
  sizes,
  objectFit = 'cover',
  fallbackSrc = '/images/placeholder.jpg'
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  const imageProps = {
    src: imgSrc,
    alt: alt || '',
    onLoad: handleLoad,
    onError: handleError,
    className: `transition-opacity duration-300 ${
      isLoading ? 'opacity-0' : 'opacity-100'
    } ${className}`,
    priority,
    sizes,
    style: fill ? { objectFit } : undefined,
    ...(fill ? { fill: true } : { width, height }),
  };

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
          style={fill ? {} : { width, height }}
        >
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Actual image */}
      <Image {...imageProps} />

      {/* Error state */}
      {hasError && imgSrc === fallbackSrc && (
        <div 
          className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${className}`}
          style={fill ? {} : { width, height }}
        >
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
