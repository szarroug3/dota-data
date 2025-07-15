'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { Sidebar } from '@/components/layout/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 bg-background text-foreground transition-colors duration-300">
            <Suspense fallback={<LoadingSkeleton type="text" lines={3} />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}; 