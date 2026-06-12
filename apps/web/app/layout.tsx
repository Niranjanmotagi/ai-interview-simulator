import type { Metadata } from 'next';
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
  title: {
    default: 'AI Interview Simulator — Practice interviews that adapt to you',
    template: '%s · AI Interview Simulator',
  },
  description:
    'Upload your resume, get personalized mock interviews, rubric-based AI feedback, and a concrete improvement plan.',
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
