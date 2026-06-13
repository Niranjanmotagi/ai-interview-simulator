import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-interview-simulator-sepia.vercel.app'),
  applicationName: 'AI Interview Simulator',
  title: {
    default: 'AI Interview Simulator — Practice interviews that adapt to you',
    template: '%s · AI Interview Simulator',
  },
  description:
    'Upload your resume, get personalized mock interviews, rubric-based AI feedback, and a concrete improvement plan.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'AI Interview',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'AI Interview Simulator',
    description:
      'Personalized AI mock interviews with rubric feedback and improvement plans.',
    type: 'website',
  },
};

// Mobile: device-width viewport, theme color for the browser chrome / PWA,
// and viewportFit=cover so content respects notches / safe-area insets.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
