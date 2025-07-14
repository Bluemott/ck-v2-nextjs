import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cowboy Kimono - Handcrafted Western Apparel',
    short_name: 'Cowboy Kimono',
    description: 'Discover unique handcrafted cowboy kimonos blending Western and Eastern aesthetics.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFEBCD',
    theme_color: '#8B4513',
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/images/CK_Logo_Title-01.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/CK_Logo_Title-01.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle', 'fashion']
  }
}
