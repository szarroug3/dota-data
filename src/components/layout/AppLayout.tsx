'use client';

import React from 'react';

import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AppSidebar } from '@/components/layout/Sidebar';
import { SidebarInset } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="grid grid-cols-1 gap-6">
          {children}
        </div>
      </SidebarInset>
    </ErrorBoundary>
  )
}