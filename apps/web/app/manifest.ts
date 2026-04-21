import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'شعللها',
    short_name: 'شعللها',
    description: 'لعبة الأسئلة والتسلية العربية',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#7c3aed',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
