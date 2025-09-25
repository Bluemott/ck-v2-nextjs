import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cowboy Kimono - Handpainted Denim Apparel',
    short_name: 'Cowboy Kimono',
    description:
      'Discover unique handpainted denim jackets and apparel blending Western and Eastern aesthetics.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFEBCD',
    theme_color: '#8B4513',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        src: '/images/CK_Logo_Title-01.webp',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        src: '/images/CK_Logo_Title-01.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
    ],
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle', 'fashion'],
  };
}
