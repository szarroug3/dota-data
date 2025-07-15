import { render, screen } from '@testing-library/react';
import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';

// Mock the AppSidebar component
jest.mock('@/components/layout/Sidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock the ErrorBoundary component
jest.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock the SidebarProvider and SidebarInset components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarInset: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sidebar-inset" className={className}>{children}</div>
  ),
}));

describe('AppLayout', () => {
  it('renders sidebar and children content', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders with proper layout structure', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    // Check that the sidebar inset has the correct classes
    const sidebarInset = screen.getByTestId('sidebar-inset');
    expect(sidebarInset).toHaveClass('p-6');
  });

  it('renders main content area with proper styling', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    // The main content area should be present
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('wraps children in proper grid layout', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    // The content should be wrapped in a grid layout
    const content = screen.getByTestId('test-content');
    const gridContainer = content.closest('.grid');
    expect(gridContainer).toBeInTheDocument();
  });
}); 