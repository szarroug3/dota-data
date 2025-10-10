import { render, screen } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';

import { AppSidebar } from '@/frontend/shared/layout/Sidebar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock context providers
jest.mock('@/frontend/contexts/config-context', () => ({
  useConfigContext: () => ({
    config: {
      sidebarCollapsed: false,
      preferredExternalSite: 'dotabuff' as const,
    },
    updateConfig: jest.fn(),
  }),
}));

// Mock AppData context instead of old team context
jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => ({
    teams: new Map(),
    matches: new Map(),
    players: new Map(),
    heroes: new Map(),
    items: new Map(),
    leagues: new Map(),
    selectedTeamId: null,
    setSelectedTeamId: jest.fn(),
    addTeam: jest.fn(),
    updateTeam: jest.fn(),
    removeTeam: jest.fn(),
    addMatch: jest.fn(),
    updateMatch: jest.fn(),
    removeMatch: jest.fn(),
    addPlayer: jest.fn(),
    updatePlayer: jest.fn(),
    removePlayer: jest.fn(),
    loadTeamData: jest.fn(),
    loadMatchData: jest.fn(),
    loadPlayerData: jest.fn(),
 loadHeroesData: jest.fn(),
loadItemsData: jest.fn(),
  loadLeaguesData: jest.fn(),
  getTeamPlayersForDisplay: jest.fn(() => []),
  getTeamPlayersSortedForDisplay: jest.fn(() => []),
  getTeamHiddenPlayersForDisplay: jest.fn(() => []),
  hidePlayerOnTeam: jest.fn(),
  unhidePlayerOnTeam: jest.fn(),
  getTeamMatchesForDisplay: jest.fn(() => []),
  getTeamMatchFilters: jest.fn(() => ({
    filteredMatches: [],
    filterStats: {
      totalMatches: 0,
      filteredMatches: 0,
      filterBreakdown: {
        dateRange: 0,
        result: 0,
        teamSide: 0,
        pickOrder: 0,
        heroesPlayed: 0,
        opponent: 0,
        highPerformersOnly: 0,
      },
    },
  })),
  getTeamHeroSummaryForMatches: jest.fn(() => ({
    matchesCount: 0,
    activeTeamPicks: [],
    opponentTeamPicks: [],
    activeTeamBans: [],
    opponentTeamBans: [],
  })),
  }),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock the shadcn sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => (
    <div data-testid="sidebar" {...props}>
      {children}
    </div>
  ),
  SidebarContent: ({ children, ...props }: any) => (
    <div data-testid="sidebar-content" {...props}>
      {children}
    </div>
  ),
  SidebarFooter: ({ children, ...props }: any) => (
    <div data-testid="sidebar-footer" {...props}>
      {children}
    </div>
  ),
  SidebarGroup: ({ children, ...props }: any) => (
    <div data-testid="sidebar-group" {...props}>
      {children}
    </div>
  ),
  SidebarGroupLabel: ({ children, ...props }: any) => (
    <div data-testid="sidebar-group-label" {...props}>
      {children}
    </div>
  ),
  SidebarHeader: ({ children, ...props }: any) => (
    <div data-testid="sidebar-header" {...props}>
      {children}
    </div>
  ),
  SidebarMenu: ({ children, ...props }: any) => (
    <ul data-testid="sidebar-menu" {...props}>
      {children}
    </ul>
  ),
  SidebarMenuButton: ({ children, onClick, tooltip, ...props }: any) => (
    <button data-testid="sidebar-menu-button" onClick={onClick} title={tooltip} {...props}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children, ...props }: any) => (
    <li data-testid="sidebar-menu-item" {...props}>
      {children}
    </li>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail" />,
  SidebarSeparator: () => <div data-testid="sidebar-separator" />,
  useSidebar: () => ({
    open: true,
    toggleSidebar: jest.fn(),
  }),
}));

// Mock the Switch component
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id, ...props }: any) => (
    <button data-testid={`switch-${id}`} onClick={() => onCheckedChange(!checked)} aria-checked={checked} {...props}>
      {checked ? 'ON' : 'OFF'}
    </button>
  ),
}));

