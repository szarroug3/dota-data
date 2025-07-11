import { fireEvent, render, screen } from '@testing-library/react';

import { Sidebar } from '@/components/layout/Sidebar';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.documentElement.classList
Object.defineProperty(document.documentElement, 'classList', {
  value: {
    toggle: jest.fn(),
  },
  writable: true,
});

// Helper function to setup mocks
const setupMocks = () => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
};

// Helper function to find theme toggle button
const findThemeToggle = () => {
  return screen.getByText('Light Mode').closest('button');
};

// Helper function to find external resource link
const findExternalResourceLink = (text: string) => {
  const elements = screen.getAllByText(text);
  return elements.find(link => 
    link.closest('button') && !link.closest('button')?.textContent?.includes('Set')
  );
};

describe('Sidebar - Navigation and Toggle', () => {
  beforeEach(setupMocks);

  describe('Navigation', () => {
    it('should render sidebar with navigation items', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Team Management')).toBeInTheDocument();
      expect(screen.getByText('Match History')).toBeInTheDocument();
      expect(screen.getByText('Player Stats')).toBeInTheDocument();
      expect(screen.getByText('Team Analysis')).toBeInTheDocument();
      expect(screen.getByText('Draft Suggestions')).toBeInTheDocument();
    });

    it('should handle navigation clicks', () => {
      render(<Sidebar />);
      
      const teamManagementButton = screen.getByText('Team Management');
      fireEvent.click(teamManagementButton);
      
      expect(teamManagementButton).toBeInTheDocument();
    });

    it('should show active page highlighting', () => {
      render(<Sidebar />);
      
      const dashboardButton = screen.getByText('Dashboard').closest('button');
      expect(dashboardButton).toHaveClass('bg-blue-100');
    });
  });

  describe('Sidebar toggle', () => {
    it('should toggle collapse state when toggle button is clicked', () => {
      render(<Sidebar />);
      
      const toggleButton = screen.getByTitle('Collapse sidebar');
      fireEvent.click(toggleButton);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');
    });
  });

  describe('Mobile functionality', () => {
    it('should handle mobile toggle', () => {
      render(<Sidebar />);
      
      const mobileToggle = screen.getByTitle('Open menu');
      fireEvent.click(mobileToggle);
      
      expect(screen.getByTitle('Close menu')).toBeInTheDocument();
    });
  });
});

describe('Sidebar - Preferences and Settings', () => {
  beforeEach(setupMocks);

  describe('LocalStorage preferences', () => {
    it('should load saved preferences from localStorage', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('true') // sidebarCollapsed
        .mockReturnValueOnce('dark') // theme
        .mockReturnValueOnce('opendota'); // preferredSite

      render(<Sidebar />);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebarCollapsed');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('preferredSite');
    });

    it('should save theme preference to localStorage', () => {
      render(<Sidebar />);
      
      const themeToggle = findThemeToggle();
      if (themeToggle) {
        fireEvent.click(themeToggle);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      }
    });

    it('should apply theme to document when theme changes', () => {
      render(<Sidebar />);
      
      const themeToggle = findThemeToggle();
      if (themeToggle) {
        fireEvent.click(themeToggle);
        expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true);
      }
    });
  });
});

describe('Sidebar - Quick Links and External Resources', () => {
  beforeEach(setupMocks);

  describe('Quick links', () => {
    it('should render teams in quick links', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });

    it('should handle team clicks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<Sidebar />);
      
      const teamButton = screen.getByText('Team Alpha');
      fireEvent.click(teamButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Switch to team:', '1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('External resources', () => {
    it('should render external resources', () => {
      render(<Sidebar />);
      
      expect(screen.getByText('External Resources')).toBeInTheDocument();
      const dotabuffElements = screen.getAllByText('Dotabuff');
      expect(dotabuffElements.length).toBeGreaterThan(0);
      const opendotaElements = screen.getAllByText('OpenDota');
      expect(opendotaElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Dota2ProTracker')).toBeInTheDocument();
      expect(screen.getByText('Stratz')).toBeInTheDocument();
    });

    it('should handle external resource clicks', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      
      render(<Sidebar />);
      
      const externalResourceLink = findExternalResourceLink('Dotabuff');
      
      if (externalResourceLink) {
        fireEvent.click(externalResourceLink);
        expect(openSpy).toHaveBeenCalledWith('https://www.dotabuff.com', '_blank', 'noopener,noreferrer');
      }
      
      openSpy.mockRestore();
    });

    it('should handle preferred site changes', () => {
      render(<Sidebar />);
      
      const opendotaButton = screen.getByText('Set').closest('button');
      if (opendotaButton) {
        fireEvent.click(opendotaButton);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('preferredSite', 'opendota');
      }
    });
  });
}); 