'use client';

import React from 'react';

import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ErrorBoundary } from '@/frontend/shared/layout/ErrorBoundary';
import { AppSidebar } from '@/frontend/shared/layout/Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="grid grid-cols-1 gap-6">{children}</div>
      </SidebarInset>
    </ErrorBoundary>
  );
}
