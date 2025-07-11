import { render, screen } from '@testing-library/react';

import { TeamOverview } from '@/components/dashboard/TeamOverview';
import { useTeamData } from '@/hooks/use-team-data';

// Mock the hooks
jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: jest.fn()
}));

const mockTeamData = {
  team: {
    id: '1',
    name: 'Team Alpha',
    leagueId: 'league-1',
    leagueName: 'Professional League',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  matches: [],
  players: [],
  summary: {
    totalMatches: 50,
    totalWins: 35,
    totalLosses: 15,
    overallWinRate: 70.0,
    lastMatchDate: '2023-01-01T00:00:00Z'
  }
};

const mockTeamOverviewData = {
  totalMatches: 50,
  winRate: 70.0,
  recentTrend: 'improving' as const,
  recentMatches: [
    {
      id: '1',
      win: true
    },
    {
      id: '2',
      win: false
    }
  ]
};

describe('TeamOverview', () => {
  beforeEach(() => {
    // Setup mocks
    (useTeamData as jest.Mock).mockReturnValue({
      teams: [mockTeamData.team],
      activeTeamId: '1',
      activeTeam: mockTeamData.team,
      teamData: mockTeamData,
      teamStats: null,
      isLoadingTeams: false,
      isLoadingTeamData: false,
      isLoadingTeamStats: false,
      teamsError: null,
      teamDataError: null,
      teamStatsError: null,
      setActiveTeam: jest.fn(),
      addTeam: jest.fn(),
      removeTeam: jest.fn(),
      refreshTeam: jest.fn(),
      updateTeam: jest.fn(),
      clearErrors: jest.fn()
    });
  });

  it('should render team overview with team name', () => {
    render(<TeamOverview teamData={mockTeamOverviewData} />);
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Professional League')).toBeInTheDocument();
  });

  it('should display team stats', () => {
    render(<TeamOverview teamData={mockTeamOverviewData} />);
    expect(screen.getByText('50')).toBeInTheDocument(); // totalMatches
    expect(screen.getByText('70%')).toBeInTheDocument(); // winRate
  });

  it('should display recent trend', () => {
    render(<TeamOverview teamData={mockTeamOverviewData} />);
    expect(screen.getByText('improving')).toBeInTheDocument();
  });

  it('should display recent performance section', () => {
    render(<TeamOverview teamData={mockTeamOverviewData} />);
    expect(screen.getByText('Recent Performance')).toBeInTheDocument();
    // Check for win/loss indicators
    expect(screen.getByText('W')).toBeInTheDocument(); // Win indicator
    expect(screen.getByText('L')).toBeInTheDocument(); // Loss indicator
  });

  it('should display stat card titles', () => {
    render(<TeamOverview teamData={mockTeamOverviewData} />);
    expect(screen.getByText('Total Matches')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Recent Trend')).toBeInTheDocument();
  });
}); 