'use client';

import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { LoadingSkeleton } from '@/components/layout/LoadingSkeleton';
import { Sidebar } from '@/components/layout/Sidebar';

import { DashboardContent } from './DashboardContent';

export const DashboardPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Dashboard" 
            subtitle="Team performance overview and quick actions"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Suspense fallback={<LoadingSkeleton type="text" lines={3} />}>
              <DashboardContent />
            </Suspense>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}; 