import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  // Validate required props early
  const hasInvalidSrc = !src || typeof src !== 'string' || src.trim() === '';
  const hasInvalidDimensions =
    !fill && (!width || !height || width <= 0 || height <= 0);

  if (hasInvalidSrc) {
    console.error('OptimizedImage - Invalid src prop:', src);
  }

  if (hasInvalidDimensions) {
    console.error('OptimizedImage - Invalid width/height props:', {
      width,
      height,
      fill,
    });
  }

  // Handle placeholder for external images
  const isExternalImage = src.startsWith('http');
  const effectivePlaceholder =
    isExternalImage && !blurDataURL ? 'empty' : placeholder;

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = () => {
    console.error('OptimizedImage - Image failed to load:', { src, alt });
    setHasError(true);
    onError?.();
  };

  // If there's an error or invalid props, show placeholder
  if (hasError || hasInvalidSrc || hasInvalidDimensions) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageClassName = `
    ${
      objectFit === 'cover'
        ? 'object-cover'
        : objectFit === 'contain'
          ? 'object-contain'
          : objectFit === 'fill'
            ? 'object-fill'
            : objectFit === 'none'
              ? 'object-none'
              : objectFit === 'scale-down'
                ? 'object-scale-down'
                : 'object-cover'
    } 
    transition-all duration-300 ease-in-out
  `.trim();

  return (
    <>
      {fill ? (
        <div
          className={`relative overflow-hidden ${className}`}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '64px',
            minWidth: '64px',
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            quality={quality}
            placeholder={effectivePlaceholder}
            blurDataURL={blurDataURL}
            className={imageClassName}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          quality={quality}
          placeholder={effectivePlaceholder}
          blurDataURL={blurDataURL}
          className={`${imageClassName} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </>
  );
}
