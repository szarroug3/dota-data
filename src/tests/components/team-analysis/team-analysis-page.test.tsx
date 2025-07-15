import { screen } from '@testing-library/react';

import { TeamAnalysisPage } from '@/components/team-analysis/team-analysis-page';
import { useMatchData } from '@/hooks/use-match-data';
import { usePlayerData } from '@/hooks/use-player-data';
import { useTeamData } from '@/hooks/use-team-data';
import { renderWithProviders } from '@/tests/utils/test-utils';
import { Match, Team } from '@/types/contexts/team-context-value';

// Mock the hooks
jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: jest.fn()
}));

jest.mock('@/hooks/use-match-data', () => ({
  useMatchData: jest.fn()
}));

jest.mock('@/hooks/use-player-data', () => ({
  usePlayerData: jest.fn()
}));

// Mock data for team analysis tests
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

const mockPlayers: any[] = [ // Changed to any[] as Player type is removed
  {
    id: '1',
    name: 'Player One',
    teamId: '1',
    role: 'carry',
    totalMatches: 10,
    winRate: 70.0
  },
  {
    id: '2',
    name: 'Player Two', 
    teamId: '1',
    role: 'support',
    totalMatches: 10,
    winRate: 60.0
  }
];

describe('Team Analysis Page', () => {
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

    (usePlayerData as jest.Mock).mockReturnValue({
      players: [],
      filteredPlayers: [],
      selectedPlayerId: null,
      selectedPlayer: null,
      playerStats: null,
      filters: {
        dateRange: { start: null, end: null },
        heroes: [],
        roles: [],
        result: 'all',
        performance: { minKDA: null, minGPM: null, minXPM: null }
      },
      isLoadingPlayers: false,
      isLoadingPlayerData: false,
      isLoadingPlayerStats: false,
      playersError: null,
      playerDataError: null,
      playerStatsError: null,
      setSelectedPlayer: jest.fn(),
      setFilters: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      refreshPlayer: jest.fn(),
      clearErrors: jest.fn()
    });
  });

  it('should render team analysis page', () => {
    renderWithProviders(<TeamAnalysisPage />);
    // There are multiple headings with "Team Analysis" (sidebar and main content)
    expect(screen.getAllByRole('heading', { name: 'Team Analysis' }).length).toBeGreaterThan(0);
  });

  it('should show loading state', () => {
    (useTeamData as jest.Mock).mockReturnValue({
      teams: mockTeams,
      activeTeamId: '1',
      activeTeam: mockTeams[0],
      teamData: null,
      teamStats: null,
      isLoadingTeams: true,
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

    renderWithProviders(<TeamAnalysisPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useMatchData as jest.Mock).mockReturnValue({
      matches: [],
      selectedMatch: null,
      loading: false,
      error: 'Failed to load team data',
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

    renderWithProviders(<TeamAnalysisPage />);
    expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
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

    renderWithProviders(<TeamAnalysisPage />);
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

    renderWithProviders(<TeamAnalysisPage />);
    expect(screen.getByText('Select a Team')).toBeInTheDocument();
  });

  it('should handle match loading state', () => {
    (useMatchData as jest.Mock).mockReturnValue({
      matches: [],
      selectedMatch: null,
      loading: true,
      error: null
    });

    renderWithProviders(<TeamAnalysisPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should handle match error state', () => {
    (useMatchData as jest.Mock).mockReturnValue({
      matches: [],
      selectedMatch: null,
      loading: false,
      error: 'Failed to load matches'
    });

    renderWithProviders(<TeamAnalysisPage />);
    expect(screen.getByText('Failed to load matches')).toBeInTheDocument();
  });
}); 