import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Interview Simulator',
    short_name: 'AI Interview',
    description:
      'Personalized AI mock interviews with rubric feedback and improvement plans.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#16a34a',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
