import { fireEvent, render, screen } from '@testing-library/react';

import { MobileSidebarToggle } from '@/components/sidebar/MobileSidebarToggle';

describe('MobileSidebarToggle', () => {
  const defaultProps = {
    isOpen: false,
    onToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toggle button', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show hamburger icon when closed', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Open menu');
      expect(button).toHaveAttribute('aria-label', 'Open menu');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show close icon when open', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Close menu');
      expect(button).toHaveAttribute('aria-label', 'Close menu');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Interaction', () => {
    it('should call onToggle when clicked', () => {
      const onToggle = jest.fn();
      render(<MobileSidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', () => {
      const onToggle = jest.fn();
      render(<MobileSidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard events', () => {
      const onToggle = jest.fn();
      render(<MobileSidebarToggle {...defaultProps} onToggle={onToggle} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Animation states', () => {
    it('should have proper classes for closed state', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'bg-card', 'dark:bg-card', 'border', 'border-border');
    });

    it('should have proper classes for open state', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'bg-card', 'dark:bg-card', 'border', 'border-border');
    });

    it('should have proper transition classes', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should have correct aria-expanded value', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have correct aria-expanded value when open', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should be focusable', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Styling', () => {
    it('should have proper button styling', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'bg-card', 'dark:bg-card', 'border', 'border-border', 'rounded-lg', 'shadow-lg');
    });

    it('should have proper text color classes', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-muted-foreground', 'hover:text-foreground', 'dark:text-muted-foreground', 'dark:hover:text-foreground');
    });

    it('should have proper focus styling', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Hamburger icon', () => {
    it('should render three lines for hamburger icon', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      const spans = button.querySelectorAll('span');
      expect(spans).toHaveLength(3);
    });

    it('should transform lines when open', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      const spans = button.querySelectorAll('span');
      expect(spans).toHaveLength(3);
    });

    it('should have proper transition classes for lines', () => {
      render(<MobileSidebarToggle {...defaultProps} />);
      
      const button = screen.getByRole('button');
      const spans = button.querySelectorAll('span');
      spans.forEach(span => {
        expect(span).toHaveClass('block', 'w-5', 'h-0.5', 'bg-current', 'transform', 'transition-all', 'duration-200');
      });
    });
  });

  describe('Icon animation', () => {
    it('should have correct transform classes when closed', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={false} />);
      
      const button = screen.getByRole('button');
      const spans = button.querySelectorAll('span');
      
      // First line should not be rotated
      expect(spans[0]).not.toHaveClass('rotate-45', 'translate-y-1.5');
      // Second line should not be transparent
      expect(spans[1]).not.toHaveClass('opacity-0');
      // Third line should not be rotated
      expect(spans[2]).not.toHaveClass('-rotate-45', '-translate-y-1.5');
    });

    it('should have correct transform classes when open', () => {
      render(<MobileSidebarToggle {...defaultProps} isOpen={true} />);
      
      const button = screen.getByRole('button');
      const spans = button.querySelectorAll('span');
      
      // First line should be rotated
      expect(spans[0]).toHaveClass('rotate-45', 'translate-y-1.5');
      // Second line should be transparent
      expect(spans[1]).toHaveClass('opacity-0');
      // Third line should be rotated
      expect(spans[2]).toHaveClass('-rotate-45', '-translate-y-1.5');
    });
  });
}); 