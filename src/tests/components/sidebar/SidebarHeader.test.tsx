import { fireEvent, render, screen } from '@testing-library/react';

import { SidebarHeader } from '@/components/sidebar/SidebarHeader';

describe('SidebarHeader', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggleCollapse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the title correctly', () => {
      render(<SidebarHeader {...defaultProps} />);
      
      expect(screen.getByText('Dota Scout')).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<SidebarHeader {...defaultProps} />);
      
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('should show collapse icon when expanded', () => {
      render(<SidebarHeader {...defaultProps} isCollapsed={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Collapse sidebar');
    });

    it('should show expand icon when collapsed', () => {
      render(<SidebarHeader {...defaultProps} isCollapsed={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Expand sidebar');
    });
  });

  describe('Interaction', () => {
    it('should call onToggleCollapse when button is clicked', () => {
      const onToggleCollapse = jest.fn();
      render(<SidebarHeader {...defaultProps} onToggleCollapse={onToggleCollapse} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', () => {
      const onToggleCollapse = jest.fn();
      render(<SidebarHeader {...defaultProps} onToggleCollapse={onToggleCollapse} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard events', () => {
      const onToggleCollapse = jest.fn();
      render(<SidebarHeader {...defaultProps} onToggleCollapse={onToggleCollapse} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should have proper styling classes', () => {
      render(<SidebarHeader {...defaultProps} />);
      
      const container = screen.getByText('Dota Scout').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-between', 'p-4', 'border-b', 'border-border');
    });

    it('should have proper button styling', () => {
      render(<SidebarHeader {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'rounded-md', 'transition-colors', 'duration-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SidebarHeader {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should have proper heading structure', () => {
      render(<SidebarHeader {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Dota Scout');
    });
  });
}); 