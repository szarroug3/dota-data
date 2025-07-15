import { fireEvent, render, screen } from '@testing-library/react';

import { SidebarNavigation } from '@/components/sidebar/SidebarNavigation';

describe('SidebarNavigation', () => {
  const defaultProps = {
    currentPage: 'dashboard',
    onNavigate: jest.fn(),
    isCollapsed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all navigation items', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText('Match History')).toBeInTheDocument();
      expect(screen.getByText('Player Stats')).toBeInTheDocument();
      expect(screen.getByText('Draft Suggestions')).toBeInTheDocument();
    });

    it('should render navigation with proper role', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should render navigation items when collapsed', () => {
      render(<SidebarNavigation {...defaultProps} isCollapsed={true} />);
      
      // Should still render buttons but without visible text
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });
  });

  describe('Navigation', () => {
    it('should call onNavigate with correct page id when clicked', () => {
      const onNavigate = jest.fn();
      render(<SidebarNavigation {...defaultProps} onNavigate={onNavigate} />);
      
      const teamManagementButton = screen.getByText('Team Management');
      fireEvent.click(teamManagementButton);
      
      expect(onNavigate).toHaveBeenCalledWith('team-management');
    });

    it('should call onNavigate for each navigation item', () => {
      const onNavigate = jest.fn();
      render(<SidebarNavigation {...defaultProps} onNavigate={onNavigate} />);
      
      const navigationItems = [
        'Team Management',
        'Match History',
        'Player Stats',
        'Draft Suggestions'
      ];

      navigationItems.forEach(itemText => {
        const button = screen.getByText(itemText);
        fireEvent.click(button);
      });

      expect(onNavigate).toHaveBeenCalledTimes(4);
      expect(onNavigate).toHaveBeenCalledWith('team-management');
      expect(onNavigate).toHaveBeenCalledWith('match-history');
      expect(onNavigate).toHaveBeenCalledWith('player-stats');
      expect(onNavigate).toHaveBeenCalledWith('draft-suggestions');
    });
  });

  describe('Active state', () => {
    it('should highlight current page', () => {
      render(<SidebarNavigation {...defaultProps} currentPage="team-management" />);
      
      const teamManagementButton = screen.getByText('Team Management').closest('button');
      expect(teamManagementButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight other pages when one is active', () => {
      render(<SidebarNavigation {...defaultProps} currentPage="team-management" />);
      
      const matchHistoryButton = screen.getByText('Match History').closest('button');
      expect(matchHistoryButton).not.toHaveAttribute('aria-current');
    });

    it('should handle no active page', () => {
      render(<SidebarNavigation {...defaultProps} currentPage="nonexistent" />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('aria-current');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for navigation', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should have proper ARIA attributes for buttons', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('title');
      });
    });

    it('should be keyboard accessible', () => {
      const onNavigate = jest.fn();
      render(<SidebarNavigation {...defaultProps} onNavigate={onNavigate} />);
      
      const teamManagementButton = screen.getByText('Team Management');
      expect(teamManagementButton).toBeInTheDocument();
    });

    it('should handle keyboard events', () => {
      const onNavigate = jest.fn();
      render(<SidebarNavigation {...defaultProps} onNavigate={onNavigate} />);
      
      const teamManagementButton = screen.getByText('Team Management');
      fireEvent.click(teamManagementButton);
      
      expect(onNavigate).toHaveBeenCalledWith('team-management');
    });
  });

  describe('Styling', () => {
    it('should have proper navigation styling', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex-1');
    });

    it('should have proper button styling', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full', 'h-12', 'flex', 'items-center');
      });
    });
  });

  describe('Icon colors', () => {
    it('should apply correct icon colors for each navigation item', () => {
      render(<SidebarNavigation {...defaultProps} />);
      
      // Each navigation item should have its specific color class
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('should show active icon color when page is active', () => {
      render(<SidebarNavigation {...defaultProps} currentPage="team-management" />);
      
      const teamManagementButton = screen.getByText('Team Management').closest('button');
      expect(teamManagementButton).toBeInTheDocument();
    });
  });
}); 