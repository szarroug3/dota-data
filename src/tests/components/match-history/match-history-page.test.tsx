import { fireEvent, render, screen } from '@testing-library/react';

import { MatchHistoryPage } from '@/components/match-history/match-history-page';
import { useMatchData } from '@/hooks/use-match-data';
import { useTeamData } from '@/hooks/use-team-data';
import { Match, Team } from '@/types/contexts/team-context-value';

// Mock the hooks
jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: jest.fn()
}));

jest.mock('@/hooks/use-match-data', () => ({
  useMatchData: jest.fn()
}));

// Mock data for match history tests
const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Team Alpha',
    leagueId: 'league-1',
    leagueName: 'Professional League',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Team Beta',
    leagueId: 'league-2',
    leagueName: 'Division 1',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

const mockMatches: Match[] = [
  {
    id: '1',
    teamId: '1',
    opponent: 'Team Gamma',
    result: 'win',
    date: '2023-01-01T00:00:00Z',
    duration: 2400,
    heroes: ['anti-mage', 'pudge'],
    players: ['player-1', 'player-2']
  },
  {
    id: '2',
    teamId: '1',
    opponent: 'Team Delta',
    result: 'loss',
    date: '2023-01-02T00:00:00Z',
    duration: 1800,
    heroes: ['crystal-maiden', 'invoker'],
    players: ['player-1', 'player-2']
  }
];

describe('Match History Page', () => {
  beforeEach(() => {
    // Setup mocks
    (useTeamData as jest.Mock).mockReturnValue({
      teams: mockTeams,
      activeTeamId: '1',
      activeTeam: mockTeams[0],
      teamData: null,
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

    (useMatchData as jest.Mock).mockReturnValue({
      matches: mockMatches,
      selectedMatch: null,
      loading: false,
      error: null,
      filters: {
        dateRange: { start: null, end: null },
        result: 'all',
        opponent: '',
        heroes: [],
        players: [],
        duration: { min: null, max: null }
      },
      actions: {
        selectMatch: jest.fn(),
        setFilters: jest.fn(),
        refreshMatches: jest.fn(),
        clearError: jest.fn()
      }
    });
  });

  it('should render match history page', () => {
    render(<MatchHistoryPage />);
    // Use getByRole to target the main page heading (h1), not the content section heading or sidebar
    expect(screen.getByRole('heading', { level: 1, name: 'Match History' })).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useMatchData as jest.Mock).mockReturnValue({
      matches: [],
      loading: true,
      error: null
    });

    render(<MatchHistoryPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useMatchData as jest.Mock).mockReturnValue({
      matches: [],
      loading: false,
      error: 'Failed to load matches'
    });

    render(<MatchHistoryPage />);
    // The ErrorContent component shows "Error Loading Match History" as the header
    expect(screen.getByText('Error Loading Match History')).toBeInTheDocument();
    // And the actual error message
    expect(screen.getByText('Failed to load matches')).toBeInTheDocument();
  });

  it('should show no teams message', () => {
    (useTeamData as jest.Mock).mockReturnValue({
      teams: [],
      activeTeamId: null,
      activeTeam: null,
      teamData: null,
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

    render(<MatchHistoryPage />);
    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
  });

  it('should show team selection message', () => {
    (useTeamData as jest.Mock).mockReturnValue({
      teams: mockTeams,
      activeTeamId: null,
      activeTeam: null,
      teamData: null,
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

    render(<MatchHistoryPage />);
    expect(screen.getByText('Select a Team')).toBeInTheDocument();
  });

  it('should render match history with controls', () => {
    render(<MatchHistoryPage />);
    
    // Check for the main content heading that shows just "Match History"
    expect(screen.getByRole('heading', { level: 3, name: 'Match History' })).toBeInTheDocument();
    expect(screen.getByText('View and analyze team match performance over time')).toBeInTheDocument();
    expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
    expect(screen.getByLabelText('Result')).toBeInTheDocument();
  });

  it('should handle result filter changes', () => {
    render(<MatchHistoryPage />);
    
    const resultSelect = screen.getByLabelText('Result');
    
    expect(resultSelect).toHaveValue('all');
    
    fireEvent.change(resultSelect, { target: { value: 'win' } });
    expect(resultSelect).toHaveValue('win');
  });

  it('should handle time period filter changes', () => {
    render(<MatchHistoryPage />);
    
    const timePeriodSelect = screen.getByLabelText('Date Range');
    
    expect(timePeriodSelect).toHaveValue('30');
    
    fireEvent.change(timePeriodSelect, { target: { value: '7' } });
    expect(timePeriodSelect).toHaveValue('7');
  });
}); 