import { render, screen } from '@testing-library/react';

import { Header } from '@/frontend/shared/layout/Header';

// Basic rendering
describe('Header - Basic rendering', () => {
  it('should render with title', () => {
    render(<Header title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
  it('should render with subtitle', () => {
    render(<Header title="Test Page" subtitle="Page description" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Page description')).toBeInTheDocument();
  });
  it('should render without subtitle when not provided', () => {
    render(<Header title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.queryByText('Page description')).not.toBeInTheDocument();
  });
});

// Breadcrumbs
describe('Header - Breadcrumbs', () => {
  it('should render breadcrumbs when provided', () => {
    const breadcrumbs = ['Home', 'Dashboard', 'Settings'];
    render(<Header title="Test Page" breadcrumbs={breadcrumbs} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
  it('should not render breadcrumbs when not provided', () => {
    render(<Header title="Test Page" />);
    const breadcrumbNav = screen.queryByRole('navigation');
    expect(breadcrumbNav).not.toBeInTheDocument();
  });
  it('should render breadcrumb separators', () => {
    const breadcrumbs = ['Home', 'Dashboard', 'Settings'];
    render(<Header title="Test Page" breadcrumbs={breadcrumbs} />);
    const separators = document.querySelectorAll('svg');
    expect(separators.length).toBeGreaterThan(0);
  });
});

// Actions
describe('Header - Actions', () => {
  it('should render actions when provided', () => {
    const actions = (
      <>
        <button>Action 1</button>
        <button>Action 2</button>
      </>
    );
    render(<Header title="Test Page" actions={actions} />);
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });
  it('should not render actions section when not provided', () => {
    render(<Header title="Test Page" />);
    const actionsContainer = document.querySelector('[class*="space-x-3"]');
    expect(actionsContainer).not.toBeInTheDocument();
  });
});

// Accessibility
describe('Header - Accessibility', () => {
  it('should have proper heading structure', () => {
    render(<Header title="Test Page" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Test Page');
  });
  it('should have proper navigation for breadcrumbs', () => {
    const breadcrumbs = ['Home', 'Dashboard'];
    render(<Header title="Test Page" breadcrumbs={breadcrumbs} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
  it('should have proper button roles for actions', () => {
    const actions = <button>Test Action</button>;
    render(<Header title="Test Page" actions={actions} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Test Action');
  });
});

// Styling and layout
describe('Header - Styling and layout', () => {
  it('should have proper header styling', () => {
    render(<Header title="Test Page" />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-background', 'text-foreground', 'border-b', 'border-border');
  });
  it('should have proper title styling', () => {
    render(<Header title="Test Page" />);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-foreground', 'dark:text-foreground');
  });
  it('should have proper subtitle styling', () => {
    render(<Header title="Test Page" subtitle="Page description" />);
    const subtitle = screen.getByText('Page description');
    expect(subtitle).toHaveClass('text-sm', 'text-muted-foreground', 'dark:text-muted-foreground');
  });
});

// Dark mode support
describe('Header - Dark mode support', () => {
  it('should have dark mode classes', () => {
    render(<Header title="Test Page" />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('dark:border-border');
  });
  it('should have dark mode text classes', () => {
    render(<Header title="Test Page" subtitle="Description" />);
    const title = screen.getByRole('heading', { level: 1 });
    const subtitle = screen.getByText('Description');
    expect(title).toHaveClass('dark:text-foreground');
    expect(subtitle).toHaveClass('dark:text-muted-foreground');
  });
});

// Responsive design
describe('Header - Responsive design', () => {
  it('should have proper flex layout', () => {
    render(<Header title="Test Page" />);
    const container = document.querySelector('.flex.items-center.justify-between');
    expect(container).toBeInTheDocument();
  });
  it('should have proper spacing for actions', () => {
    const actions = (
      <>
        <button>Action 1</button>
        <button>Action 2</button>
      </>
    );
    render(<Header title="Test Page" actions={actions} />);
    const actionsContainer = document.querySelector('.flex.items-center.space-x-3');
    expect(actionsContainer).toBeInTheDocument();
  });
}); 