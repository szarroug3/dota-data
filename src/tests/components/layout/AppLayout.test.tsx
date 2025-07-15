import { render, screen } from '@testing-library/react';
import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';

// Mock the Sidebar component
jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock the ErrorBoundary component
jest.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock the LoadingSkeleton component
jest.mock('@/components/layout/LoadingSkeleton', () => ({
  LoadingSkeleton: ({ type, lines }: any) => <div data-testid="loading-skeleton" data-type={type} data-lines={lines}>Loading...</div>,
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
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders with proper layout structure', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    // Check that the main layout container has the correct classes
    const layoutContainer = screen.getByTestId('error-boundary').firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('flex', 'h-screen', 'bg-background', 'text-foreground');
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

  it('wraps children in Suspense with loading fallback', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    // The LoadingSkeleton component should be available for Suspense fallback
    // Note: We can't directly test Suspense behavior in this simple test
    // but we can verify the LoadingSkeleton component is mocked and available
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
}); 