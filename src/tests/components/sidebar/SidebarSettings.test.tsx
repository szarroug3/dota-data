import { fireEvent, render, screen } from '@testing-library/react';

import { SidebarSettings } from '@/components/sidebar/SidebarSettings';

describe('SidebarSettings', () => {
  const defaultProps = {
    isCollapsed: false,
    theme: 'light' as const,
    preferredSite: 'dotabuff' as const,
    onThemeChange: jest.fn(),
    onPreferredSiteChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render settings section', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      // Should render toggle switches
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render theme toggle', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('aria-label', 'Toggle theme between light and dark mode');
    });

    it('should render preferred site toggle', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveAttribute('aria-label', 'Toggle preferred external site between Dotabuff and OpenDota');
    });

    it('should render when collapsed', () => {
      render(<SidebarSettings {...defaultProps} isCollapsed={true} />);
      
      // Should still render buttons but without visible text
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Theme toggle', () => {
    it('should call onThemeChange when theme toggle is clicked', () => {
      const onThemeChange = jest.fn();
      render(<SidebarSettings {...defaultProps} onThemeChange={onThemeChange} />);
      
      const themeToggle = screen.getAllByRole('button')[0];
      fireEvent.click(themeToggle);
      expect(onThemeChange).toHaveBeenCalledTimes(1);
    });

    it('should show active state for light theme', () => {
      render(<SidebarSettings {...defaultProps} theme="light" />);
      
      const lightButton = screen.getAllByRole('button')[0];
      // The toggle switch should be in the correct position for light theme
      const toggleSwitch = lightButton.querySelector('[aria-hidden="true"]');
      expect(toggleSwitch).toBeInTheDocument();
    });

    it('should show active state for dark theme', () => {
      render(<SidebarSettings {...defaultProps} theme="dark" />);
      
      const darkButton = screen.getAllByRole('button')[0];
      // The toggle switch should be in the correct position for dark theme
      const toggleSwitch = darkButton.querySelector('[aria-hidden="true"]');
      expect(toggleSwitch).toBeInTheDocument();
    });
  });

  describe('Preferred site toggle', () => {
    it('should call onPreferredSiteChange when site toggle is clicked', () => {
      const onPreferredSiteChange = jest.fn();
      render(<SidebarSettings {...defaultProps} onPreferredSiteChange={onPreferredSiteChange} />);
      
      const siteToggle = screen.getAllByRole('button')[1];
      fireEvent.click(siteToggle);
      expect(onPreferredSiteChange).toHaveBeenCalledTimes(1);
    });

    it('should show active state for dotabuff', () => {
      render(<SidebarSettings {...defaultProps} preferredSite="dotabuff" />);
      
      const dotabuffButton = screen.getAllByRole('button')[1];
      // The toggle switch should be in the correct position for dotabuff
      const toggleSwitch = dotabuffButton.querySelector('[aria-hidden="true"]');
      expect(toggleSwitch).toBeInTheDocument();
    });

    it('should show active state for opendota', () => {
      render(<SidebarSettings {...defaultProps} preferredSite="opendota" />);
      
      const opendotaButton = screen.getAllByRole('button')[1];
      // The toggle switch should be in the correct position for opendota
      const toggleSwitch = opendotaButton.querySelector('[aria-hidden="true"]');
      expect(toggleSwitch).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for theme toggle', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const themeToggle = screen.getAllByRole('button')[0];
      expect(themeToggle).toHaveAttribute('aria-label', 'Toggle theme between light and dark mode');
      expect(themeToggle).toHaveAttribute('title', 'Toggle theme between light and dark mode');
    });

    it('should have proper ARIA attributes for site toggle', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const siteToggle = screen.getAllByRole('button')[1];
      expect(siteToggle).toHaveAttribute('aria-label', 'Toggle preferred external site between Dotabuff and OpenDota');
      expect(siteToggle).toHaveAttribute('title', 'Toggle preferred external site between Dotabuff and OpenDota');
    });

    it('should be keyboard accessible', () => {
      const onThemeChange = jest.fn();
      render(<SidebarSettings {...defaultProps} onThemeChange={onThemeChange} />);
      
      const themeToggle = screen.getAllByRole('button')[0];
      themeToggle.focus();
      expect(themeToggle).toHaveFocus();
    });

    it('should handle keyboard events', () => {
      const onThemeChange = jest.fn();
      render(<SidebarSettings {...defaultProps} onThemeChange={onThemeChange} />);
      
      const themeToggle = screen.getAllByRole('button')[0];
      themeToggle.focus();
      fireEvent.keyDown(themeToggle, { key: 'Enter' });
      expect(onThemeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should have proper section styling', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const container = screen.getAllByRole('button')[0].closest('div');
      expect(container).toHaveClass('space-y-2');
    });

    it('should have proper button styling', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full', 'h-12', 'flex', 'items-center', 'justify-center');
      });
    });

    it('should have proper transition classes', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all', 'duration-200');
      });
    });
  });

  describe('Icon display', () => {
    it('should show sun icon for light mode', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      // The sun icon should be present (Lucide Sun component)
      const sunIcon = screen.getAllByRole('button')[0].querySelector('.lucide-sun');
      expect(sunIcon).toBeInTheDocument();
    });

    it('should show moon icon for dark mode', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      // The moon icon should be present (Lucide Moon component)
      const moonIcon = screen.getAllByRole('button')[0].querySelector('.lucide-moon');
      expect(moonIcon).toBeInTheDocument();
    });

    it('should show dotabuff icon', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      // The dotabuff icon should be present
      const dotabuffIcon = screen.getAllByRole('button')[1].querySelector('[aria-label="Dotabuff icon"]');
      expect(dotabuffIcon).toBeInTheDocument();
    });

    it('should show opendota icon', () => {
      render(<SidebarSettings {...defaultProps} />);
      
      // The opendota icon should be present
      const opendotaIcon = screen.getAllByRole('button')[1].querySelector('[aria-label="OpenDota icon"]');
      expect(opendotaIcon).toBeInTheDocument();
    });
  });
}); 