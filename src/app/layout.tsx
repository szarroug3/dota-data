import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

import { ClientRoot } from './ClientRoot';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dota Data - Team Performance Analytics',
  description: 'Comprehensive Dota 2 team performance analytics, match history, player statistics, and draft suggestions.',
  keywords: 'Dota 2, analytics, team performance, match history, player stats, draft suggestions',
  authors: [{ name: 'Dota Data Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Dota Data - Team Performance Analytics',
    description: 'Comprehensive Dota 2 team performance analytics and insights',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dota Data - Team Performance Analytics',
    description: 'Comprehensive Dota 2 team performance analytics and insights',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ErrorBoundary>
          <ClientRoot>
            {children}
          </ClientRoot>
        </ErrorBoundary>
      </body>
    </html>
  );
} 