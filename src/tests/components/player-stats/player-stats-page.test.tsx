import { fireEvent, screen } from '@testing-library/react';

import { PlayerStatsPage } from '@/components/player-stats/player-stats-page';
import { usePlayerStats } from '@/components/player-stats/player-stats-page/usePlayerStats';
import { renderWithProviders } from '@/tests/utils/test-utils';

jest.mock('@/components/player-stats/player-stats-page/usePlayerStats');
const mockUsePlayerStats = jest.mocked(usePlayerStats);

const mockTeams = [
  { id: '1', name: 'Team Alpha', leagueId: 'league1', leagueName: 'Professional League', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Team Beta', leagueId: 'league2', leagueName: 'Amateur League', isActive: true, createdAt: '', updatedAt: '' }
];

const mockPlayers = [
  {
    id: 'player1',
    name: 'Player One',
    teamId: '1',
    role: 'Carry',
    totalMatches: 50,
    winRate: 70.0
  }
];

const mockPlayerStats = [
  {
    playerId: 'player1',
    playerName: 'Player One',
    avatar: undefined,
    totalMatches: 50,
    winRate: 70.0,
    averageKills: 8,
    averageDeaths: 3,
    averageAssists: 12,
    averageKDA: 3.5,
    averageGPM: 500,
    averageXPM: 600,
    mostPlayedHero: { heroId: '1', heroName: 'Pudge', matches: 20, winRate: 65 },
    bestPerformanceHero: { heroId: '2', heroName: 'Invoker', matches: 10, winRate: 80, averageKDA: 4.2 },
    recentPerformance: { trend: 'improving' as const, lastFiveMatches: [ { win: true, kda: 4 }, { win: false, kda: 2 }, { win: true, kda: 5 }, { win: true, kda: 3 }, { win: false, kda: 1 } ] }
  }
];

const createMockUsePlayerStatsReturn = (overrides = {}) => ({
  teams: mockTeams,
  activeTeamId: '1',
  activeTeam: mockTeams[0],
  players: mockPlayers,
  isLoadingPlayers: false,
  playersError: null,
  viewType: 'overview' as const,
  setViewType: jest.fn(),
  sortBy: 'winRate' as const,
  setSortBy: jest.fn(),
  sortDirection: 'desc' as const,
  setSortDirection: jest.fn(),
  handleSortChange: jest.fn(),
  handleSortDirectionChange: jest.fn(),
  sortedPlayers: mockPlayerStats,
  playerStats: mockPlayerStats,
  ...overrides
});

describe('PlayerStatsPage', () => {
  beforeEach(() => {
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render player stats page', () => {
    renderWithProviders(<PlayerStatsPage />);
    expect(screen.getByText('Player Statistics for Team Alpha')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn({
      isLoadingPlayers: true
    }));
    renderWithProviders(<PlayerStatsPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn({
      playersError: 'Failed to load players'
    }));
    renderWithProviders(<PlayerStatsPage />);
    expect(screen.getByText('Failed to load players')).toBeInTheDocument();
  });

  it('should show no teams message', () => {
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn({
      teams: []
    }));
    renderWithProviders(<PlayerStatsPage />);
    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
  });

  it('should show team selection message', () => {
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn({
      activeTeamId: null,
      activeTeam: null
    }));
    renderWithProviders(<PlayerStatsPage />);
    expect(screen.getByText('Select a Team')).toBeInTheDocument();
  });

  it('should render player stats with controls', () => {
    renderWithProviders(<PlayerStatsPage />);
    expect(screen.getByText('Player Statistics for Team Alpha')).toBeInTheDocument();
    expect(screen.getByLabelText('View:')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
  });

  it('should handle view type changes', () => {
    const setViewType = jest.fn();
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn({ setViewType }));
    renderWithProviders(<PlayerStatsPage />);
    const viewSelect = screen.getByLabelText('View:');
    expect(viewSelect).toHaveValue('overview');
    fireEvent.change(viewSelect, { target: { value: 'detailed' } });
    expect(setViewType).toHaveBeenCalledWith('detailed');
  });

  it('should handle sort changes', () => {
    const handleSortChange = jest.fn();
    mockUsePlayerStats.mockReturnValue(createMockUsePlayerStatsReturn({ handleSortChange }));
    renderWithProviders(<PlayerStatsPage />);
    const sortSelect = screen.getByLabelText('Sort by:');
    expect(sortSelect).toHaveValue('winRate');
    fireEvent.change(sortSelect, { target: { value: 'kda' } });
    expect(handleSortChange).toHaveBeenCalledWith('kda');
  });
}); 