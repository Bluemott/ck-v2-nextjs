import OptimizedImage from './OptimizedImage';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  // Responsive breakpoints
  mobile?: { width: number; height: number };
  tablet?: { width: number; height: number };
  desktop?: { width: number; height: number };
  // Default sizes if breakpoints not provided
  defaultWidth?: number;
  defaultHeight?: number;
}

export default function ResponsiveImage({
  src,
  alt,
  className,
  priority = false,
  objectFit = 'cover',
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  mobile,
  tablet,
  desktop,
  defaultWidth = 400,
  defaultHeight = 300,
}: ResponsiveImageProps) {
  // Determine responsive sizes
  const sizes = mobile && tablet && desktop 
    ? `(max-width: 768px) ${mobile.width}px, (max-width: 1024px) ${tablet.width}px, ${desktop.width}px`
    : `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw`;

  // Use the largest size as default for better quality
  const width = desktop?.width || tablet?.width || mobile?.width || defaultWidth;
  const height = desktop?.height || tablet?.height || mobile?.height || defaultHeight;

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      objectFit={objectFit}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
