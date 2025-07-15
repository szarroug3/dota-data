import { fireEvent, render, screen } from '@testing-library/react';

import { SidebarToggle } from '@/components/layout/SidebarToggle';

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
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show expand icon when collapsed', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Expand sidebar');
      expect(button).toHaveAttribute('aria-label', 'Expand sidebar');
    });

    it('should show collapse icon when expanded', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Collapse sidebar');
      expect(button).toHaveAttribute('aria-label', 'Collapse sidebar');
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

    it('should be keyboard accessible', () => {
      const onToggle = jest.fn();
      render(<SidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard events', () => {
      const onToggle = jest.fn();
      render(<SidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon rotation', () => {
    it('should rotate icon when collapsed', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveClass('rotate-180');
    });

    it('should not rotate icon when expanded', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).not.toHaveClass('rotate-180');
    });

    it('should have proper transition classes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveClass('transform', 'transition-transform', 'duration-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });

    it('should be focusable', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have proper focus styling', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
    });
  });

  describe('Styling', () => {
    it('should have proper button styling', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full', 'flex', 'items-center', 'justify-center', 'p-2');
    });

    it('should have proper text color classes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-muted-foreground', 'hover:text-foreground');
    });

    it('should have proper transition classes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('should have proper border radius', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('SVG icon', () => {
    it('should render SVG icon', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have proper SVG attributes', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper path element', () => {
      render(<SidebarToggle {...defaultProps} />);
      
      const path = screen.getByRole('button').querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });

  describe('Icon direction', () => {
    it('should show left-pointing arrow when expanded', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={false} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
      // The path should contain the left arrow path data
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M15 19l-7-7 7-7');
    });

    it('should show right-pointing arrow when collapsed', () => {
      render(<SidebarToggle {...defaultProps} isCollapsed={true} />);
      
      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
      // The path should contain the left arrow path data (rotated by CSS)
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M15 19l-7-7 7-7');
    });
  });
}); 