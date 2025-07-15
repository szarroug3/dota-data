import { fireEvent, render, screen } from '@testing-library/react';
import { Home } from 'lucide-react';

import { SidebarButton } from '@/components/sidebar/SidebarButton';

describe('SidebarButton', () => {
  const defaultProps = {
    icon: <Home className="w-5 h-5" />,
    label: 'Home',
    isCollapsed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with icon and label', () => {
      render(<SidebarButton {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should render only icon when collapsed', () => {
      render(<SidebarButton {...defaultProps} isCollapsed={true} />);
      
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('should render both icon and label when expanded', () => {
      render(<SidebarButton {...defaultProps} isCollapsed={false} />);
      
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      render(<SidebarButton {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when not provided', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should not throw error
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Home');
      expect(button).toHaveAttribute('title', 'Home');
    });
  });

  describe('Active state', () => {
    it('should show active styling when isActive is true', () => {
      render(<SidebarButton {...defaultProps} isActive={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary/10', 'text-primary');
      expect(button).toHaveAttribute('aria-current', 'page');
    });

    it('should show inactive styling when isActive is false', () => {
      render(<SidebarButton {...defaultProps} isActive={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-muted-foreground', 'hover:text-foreground');
      expect(button).not.toHaveAttribute('aria-current');
    });

    it('should show inactive styling when isActive is undefined', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-muted-foreground', 'hover:text-foreground');
      expect(button).not.toHaveAttribute('aria-current');
    });
  });

  describe('Custom props', () => {
    it('should accept custom ariaLabel', () => {
      render(<SidebarButton {...defaultProps} ariaLabel="Custom label" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('title', 'Home');
    });

    it('should accept custom iconColor', () => {
      render(<SidebarButton {...defaultProps} iconColor="text-red-500" isActive={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should use default iconColor when not provided', () => {
      render(<SidebarButton {...defaultProps} isActive={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper button styling classes', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full', 'h-12', 'flex', 'items-center', 'text-sm', 'font-medium');
    });

    it('should have proper transition classes', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-200');
    });

    it('should have proper focus styling', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be focusable', () => {
      render(<SidebarButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard events', () => {
      const onClick = jest.fn();
      render(<SidebarButton {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
}); 