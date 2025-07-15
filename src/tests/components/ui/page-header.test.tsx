import { render, screen } from '@testing-library/react';

import { PageHeader } from '@/components/ui/page-header';

describe('PageHeader', () => {
  it('should render title correctly', () => {
    render(<PageHeader title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<PageHeader title="Test Title" description="Test Description" />);
    
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    render(<PageHeader title="Test Title" />);
    
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('should have proper heading structure', () => {
    render(<PageHeader title="Test Title" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Test Title');
  });

  it('should have proper styling for title', () => {
    render(<PageHeader title="Test Title" />);
    
    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-3xl', 'font-bold', 'tracking-tight');
  });

  it('should have proper styling for description', () => {
    render(<PageHeader title="Test Title" description="Test Description" />);
    
    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('should have proper container structure', () => {
    render(<PageHeader title="Test Title" />);
    
    const container = screen.getByText('Test Title').closest('.col-span-full');
    expect(container).toBeInTheDocument();
  });

  it('should have proper flex layout', () => {
    render(<PageHeader title="Test Title" />);
    
    const flexContainer = screen.getByText('Test Title').closest('.flex');
    expect(flexContainer).toHaveClass('items-start', 'justify-between');
  });

  it('should have proper spacing for content', () => {
    render(<PageHeader title="Test Title" />);
    
    const contentContainer = screen.getByText('Test Title').closest('.space-y-1');
    expect(contentContainer).toBeInTheDocument();
  });

  it('should render separator', () => {
    render(<PageHeader title="Test Title" />);
    
    const separator = screen.getByText('Test Title').closest('.col-span-full')?.querySelector('hr');
    expect(separator).toBeInTheDocument();
  });

  it('should have proper separator styling', () => {
    render(<PageHeader title="Test Title" />);
    
    const separator = screen.getByText('Test Title').closest('.col-span-full')?.querySelector('hr');
    expect(separator).toHaveClass('mt-2');
  });
}); 