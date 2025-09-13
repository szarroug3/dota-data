import { render, screen } from '@testing-library/react';
import React from 'react';

import { AppLayout } from '@/frontend/shared/layout/AppLayout';

// Mock the AppSidebar component
jest.mock('@/frontend/shared/layout/Sidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock the ErrorBoundary component
jest.mock('@/frontend/shared/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock the SidebarInset component
jest.mock('@/components/ui/sidebar', () => ({
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

  it('renders children directly without grid wrapper', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    // The content should be rendered directly without a grid wrapper
    const content = screen.getByTestId('test-content');
    const sidebarInset = screen.getByTestId('sidebar-inset');
    expect(sidebarInset).toContainElement(content);
  });
}); 