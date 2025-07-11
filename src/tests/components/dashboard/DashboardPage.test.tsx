import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardPage } from '@/components/dashboard/DashboardPage';

// Mock the layout components
jest.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}));

jest.mock('@/components/layout/Header', () => ({
  Header: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}));

jest.mock('@/components/layout/LoadingSkeleton', () => ({
  LoadingSkeleton: ({ type, lines }: { type: string; lines: number }) => (
    <div data-testid="loading-skeleton" data-type={type} data-lines={lines}>
      Loading...
    </div>
  )
}));

jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>
}));

// Mock the dashboard content components
jest.mock('@/components/dashboard/DashboardContent', () => ({
  DashboardContent: () => <div data-testid="dashboard-content">Dashboard Content</div>
}));

jest.mock('@/components/dashboard/WelcomeSection', () => ({
  WelcomeSection: () => <div data-testid="welcome-section">Welcome Section</div>
}));

describe('DashboardPage', () => {
  it('should render the main dashboard layout', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
  });

  it('should render the header with correct title and subtitle', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Team performance overview and quick actions')).toBeInTheDocument();
  });

  it('should render the main content area with proper styling', () => {
    render(<DashboardPage />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'overflow-y-auto', 'p-6');
  });

  it('should render the layout with proper flex structure', () => {
    render(<DashboardPage />);
    
    // Check that the main container has the flex classes
    const mainContainer = document.querySelector('.flex.h-screen');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('flex', 'h-screen', 'bg-gray-50', 'dark:bg-gray-900');
  });

  it('should render the content wrapper with proper flex structure', () => {
    render(<DashboardPage />);
    
    const contentWrapper = screen.getByTestId('sidebar').nextElementSibling;
    expect(contentWrapper).toHaveClass('flex-1', 'flex', 'flex-col', 'overflow-hidden');
  });
}); 