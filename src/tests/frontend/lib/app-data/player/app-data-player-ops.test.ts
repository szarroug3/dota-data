import type { Player, Team } from '@/frontend/lib/app-data/app-data-types';
import { addManualPlayerToTeam } from '@/frontend/lib/app-data/player/app-data-player-ops';
import type { AppDataPlayerOpsContext } from '@/frontend/lib/app-data/player/app-data-player-ops';

const teamKey = '1-2';

function createTeam(): Team {
  return {
    id: teamKey,
    teamId: 1,
    leagueId: 2,
    name: 'Test Team',
    leagueName: 'Test League',
    timeAdded: Date.now(),
    matches: new Map(),
    players: new Map(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isLoading: false,
    highPerformingHeroes: new Set(),
  };
}

function createPlayer(accountId: number): Player {
  const now = Date.now();
  return {
    accountId,
    profile: {
      name: `Player ${accountId}`,
      personaname: `Player ${accountId}`,
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
    createdAt: now,
    updatedAt: now,
  };
}

function createMockAppData(): AppDataPlayerOpsContext {
  const team = createTeam();
  const appData = {
    _teams: new Map([[teamKey, team]]),
    _players: new Map<number, Player>(),
    updateTeam: jest.fn((key: string, updates: Partial<Team>) => {
      const current = appData._teams.get(key);
      if (!current) return;
      appData._teams.set(key, { ...current, ...updates, updatedAt: Date.now() });
    }),
    saveToStorage: jest.fn(),
    loadPlayer: jest.fn().mockResolvedValue(null),
    addPlayer: jest.fn((player: Player) => {
      appData._players.set(player.accountId, player);
    }),
    updateTeamPlayersMetadata: jest.fn(),
  } as AppDataPlayerOpsContext;

  return appData;
}

describe('addManualPlayerToTeam', () => {
  it('adds a loading placeholder when player is missing', async () => {
    const appData = createMockAppData();
    const playerId = 12345;

    await addManualPlayerToTeam(appData, playerId, teamKey);

    const team = appData._teams.get(teamKey);
    expect(team?.players.has(playerId)).toBe(true);
    expect(appData.addPlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: playerId,
        isLoading: true,
      }),
    );
    expect(appData.loadPlayer).toHaveBeenCalledWith(playerId);
    expect(appData.updateTeamPlayersMetadata).toHaveBeenCalledWith(teamKey);
  });

  it('does not overwrite an existing player entry', async () => {
    const appData = createMockAppData();
    const playerId = 67890;
    appData._players.set(playerId, createPlayer(playerId));

    await addManualPlayerToTeam(appData, playerId, teamKey);

    expect(appData.addPlayer).not.toHaveBeenCalled();
    expect(appData.loadPlayer).toHaveBeenCalledWith(playerId);
  });
});
