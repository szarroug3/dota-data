import { render, screen } from '@testing-library/react';
import React from 'react';

import type { Player, Team } from '@/frontend/lib/app-data-types';
import type { StoredPlayerData } from '@/frontend/lib/storage-manager';
import { usePlayerData } from '@/frontend/players/hooks/usePlayerStatsPage';

const mockUseAppData = jest.fn();

jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => mockUseAppData(),
}));

const buildTeam = (): Team => ({
  id: '123-456',
  teamId: 123,
  leagueId: 456,
  name: 'Radiant Reborn',
  leagueName: 'Ancient League',
  timeAdded: Date.now(),
  matches: new Map(),
  players: new Map(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isLoading: false,
  highPerformingHeroes: new Set(),
});

const buildStoredPlayer = (): StoredPlayerData => ({
  accountId: 42,
  name: 'Invoker Main',
  rank: 'Divine 2',
  rank_tier: 72,
  leaderboard_rank: 1500,
  games: 100,
  winRate: 55,
  topHeroes: [],
  avatar: 'invoker.jpg',
  isManual: false,
  isHidden: false,
});

function HookProbe(): React.ReactElement {
  const { players } = usePlayerData();
  return (
    <div>
      <div data-testid="player-count">{players.length}</div>
      <div data-testid="player-names">{players.map((p: Player) => p.profile.personaname).join(', ')}</div>
    </div>
  );
}

describe('usePlayerData', () => {
  beforeEach(() => {
    const team = buildTeam();
    const stored = buildStoredPlayer();
    team.players.set(stored.accountId, stored);

    const playersMap = new Map<number, Player>();

    mockUseAppData.mockReturnValue({
      state: {
        selectedTeamId: team.id,
        selectedTeamIdParsed: { teamId: team.teamId, leagueId: team.leagueId },
        selectedMatchId: null,
        selectedPlayerId: null,
        isLoading: false,
        error: null,
      },
      teams: new Map([[team.id, team]]),
      matches: new Map(),
      players: playersMap,
      getTeam: () => team,
      getTeamPlayerIds: () => new Set([stored.accountId]),
      getPlayer: () => undefined,
      loadPlayer: jest.fn(),
      refreshPlayer: jest.fn(),
      getTeamPlayersForDisplay: () => [
        {
          accountId: stored.accountId,
          profile: {
            name: stored.name,
            personaname: stored.name,
            avatar: stored.avatar,
            avatarfull: stored.avatar,
            rank_tier: stored.rank_tier,
            leaderboard_rank: stored.leaderboard_rank,
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
      ],
      getTeamPlayersSortedForDisplay: () => [
        {
          accountId: stored.accountId,
          profile: {
            name: stored.name,
            personaname: stored.name,
            avatar: stored.avatar,
            avatarfull: stored.avatar,
            rank_tier: stored.rank_tier,
            leaderboard_rank: stored.leaderboard_rank,
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
      ],
      getTeamHiddenPlayersForDisplay: () => [],
      hidePlayerOnTeam: jest.fn(),
      unhidePlayerOnTeam: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns placeholder players derived from stored metadata when full data is missing', () => {
    render(<HookProbe />);

    expect(screen.getByTestId('player-count').textContent).toBe('1');
    expect(screen.getByTestId('player-names').textContent).toContain('Invoker Main');
  });
});
