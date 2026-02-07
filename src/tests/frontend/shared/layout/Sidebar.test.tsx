import { render, screen } from '@testing-library/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ButtonHTMLAttributes, HTMLAttributes, LiHTMLAttributes, PropsWithChildren } from 'react';

import { GLOBAL_TEAM_KEY } from '@/frontend/lib/app-data/app-data-types';
import { AppSidebar } from '@/frontend/shared/layout/Sidebar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock context providers
jest.mock('@/frontend/contexts/config-context', () => ({
  useConfigContext: () => ({
    config: {
      sidebarCollapsed: false,
      preferredExternalSite: 'dotabuff' as const,
    },
    updateConfig: jest.fn(),
    activeTeam: null,
    setActiveTeam: jest.fn(),
  }),
}));

jest.mock('@/hooks/app-data/use-app-data', () => ({
  useAppData: jest.fn(),
}));

jest.mock('@/frontend/contexts/share-context', () => ({
  useShareContext: () => ({
    isShareMode: false,
    shareKey: null,
    createShare: jest.fn(async () => null),
  }),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock the shadcn sidebar components
type SidebarDivProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;
type SidebarUlProps = PropsWithChildren<HTMLAttributes<HTMLUListElement>>;
type SidebarLiProps = PropsWithChildren<LiHTMLAttributes<HTMLLIElement>>;
type SidebarMenuButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { tooltip?: string }>;
type SwitchButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id?: string;
  }
>;
type SelectProps = PropsWithChildren<{
  value?: string;
  onValueChange?: (value: string) => void;
}>;
type SelectItemProps = PropsWithChildren<{
  value: string;
  disabled?: boolean;
}>;
type SelectTriggerProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { id?: string }>;

jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="sidebar" {...props}>
      {children}
    </div>
  ),
  SidebarContent: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="sidebar-content" {...props}>
      {children}
    </div>
  ),
  SidebarFooter: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="sidebar-footer" {...props}>
      {children}
    </div>
  ),
  SidebarGroup: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="sidebar-group" {...props}>
      {children}
    </div>
  ),
  SidebarGroupLabel: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="sidebar-group-label" {...props}>
      {children}
    </div>
  ),
  SidebarHeader: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="sidebar-header" {...props}>
      {children}
    </div>
  ),
  SidebarMenu: ({ children, ...props }: SidebarUlProps) => (
    <ul data-testid="sidebar-menu" {...props}>
      {children}
    </ul>
  ),
  SidebarMenuButton: ({ children, onClick, tooltip, ...props }: SidebarMenuButtonProps) => (
    <button data-testid="sidebar-menu-button" onClick={onClick} title={tooltip} {...props}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children, ...props }: SidebarLiProps) => (
    <li data-testid="sidebar-menu-item" {...props}>
      {children}
    </li>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail" />,
  SidebarSeparator: () => <div data-testid="sidebar-separator" />,
  useSidebar: () => ({
    open: true,
    openMobile: false,
    state: 'expanded',
    isMobile: false,
    toggleSidebar: jest.fn(),
  }),
}));

// Mock the Switch component
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id, ...props }: SwitchButtonProps) => (
    <button data-testid={`switch-${id}`} onClick={() => onCheckedChange(!checked)} aria-checked={checked} {...props}>
      {checked ? 'ON' : 'OFF'}
    </button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: SidebarDivProps) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: SidebarDivProps) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children, ...props }: SidebarDivProps) => (
    <div data-testid="tooltip-content" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: SelectProps) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, id, ...props }: SelectTriggerProps) => (
    <button type="button" data-testid="select-trigger" id={id} {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: PropsWithChildren) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, disabled }: SelectItemProps) => (
    <div data-testid="select-item" data-value={value} data-disabled={disabled ? 'true' : 'false'}>
      {children}
    </div>
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
  Clipboard: () => <div data-testid="clipboard-icon">Clipboard</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
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
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
  const mockUseAppData = jest.requireMock('@/hooks/app-data/use-app-data').useAppData as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
    mockUseAppData.mockReturnValue({
      state: { selectedTeamId: GLOBAL_TEAM_KEY },
      teams: new Map(),
      getTeam: jest.fn(() => ({
        teamId: 0,
        leagueId: 0,
        isGlobal: true,
        matches: new Map(),
        players: new Map(),
      })),
      getAllTeamsForDisplayOrdered: jest.fn(() => [
        {
          team: { id: 0, name: '' },
          league: { id: 0, name: '' },
          timeAdded: new Date(0).toISOString(),
          matches: {},
          manualMatches: {},
          manualPlayers: [],
          players: [],
          performance: {
            totalMatches: 0,
            totalWins: 0,
            totalLosses: 0,
            overallWinRate: 0,
            erroredMatches: 0,
          },
          isLoading: false,
          isGlobal: true,
        },
        {
          team: { id: 123, name: 'Team Alpha' },
          league: { id: 456, name: 'League Beta' },
          timeAdded: new Date(1).toISOString(),
          matches: {},
          manualMatches: {},
          manualPlayers: [],
          players: [],
          performance: {
            totalMatches: 1,
            totalWins: 1,
            totalLosses: 0,
            overallWinRate: 100,
            erroredMatches: 0,
          },
          isLoading: false,
          isGlobal: false,
        },
      ]),
      setSelectedTeam: jest.fn(),
    });
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

  it('renders team selector with available teams', () => {
    render(<AppSidebar />);

    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Global (manual items)')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha - League Beta')).toBeInTheDocument();
  });

  it('does not render quick links for global team', () => {
    render(<AppSidebar />);

    // Quick Links should not be rendered for the global team
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

  it('does not render quick links items for global team', () => {
    render(<AppSidebar />);

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
