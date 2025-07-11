import { render, screen } from '@testing-library/react';

import { DashboardContent } from '@/components/dashboard/DashboardContent';

// Mock the useTeamData hook
const mockUseTeamData = jest.fn();
jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: () => mockUseTeamData()
}));

// Mock the dashboard sub-components
jest.mock('@/components/dashboard/TeamOverview', () => ({
  TeamOverview: ({ teamData }: { teamData: Record<string, any> }) => (
    <div data-testid="team-overview" data-team-data={JSON.stringify(teamData)}>
      Team Overview
    </div>
  )
}));

jest.mock('@/components/dashboard/RecentMatches', () => ({
  RecentMatches: () => <div data-testid="recent-matches">Recent Matches</div>
}));

jest.mock('@/components/dashboard/PerformanceHighlights', () => ({
  PerformanceHighlights: () => <div data-testid="performance-highlights">Performance Highlights</div>
}));

jest.mock('@/components/dashboard/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>
}));

jest.mock('@/components/dashboard/WelcomeSection', () => ({
  WelcomeSection: () => <div data-testid="welcome-section">Welcome Section</div>
}));

describe('DashboardContent', () => {
  beforeEach(() => {
    mockUseTeamData.mockClear();
  });

  it('should render welcome section when no teams exist', () => {
    mockUseTeamData.mockReturnValue({
      teams: [],
      activeTeamId: null,
      teamData: null,
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    
    expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
  });

  it('should render team selection prompt when teams exist but no active team', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: null,
      teamData: null,
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    
    expect(screen.getByText('Select a Team')).toBeInTheDocument();
    expect(screen.getByText('Choose a team from the sidebar to view their dashboard and performance data.')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-section')).toBeInTheDocument();
  });

  it('should render loading state when loading is true', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: null,
      isLoadingTeamData: true,
      teamDataError: null
    });

    render(<DashboardContent />);
    
    // Check for loading skeleton elements (animate-pulse class)
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should render error state when error exists', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: null,
      isLoadingTeamData: false,
      teamDataError: 'Failed to load team data'
    });

    render(<DashboardContent />);
    
    expect(screen.getByText('Error Loading Team Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
  });

  it('should render main dashboard content when team is selected and data is loaded', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: {
        summary: { totalMatches: 10, overallWinRate: 60 },
        matches: [
          { id: 'm1', result: 'win', opponent: 'Team Beta', date: '2024-01-01' },
        ]
      },
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    
    expect(screen.getByTestId('team-overview')).toBeInTheDocument();
    expect(screen.getByTestId('recent-matches')).toBeInTheDocument();
    expect(screen.getByTestId('performance-highlights')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('should render proper grid layout for main content', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: {
        summary: { totalMatches: 10, overallWinRate: 60 },
        matches: [
          { id: 'm1', result: 'win', opponent: 'Team Beta', date: '2024-01-01' },
        ]
      },
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    const container = screen.getByTestId('team-overview').closest('.max-w-6xl');
    expect(container).toBeInTheDocument();
    const gridContainer = container?.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6');
  });

  it('should render main content in 2/3 width column', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: {
        summary: { totalMatches: 10, overallWinRate: 60 },
        matches: [
          { id: 'm1', result: 'win', opponent: 'Team Beta', date: '2024-01-01' },
        ]
      },
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    const mainContent = screen.getByTestId('dashboard-main-content');
    expect(mainContent).toBeInTheDocument();
  });

  it('should render sidebar in 1/3 width column', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: {
        summary: { totalMatches: 10, overallWinRate: 60 },
        matches: [
          { id: 'm1', result: 'win', opponent: 'Team Beta', date: '2024-01-01' },
        ]
      },
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    const sidebar = screen.getByTestId('dashboard-sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('should pass team data to TeamOverview component', () => {
    const mockTeamData = {
      totalMatches: 10,
      winRate: 60,
      recentTrend: undefined,
      recentMatches: [
        { id: 'm1', win: true, opponentTeamName: 'Team Beta', date: '2024-01-01' },
      ]
    };
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: {
        summary: { totalMatches: 10, overallWinRate: 60 },
        matches: [
          { id: 'm1', result: 'win', opponent: 'Team Beta', date: '2024-01-01' },
        ]
      },
      isLoadingTeamData: false,
      teamDataError: null
    });

    render(<DashboardContent />);
    const teamOverview = screen.getByTestId('team-overview');
    expect(teamOverview).toHaveAttribute('data-team-data', JSON.stringify(mockTeamData));
  });

  it('should render error state with proper styling', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', name: 'Team Alpha' }],
      activeTeamId: '1',
      teamData: null,
      isLoadingTeamData: false,
      teamDataError: 'Network error'
    });

    render(<DashboardContent />);
    const errorContainer = screen.getByText('Error Loading Team Data').closest('div');
    expect(errorContainer).toHaveClass('bg-red-50', 'dark:bg-red-900', 'border', 'border-red-200', 'dark:border-red-800', 'rounded-lg', 'p-6');
  });
}); 