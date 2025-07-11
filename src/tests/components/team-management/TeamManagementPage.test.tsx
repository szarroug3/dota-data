import { render, screen } from '@testing-library/react';
import React from 'react';

import { TeamManagementPage } from '@/components/team-management/TeamManagementPage';

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

// Mock the team management components
jest.mock('@/components/team-management/AddTeamForm', () => ({
  AddTeamForm: () => <div data-testid="add-team-form">Add Team Form</div>
}));

jest.mock('@/components/team-management/TeamList', () => ({
  TeamList: () => <div data-testid="team-list">Team List</div>
}));

describe('TeamManagementPage', () => {
  it('should render the main team management layout', () => {
    render(<TeamManagementPage />);
    
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('add-team-form')).toBeInTheDocument();
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });

  it('should render the header with correct title and subtitle', () => {
    render(<TeamManagementPage />);
    
    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(screen.getByText('Add, manage, and switch between teams')).toBeInTheDocument();
  });

  it('should render the main content area with proper styling', () => {
    render(<TeamManagementPage />);
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'overflow-y-auto', 'p-6');
  });

  it('should render the layout with proper flex structure', () => {
    render(<TeamManagementPage />);
    
    const mainContainer = document.querySelector('.flex.h-screen');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('flex', 'h-screen', 'bg-gray-50', 'dark:bg-gray-900');
  });

  it('should render the content wrapper with proper flex structure', () => {
    render(<TeamManagementPage />);
    
    const contentWrapper = screen.getByTestId('sidebar').nextElementSibling;
    expect(contentWrapper).toHaveClass('flex-1', 'flex', 'flex-col', 'overflow-hidden');
  });

  it('should render the content container with proper max width', () => {
    render(<TeamManagementPage />);
    
    const contentContainer = screen.getByTestId('add-team-form').closest('.max-w-4xl');
    expect(contentContainer).toBeInTheDocument();
  });

  it('should render the add team form in the correct position', () => {
    render(<TeamManagementPage />);
    
    const addTeamForm = screen.getByTestId('add-team-form');
    const formContainer = addTeamForm.closest('.mb-8');
    expect(formContainer).toBeInTheDocument();
  });

  it('should render the team list with Suspense wrapper', () => {
    render(<TeamManagementPage />);
    
    const teamList = screen.getByTestId('team-list');
    expect(teamList).toBeInTheDocument();
  });
}); 