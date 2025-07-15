import { fireEvent, render, screen } from '@testing-library/react';

import { SidebarToggle } from '@/components/sidebar/SidebarToggle';

describe('SidebarToggle', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toggle button', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show collapse icon when expanded', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Collapse sidebar');
      expect(button).toHaveAttribute('title', 'Collapse sidebar');
    });

    it('should show expand icon when collapsed', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Expand sidebar');
      expect(button).toHaveAttribute('title', 'Expand sidebar');
    });

    it('should have proper SVG icon', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply rotation class when collapsed', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveClass('rotate-180');
    });

    it('should not apply rotation class when expanded', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).not.toHaveClass('rotate-180');
    });
  });

  describe('Interaction', () => {
    it('should call onToggle when clicked', () => {
      const onToggle = jest.fn();
      render(<SidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when Enter key is pressed', () => {
      const onToggle = jest.fn();
      render(<SidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle when Space key is pressed', () => {
      const onToggle = jest.fn();
      render(<SidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call onToggle for other keys', () => {
      const onToggle = jest.fn();
      render(<SidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Tab' });
      
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });

    it('should be keyboard accessible', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have proper focus styles', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Styling', () => {
    it('should have proper base classes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'w-full',
        'flex',
        'items-center',
        'justify-center',
        'p-2',
        'text-muted-foreground',
        'hover:text-foreground',
        'transition-colors',
        'rounded-lg'
      );
    });

    it('should have proper dark mode classes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('dark:text-muted-foreground', 'dark:hover:text-foreground');
    });

    it('should have proper SVG classes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5', 'transform', 'transition-transform', 'duration-200');
    });
  });

  describe('State Changes', () => {
    it('should update aria-label when collapsed state changes', () => {
      const { rerender } = render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Collapse sidebar');
      
      rerender(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('should update title when collapsed state changes', () => {
      const { rerender } = render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Collapse sidebar');
      
      rerender(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Expand sidebar');
    });

    it('should update SVG rotation when collapsed state changes', () => {
      const { rerender } = render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      let svg = screen.getByRole('button').querySelector('svg');
      expect(svg).not.toHaveClass('rotate-180');
      
      rerender(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveClass('rotate-180');
    });
  });
}); 