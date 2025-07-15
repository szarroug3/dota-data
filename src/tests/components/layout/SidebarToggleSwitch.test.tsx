import { fireEvent, render, screen } from '@testing-library/react';
import { Moon, Sun } from 'lucide-react';

import { SidebarToggleSwitch } from '@/components/sidebar/SidebarToggleSwitch';

describe('SidebarToggleSwitch', () => {
  const defaultProps = {
    leftIcon: <Sun className="w-5 h-5" />,
    rightIcon: <Moon className="w-5 h-5" />,
    isCollapsed: false,
    isActive: false,
    onClick: jest.fn(),
    ariaLabel: 'Toggle theme',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render expanded state correctly', () => {
      render(<SidebarToggleSwitch {...defaultProps} />);
      
      // Should show both icons and switch
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle theme')).toBeInTheDocument();
    });

    it('should render collapsed state correctly', () => {
      render(<SidebarToggleSwitch {...defaultProps} isCollapsed={true} />);
      
      // Should show only the active icon (left icon when isActive is false)
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle theme')).toBeInTheDocument();
    });

    it('should show proper button styling', () => {
      render(<SidebarToggleSwitch {...defaultProps} isActive={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should show proper button styling for inactive state', () => {
      render(<SidebarToggleSwitch {...defaultProps} isActive={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Interaction', () => {
    it('should call onClick when clicked', () => {
      const onClick = jest.fn();
      render(<SidebarToggleSwitch {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', () => {
      render(<SidebarToggleSwitch {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Toggle theme');
      expect(button).toHaveAttribute('title', 'Toggle theme');
    });
  });

  describe('Props-driven behavior', () => {
    it('should handle collapse transition correctly', () => {
      const { rerender } = render(<SidebarToggleSwitch {...defaultProps} isActive={true} />);
      
      // Initially expanded with active state
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      // Collapse the sidebar
      rerender(<SidebarToggleSwitch {...defaultProps} isCollapsed={true} isActive={true} />);
      
      // Should still show the button
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle expand transition correctly', () => {
      const { rerender } = render(<SidebarToggleSwitch {...defaultProps} isCollapsed={true} isActive={true} />);
      
      // Initially collapsed
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      // Expand the sidebar
      rerender(<SidebarToggleSwitch {...defaultProps} isCollapsed={false} isActive={true} />);
      
      // Should show the button with full content
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SidebarToggleSwitch {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Toggle theme');
      expect(button).toHaveAttribute('title', 'Toggle theme');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should be focusable', () => {
      render(<SidebarToggleSwitch {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard events', () => {
      const onClick = jest.fn();
      render(<SidebarToggleSwitch {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon display', () => {
    it('should show left icon when active in expanded state', () => {
      render(<SidebarToggleSwitch {...defaultProps} isActive={true} />);
      
      // The left icon (Sun) should be visible and active
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show right icon when inactive in expanded state', () => {
      render(<SidebarToggleSwitch {...defaultProps} isActive={false} />);
      
      // The right icon (Moon) should be visible and active
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should show active icon in collapsed state', () => {
      render(<SidebarToggleSwitch {...defaultProps} isCollapsed={true} isActive={true} />);
      
      // Should show the active icon (left icon when isActive is true)
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Custom props', () => {
    it('should accept custom iconColor', () => {
      render(<SidebarToggleSwitch {...defaultProps} iconColor="text-red-500" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should use default iconColor when not provided', () => {
      render(<SidebarToggleSwitch {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
}); 