import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';

import { Sidebar } from '@/components/layout/Sidebar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock context providers
jest.mock('@/contexts/config-context', () => ({
  useConfigContext: () => ({
    config: {
      sidebarCollapsed: false,
      preferredExternalSite: 'dotabuff' as const,
    },
    updateConfig: jest.fn(),
  }),
}));

jest.mock('@/contexts/theme-context', () => ({
  useThemeContext: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock sidebar components
jest.mock('@/components/sidebar/SidebarHeader', () => ({
  SidebarHeader: ({ isCollapsed, onToggleCollapse }: any) => (
    <button onClick={onToggleCollapse} data-testid="sidebar-header">
      {isCollapsed ? 'Collapsed' : 'Expanded'}
    </button>
  ),
}));

jest.mock('@/components/sidebar/SidebarNavigation', () => ({
  SidebarNavigation: ({ currentPage, onNavigate }: any) => (
    <nav data-testid="sidebar-navigation">
      <button 
        onClick={() => onNavigate('team-management')}
        data-testid="nav-team-management"
        aria-pressed={currentPage === 'team-management'}
      >
        Team Management
      </button>
      <button 
        onClick={() => onNavigate('match-history')}
        data-testid="nav-match-history"
        aria-pressed={currentPage === 'match-history'}
      >
        Match History
      </button>
      <button 
        onClick={() => onNavigate('player-stats')}
        data-testid="nav-player-stats"
        aria-pressed={currentPage === 'player-stats'}
      >
        Player Stats
      </button>
      <button 
        onClick={() => onNavigate('draft-suggestions')}
        data-testid="nav-draft-suggestions"
        aria-pressed={currentPage === 'draft-suggestions'}
      >
        Draft Suggestions
      </button>
    </nav>
  ),
}));

jest.mock('@/components/sidebar/QuickLinks', () => ({
  QuickLinks: ({ isCollapsed }: any) => (
    <div data-testid="quick-links">
      {isCollapsed ? 'Collapsed' : 'Expanded'}
    </div>
  ),
}));

jest.mock('@/components/sidebar/ExternalResources', () => ({
  ExternalResources: ({ isCollapsed }: any) => (
    <div data-testid="external-resources">
      {isCollapsed ? 'Collapsed' : 'Expanded'}
    </div>
  ),
}));

jest.mock('@/components/sidebar/SidebarSettings', () => ({
  SidebarSettings: ({ theme, preferredSite, onThemeChange, onPreferredSiteChange }: any) => (
    <div data-testid="sidebar-settings">
      <button onClick={() => onThemeChange('dark')} data-testid="theme-toggle">
        {theme}
      </button>
      <button onClick={() => onPreferredSiteChange('opendota')} data-testid="site-toggle">
        {preferredSite}
      </button>
    </div>
  ),
}));

jest.mock('@/components/sidebar/MobileSidebarToggle', () => ({
  MobileSidebarToggle: ({ isOpen, onToggle }: any) => (
    <button onClick={onToggle} data-testid="mobile-toggle">
      {isOpen ? 'Close' : 'Open'}
    </button>
  ),
}));

describe('Sidebar', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUsePathname.mockReturnValue('/');
  });

  it('renders sidebar with navigation', () => {
    render(<Sidebar />);
    
    expect(screen.getByTestId('sidebar-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('nav-team-management')).toBeInTheDocument();
    expect(screen.getByTestId('nav-match-history')).toBeInTheDocument();
    expect(screen.getByTestId('nav-player-stats')).toBeInTheDocument();
    expect(screen.getByTestId('nav-draft-suggestions')).toBeInTheDocument();
  });

  it('navigates to team management when team management button is clicked', () => {
    render(<Sidebar />);
    
    fireEvent.click(screen.getByTestId('nav-team-management'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/team-management');
  });

  it('navigates to match history when match history button is clicked', () => {
    render(<Sidebar />);
    
    fireEvent.click(screen.getByTestId('nav-match-history'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/match-history');
  });

  it('navigates to player stats when player stats button is clicked', () => {
    render(<Sidebar />);
    
    fireEvent.click(screen.getByTestId('nav-player-stats'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/player-stats');
  });

  it('navigates to draft suggestions when draft suggestions button is clicked', () => {
    render(<Sidebar />);
    
    fireEvent.click(screen.getByTestId('nav-draft-suggestions'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/draft-suggestions');
  });

  it('highlights current page based on pathname', () => {
    mockUsePathname.mockReturnValue('/team-management');
    
    render(<Sidebar />);
    
    expect(screen.getByTestId('nav-team-management')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('nav-match-history')).toHaveAttribute('aria-pressed', 'false');
  });

  it('highlights team management when on root path', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Sidebar />);
    
    expect(screen.getByTestId('nav-team-management')).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles mobile sidebar toggle', () => {
    render(<Sidebar />);
    
    const mobileToggle = screen.getByTestId('mobile-toggle');
    expect(mobileToggle).toHaveTextContent('Open');
    
    fireEvent.click(mobileToggle);
    expect(mobileToggle).toHaveTextContent('Close');
  });

  it('closes mobile sidebar when navigating', () => {
    render(<Sidebar />);
    
    // Open mobile sidebar
    fireEvent.click(screen.getByTestId('mobile-toggle'));
    expect(screen.getByTestId('mobile-toggle')).toHaveTextContent('Close');
    
    // Navigate to a page
    fireEvent.click(screen.getByTestId('nav-team-management'));
    
    // Mobile sidebar should close
    expect(screen.getByTestId('mobile-toggle')).toHaveTextContent('Open');
  });
}); 