import { render, screen } from '@testing-library/react';
import React from 'react';

import { PlayerStatsPageContainer } from '@/frontend/players/components/containers/PlayerStatsPageContainer';


const storedPlayer = {
  accountId: 123456789,
  name: 'Invoker Main',
  rank: 'Divine 2',
  rank_tier: 72,
  leaderboard_rank: 1500,
  games: 120,
  winRate: 55,
  topHeroes: [],
  avatar: 'invoker.png',
  isManual: false,
  isHidden: false,
};

const mockTeam = {
  id: '123-456',
  teamId: 123,
  leagueId: 456,
  name: 'Radiant Reborn',
  leagueName: 'Ancient League',
  timeAdded: Date.now(),
  matches: new Map(),
  players: new Map([[storedPlayer.accountId, storedPlayer]]),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isLoading: false,
  highPerformingHeroes: new Set(),
  manualPlayerIds: [storedPlayer.accountId],
};

const mockAppData = {
  state: {
    selectedTeamId: mockTeam.id,
    selectedTeamIdParsed: { teamId: mockTeam.teamId, leagueId: mockTeam.leagueId },
    selectedMatchId: null,
    selectedPlayerId: null,
    isLoading: false,
    error: null,
  },
  teams: new Map([[mockTeam.id, mockTeam]]),
  matches: new Map(),
  players: new Map(),
  heroes: new Map(),
  items: new Map(),
  leagues: new Map(),
  getTeam: jest.fn(() => mockTeam),
  getTeams: jest.fn(() => [mockTeam]),
  getTeamPlayerIds: jest.fn(() => new Set([storedPlayer.accountId])),
  getPlayer: jest.fn(() => undefined),
  loadPlayer: jest.fn(async () => null),
  refreshPlayer: jest.fn(async () => null),
  getTeamPlayersForDisplay: jest.fn(() => [
    {
      accountId: storedPlayer.accountId,
      profile: {
        name: storedPlayer.name,
        personaname: storedPlayer.name,
        avatar: storedPlayer.avatar,
        avatarfull: storedPlayer.avatar,
        rank_tier: storedPlayer.rank_tier,
        leaderboard_rank: storedPlayer.leaderboard_rank,
      },
      heroStats: [],
      overallStats: {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
      },
      recentMatchIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]),
  getTeamPlayersSortedForDisplay: jest.fn(() => [
    {
      accountId: storedPlayer.accountId,
      profile: {
        name: storedPlayer.name,
        personaname: storedPlayer.name,
        avatar: storedPlayer.avatar,
        avatarfull: storedPlayer.avatar,
        rank_tier: storedPlayer.rank_tier,
        leaderboard_rank: storedPlayer.leaderboard_rank,
      },
      heroStats: [],
      overallStats: {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
      },
      recentMatchIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]),
  getTeamHiddenPlayersForDisplay: jest.fn(() => []),
  hidePlayerOnTeam: jest.fn(),
  unhidePlayerOnTeam: jest.fn(),
  addManualPlayerToTeam: jest.fn(async () => undefined),
  removeManualPlayerFromTeam: jest.fn(),
  editManualPlayerToTeam: jest.fn(async () => undefined),
  getTeamPlayerOverview: jest.fn(() => ({ teamStats: null, detailedStats: null })),
};

jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => mockAppData,
}));

jest.mock('@/frontend/contexts/config-context', () => ({
  useConfigContext: () => ({
    config: {
      preferredPlayerlistView: 'list',
      preferredMatchlistView: 'list',
      preferredExternalSite: 'dotabuff',
      theme: 'system',
    },
    updateConfig: jest.fn(),
    resetConfig: jest.fn(),
    clearErrors: jest.fn(),
    getTeams: jest.fn(() => new Map()),
    setTeams: jest.fn(),
    activeTeam: null,
    setActiveTeam: jest.fn(),
    getGlobalManualMatches: jest.fn(() => []),
    setGlobalManualMatches: jest.fn(),
    getGlobalManualPlayers: jest.fn(() => []),
    setGlobalManualPlayers: jest.fn(),
    isLoading: false,
    isSaving: false,
    error: null,
  }),
}));

jest.mock('@/frontend/players/components/stateless/ResizablePlayerLayout', () => ({
  ResizablePlayerLayout: (props: any) => (
    <div
      data-testid="player-layout"
      data-view-mode={props.viewMode}
      data-player-count={props.players?.length ?? 0}
      data-player-ids={(props.players || []).map((p: any) => p.accountId ?? '').join(',')}
    >
      layout
    </div>
  ),
}));

describe('PlayerStatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppData.players.clear();
    mockAppData.matches.clear();
    mockAppData.heroes.clear();
    mockAppData.items.clear();
    mockAppData.leagues.clear();
    mockAppData.teams.clear();
    mockAppData.teams.set(mockTeam.id, mockTeam);
    mockAppData.getTeam.mockReturnValue(mockTeam);
    mockAppData.getTeams.mockReturnValue([mockTeam]);
    mockAppData.getTeamPlayerIds.mockReturnValue(new Set([storedPlayer.accountId]));
    mockAppData.state.selectedTeamId = mockTeam.id;
  });

  it('does not render a global loading skeleton when context is loading', () => {
    render(<PlayerStatsPageContainer />);
    expect(screen.getByTestId('player-layout')).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });

  it('initializes player list view mode from in-memory config defaults', () => {
    render(<PlayerStatsPageContainer />);
    const layout = screen.getByTestId('player-layout');
    expect(layout).toHaveAttribute('data-view-mode', 'list');
  });

  it('filters players to only those on the active team (manual or auto)', () => {
    render(<PlayerStatsPageContainer />);
    const layout = screen.getByTestId('player-layout');
    expect(layout).toHaveAttribute('data-player-count', '1');
    expect(layout).toHaveAttribute('data-player-ids', `${storedPlayer.accountId}`);
  });
});
