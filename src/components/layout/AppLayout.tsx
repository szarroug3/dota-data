'use client';

import React from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AppSidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar />
        <main>
          {children}
        </main>
      </SidebarProvider>
    </ErrorBoundary>
  )
}