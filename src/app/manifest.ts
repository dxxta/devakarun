import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'dev.akarun',
    short_name: 'dev.akarun',
    start_url: '/',
    display: 'standalone',
    theme_color: '#d4f03c',
    background_color: '#f7efe7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