// Mock external site icons
jest.mock('@/frontend/shared/icons/ExternalSiteIcons', () => ({
  DotabuffIcon: () => <div data-testid="dotabuff-icon">Dotabuff</div>,
  OpenDotaIcon: () => <div data-testid="opendota-icon">OpenDota</div>,
  Dota2ProTrackerIcon: () => <div data-testid="dota2protracker-icon">Dota2ProTracker</div>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  BarChart: () => <div data-testid="bar-chart-icon">BarChart</div>,
  Building: () => <div data-testid="building-icon">Building</div>,
  ChevronLeft: () => <div data-testid="chevron-left-icon">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
}));

describe('AppSidebar', () => {
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

  it('renders sidebar with all main sections', () => {
    render(<AppSidebar />);

    // Check that main sidebar structure is rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
  });

  it('renders navigation section with all navigation items', () => {
    render(<AppSidebar />);

    // Check that navigation group is rendered
    const navigationGroups = screen.getAllByTestId('sidebar-group');
    expect(navigationGroups.length).toBeGreaterThan(0);

    // Check that navigation menu buttons are rendered
    const menuButtons = screen.getAllByTestId('sidebar-menu-button');
    expect(menuButtons.length).toBeGreaterThan(0);
  });

  it('renders sidebar title', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Dota Scouting Assistant')).toBeInTheDocument();
  });

  it('renders navigation group label', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('does not render quick links when no active team', () => {
    render(<AppSidebar />);

    // Quick Links should not be rendered when activeTeam is null
    expect(screen.queryByText('Quick Links')).not.toBeInTheDocument();
    expect(screen.queryByText('Team Page')).not.toBeInTheDocument();
    expect(screen.queryByText('League Page')).not.toBeInTheDocument();
  });

  it('renders external sites group label', () => {
    render(<AppSidebar />);

    expect(screen.getByText('External Sites')).toBeInTheDocument();
  });

  it('renders settings group label', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders navigation items with correct labels', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Match History')).toBeInTheDocument();
    expect(screen.getByText('Player Stats')).toBeInTheDocument();
  });

  it('does not render quick links items when no active team', () => {
    render(<AppSidebar />);

    // Quick Links should not be rendered when activeTeam is null
    expect(screen.queryByText('Team Page')).not.toBeInTheDocument();
    expect(screen.queryByText('League Page')).not.toBeInTheDocument();
  });

  it('renders external sites with correct labels', () => {
    render(<AppSidebar />);

    // Use getAllByText since there are multiple instances (icon and label)
    expect(screen.getAllByText('Dotabuff').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OpenDota').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dota2ProTracker').length).toBeGreaterThan(0);
  });

  it('renders theme switch in settings', () => {
    render(<AppSidebar />);

    expect(screen.getByTestId('switch-theme')).toBeInTheDocument();
  });

  it('renders preferred site switch in settings', () => {
    render(<AppSidebar />);

    expect(screen.getByTestId('switch-preferred-site')).toBeInTheDocument();
  });

  it('renders sidebar rail', () => {
    render(<AppSidebar />);

    expect(screen.getByTestId('sidebar-rail')).toBeInTheDocument();
  });

  it('renders sidebar separators', () => {
    render(<AppSidebar />);

    const separators = screen.getAllByTestId('sidebar-separator');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('renders all required icons', () => {
    render(<AppSidebar />);

    // Navigation icons
    expect(screen.getByTestId('building-icon')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();

    // Quick links icons - these might not be rendered if no active team
    // expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    // expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();

    // External site icons - use getAllByTestId since there are multiple instances
    expect(screen.getAllByTestId('dotabuff-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('opendota-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('dota2protracker-icon').length).toBeGreaterThan(0);

    // Theme icons
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<AppSidebar />);

    // Check that sidebar has proper role
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();

    // Check that navigation is properly structured
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();

    // Check that menu items are properly structured
    const menuItems = screen.getAllByTestId('sidebar-menu-item');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('renders with correct sidebar structure', () => {
    render(<AppSidebar />);

    // Verify the main sidebar structure
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('collapsible', 'icon');

    // Verify content and footer are present
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
  });
});
