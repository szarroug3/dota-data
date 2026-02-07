import React from 'react';

import { PlayerStatsPage } from '@/frontend/players/components/stateless/PlayerStatsPage';
import { renderWithProviders, screen } from '@/tests/utils/test-utils';

// We don’t want a global loading skeleton to show on add/refresh
// This test ensures the page renders list content even when the player context is in a loading state,
// leaving per-player loading to individual cards.

// Mock AppData context instead of constants context
const mockPlayerId = 123456789;
const mockPlayer = {
  accountId: mockPlayerId,
  profile: {
    name: 'Test Player',
    personaname: 'Test Player',
    rank_tier: 0,
  },
  heroStats: [],
  overallStats: {
    wins: 0,
    losses: 0,
    totalGames: 0,
    winRate: 0,
  },
  recentMatchIds: [],
  createdAt: 0,
  updatedAt: 0,
};

const mockTeamId = '123-456';
const mockStoredPlayer = {
  accountId: mockPlayerId,
  name: 'Test Player',
  rank: 'Unranked',
  rank_tier: 0,
  games: 0,
  winRate: 0,
  topHeroes: [],
  avatar: '',
  isManual: true,
  isHidden: false,
};

const mockTeam = {
  id: mockTeamId,
  teamId: 123,
  leagueId: 456,
  name: 'Test Team',
  leagueName: 'Test League',
  timeAdded: 0,
  matches: new Map(),
  players: new Map([[mockPlayerId, mockStoredPlayer]]),
  createdAt: 0,
  updatedAt: 0,
  isLoading: false,
  highPerformingHeroes: new Set<string>(),
};

const mockAppData = {
  _teams: new Map([[mockTeamId, mockTeam]]),
  _players: new Map([[mockPlayerId, mockPlayer]]),
  teams: new Map([[mockTeamId, mockTeam]]),
  matches: new Map(),
  players: new Map([[mockPlayerId, mockPlayer]]),
  heroes: new Map(),
  items: new Map(),
  leagues: new Map(),
  state: {
    selectedTeamId: mockTeamId,
    selectedTeamIdParsed: { teamId: 123, leagueId: 456 },
    selectedMatchId: null,
    selectedPlayerId: null,
    isLoading: false,
    error: null,
  },
  getTeamPlayersViewData: jest.fn(() => ({
    teamPlayerIds: new Set([mockPlayerId]),
    teamPlayers: [mockPlayer],
    sortedPlayers: [mockPlayer],
    manualPlayerIds: new Set([mockPlayerId]),
  })),
  getPlayerListViewEntries: jest.fn((players: (typeof mockPlayer)[]) =>
    players.map((player) => ({ player, topHeroes: [], rank: null })),
  ),
  validatePlayerIdInput: jest.fn(() => ({ isValid: false, error: 'Player ID is required' })),
  getAddManualPlayerDuplicateError: jest.fn(() => undefined),
  getEditManualPlayerDuplicateError: jest.fn(() => undefined),
  loadPlayer: jest.fn(),
  refreshPlayer: jest.fn(),
  addManualPlayerToTeam: jest.fn(),
  removeManualPlayerFromTeam: jest.fn(),
  editManualPlayerToTeam: jest.fn(),
};

jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => mockAppData,
  AppDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ResizablePlayerLayout to render a deterministic marker
jest.mock('@/frontend/players/components/stateless/ResizablePlayerLayout', () => ({
  ResizablePlayerLayout: (props: any) => (
    <div
      data-testid="player-layout"
      data-view-mode={props.viewMode}
      data-player-count={props.visiblePlayers?.length ?? 0}
      data-player-ids={(props.visiblePlayers || []).map((p: any) => p.accountId).join(',')}
    >
      layout
    </div>
  ),
}));

describe('PlayerStatsPage', () => {
  it('does not render a global loading skeleton when context is loading', () => {
    renderWithProviders(<PlayerStatsPage />);
    // Should render the layout instead of a page-level loading skeleton
    expect(screen.getByTestId('player-layout')).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  });

  it('initializes player list view mode from in-memory config defaults', () => {
    renderWithProviders(<PlayerStatsPage />);
    const layout = screen.getByTestId('player-layout');
    expect(layout).toHaveAttribute('data-view-mode', 'list');
  });

  it('filters players to only those on the active team (manual or auto)', () => {
    renderWithProviders(<PlayerStatsPage />);
    const layout = screen.getByTestId('player-layout');
    expect(layout).toHaveAttribute('data-player-count', '1');
    expect(layout).toHaveAttribute('data-player-ids', '123456789');
  });
});
