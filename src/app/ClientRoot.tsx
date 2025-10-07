'use client';

import { ThemeProvider } from 'next-themes';
import React from 'react';

import { AppDataProvider } from '@/contexts/app-data-context';
import { ConfigProvider } from '@/frontend/contexts/config-context';
import { ShareProvider } from '@/frontend/contexts/share-context';
import { AppLayout } from '@/frontend/shared/layout/AppLayout';
interface ClientRootProps {
  children: React.ReactNode;
}

function AppContent({ children }: ClientRootProps) {
  return <AppLayout>{children}</AppLayout>;
}

export function ClientRoot({ children }: ClientRootProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* AppData Context - centralized data store for teams, matches, players */}
      <AppDataProvider>
        {/* Share mode and config contexts */}
        <ShareProvider>
          <ConfigProvider>
            <AppContent>{children}</AppContent>
          </ConfigProvider>
        </ShareProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
