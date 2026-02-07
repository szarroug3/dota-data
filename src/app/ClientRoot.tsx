'use client';

import { ThemeProvider } from 'next-themes';
import React from 'react';

import { AppDataProvider } from '@/contexts/app-data-context';
import { ConfigProvider } from '@/frontend/contexts/config-context';
import { ShareProvider } from '@/frontend/contexts/share-context';
import { AppLayout } from '@/frontend/shared/layout/AppLayout';
import { useAppHydration } from '@/hooks/app-data/useAppHydration';
interface ClientRootProps {
  children: React.ReactNode;
}

function AppContent({ children }: ClientRootProps) {
  const { hasHydrated, hydrationError } = useAppHydration();

  if (hydrationError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" role="alert">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">Hydration failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{hydrationError}</p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" role="status">
        <span className="text-sm text-muted-foreground">Loading app data...</span>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

export function ClientRoot({ children }: ClientRootProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* Share mode and config contexts */}
      <ShareProvider>
        {/* AppData Context - centralized data store for teams, matches, players */}
        <AppDataProvider>
          <ConfigProvider>
            <AppContent>{children}</AppContent>
          </ConfigProvider>
        </AppDataProvider>
      </ShareProvider>
    </ThemeProvider>
  );
}
