import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ErrorBoundary } from '@/frontend/shared/layout/ErrorBoundary';

import { ClientRoot } from './ClientRoot';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dota Scout Assistant - Team Performance Analytics',
  description: 'Comprehensive Dota 2 performance analytics, match history, player statistics, and draft suggestions.',
  keywords: 'Dota 2, team performance, match history, player stats, draft suggestions',
  authors: [{ name: 'Dota Scout Assistant Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Dota Scout Assistant - Team Performance Analytics',
    description: 'Comprehensive Dota 2 performance analytics and insights',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dota Scout Assistant - Team Performance Analytics',
    description: 'Comprehensive Dota 2 performance analytics and insights',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ErrorBoundary>
          <SidebarProvider defaultOpen={defaultOpen}>
            <ClientRoot>{children}</ClientRoot>
          </SidebarProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
