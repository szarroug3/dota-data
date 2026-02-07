import { loadMatch, refreshMatch, refreshPlayer } from '@/frontend/lib/app-data-initialization-ops';
import type { AppDataInitializationOpsContext } from '@/frontend/lib/app-data-initialization-ops';
import type { Hero, Item, Match, Player, Team } from '@/frontend/lib/app-data-types';
import { fetchAndProcessMatch } from '@/frontend/lib/match-loader';
import { fetchAndProcessPlayer } from '@/frontend/lib/player-loader';
import { loadHeroes, loadItems } from '@/frontend/lib/reference-data-loader';

jest.mock('@/frontend/lib/player-loader', () => ({
  fetchAndProcessPlayer: jest.fn(),
}));

jest.mock('@/frontend/lib/match-loader', () => ({
  fetchAndProcessMatch: jest.fn(),
}));

jest.mock('@/frontend/lib/reference-data-loader', () => ({
  loadHeroes: jest.fn(),
  loadItems: jest.fn(),
  loadLeagues: jest.fn(),
}));

const teamKey = '1-2';

function createTeam(): Team {
  return {
    id: teamKey,
    teamId: 1,
    leagueId: 2,
    name: 'Team One',
    leagueName: 'League Two',
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

describe('refreshPlayer', () => {
  it('marks player as loading and forces refresh', async () => {
    const playerId = 456;
    const existingPlayer = createPlayer(playerId);
    const refreshedPlayer = { ...createPlayer(playerId), profile: { ...existingPlayer.profile, name: 'Updated' } };
    const mockFetch = fetchAndProcessPlayer as jest.MockedFunction<typeof fetchAndProcessPlayer>;
    mockFetch.mockResolvedValue(refreshedPlayer);

    const appData = {
      _players: new Map([[playerId, existingPlayer]]),
      _teams: new Map([[teamKey, createTeam()]]),
      addPlayer: jest.fn((player: Player) => {
        appData._players.set(player.accountId, player);
      }),
      getTeamPlayerIds: jest.fn(() => new Set([playerId])),
      updateTeamPlayersMetadata: jest.fn(),
    } as unknown as AppDataInitializationOpsContext;

    await refreshPlayer(appData, playerId);

    expect(mockFetch).toHaveBeenCalledWith(playerId, { force: true });
    expect(appData.addPlayer).toHaveBeenCalledWith(expect.objectContaining({ accountId: playerId, isLoading: true }));
    expect(appData.addPlayer).toHaveBeenCalledWith(refreshedPlayer);
    expect(appData.updateTeamPlayersMetadata).toHaveBeenCalledWith(teamKey);
  });
});

describe('refreshMatch', () => {
  it('marks match as loading and replaces it on refresh', async () => {
    const matchId = 789;
    const existingMatch: Match = {
      id: matchId,
      date: '2024-01-15T10:30:00Z',
      duration: 3600,
      radiant: { name: 'Radiant Team' },
      dire: { name: 'Dire Team' },
      draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
      players: { radiant: [], dire: [] },
      statistics: {
        radiantScore: 25,
        direScore: 20,
        goldAdvantage: { times: [], radiantGold: [], direGold: [] },
        experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
      },
      events: [],
      result: 'radiant',
    };

    const refreshedMatch: Match = {
      ...existingMatch,
      duration: 3800,
      players: {
        radiant: [
          {
            accountId: 1,
            playerName: 'Player 1',
            hero: { id: 1, name: 'npc_dota_hero_antimage', localizedName: 'Anti-Mage', imageUrl: '' },
            stats: {
              kills: 1,
              deaths: 1,
              assists: 1,
              lastHits: 1,
              denies: 0,
              gpm: 0,
              xpm: 0,
              netWorth: 0,
              level: 1,
            },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
        dire: [
          {
            accountId: 2,
            playerName: 'Player 2',
            hero: { id: 2, name: 'npc_dota_hero_axe', localizedName: 'Axe', imageUrl: '' },
            stats: {
              kills: 1,
              deaths: 1,
              assists: 1,
              lastHits: 1,
              denies: 0,
              gpm: 0,
              xpm: 0,
              netWorth: 0,
              level: 1,
            },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
      },
    };

    const mockFetch = fetchAndProcessMatch as jest.MockedFunction<typeof fetchAndProcessMatch>;
    mockFetch.mockResolvedValue(refreshedMatch);

    const appData = {
      _matches: new Map([[matchId, existingMatch]]),
      _teams: new Map([[teamKey, createTeam()]]),
      _players: new Map(),
      heroes: new Map(),
      items: new Map(),
      leagues: new Map(),
      leagueMatchesCache: new Map(),
      getTeam: jest.fn(),
      getMatch: jest.fn(),
      getPlayer: jest.fn(),
      addMatch: jest.fn(),
      addPlayer: jest.fn(),
      addTeam: jest.fn(),
      updateTeam: jest.fn(),
      setSelectedTeam: jest.fn(),
      saveToStorage: jest.fn(),
      updateTeamMatchParticipation: jest.fn(),
      updateTeamPlayersMetadata: jest.fn(),
      getTeamPlayerIds: jest.fn(),
      loadPlayersFromMatchForTeam: jest.fn(),
      loadTeamMatches: jest.fn(),
      fetchTeamAndLeagueData: jest.fn(),
      getTeams: jest.fn(),
      state: {
        selectedTeamId: '0-0',
        selectedTeamIdParsed: { teamId: 0, leagueId: 0 },
        selectedMatchId: null,
        selectedPlayerId: null,
        isLoading: false,
        error: null,
      },
    } as AppDataInitializationOpsContext;

    await refreshMatch(appData, matchId);

    expect(appData.addMatch).toHaveBeenCalledWith(expect.objectContaining({ id: matchId, isLoading: true }));
    expect(appData.addMatch).toHaveBeenCalledWith(refreshedMatch);
  });
});

describe('loadMatch', () => {
  it('loads heroes and items when reference data is empty', async () => {
    const matchId = 123;
    const placeholderMatch: Match = {
      id: matchId,
      date: '2024-01-15T10:30:00Z',
      duration: 3600,
      radiant: { name: 'Radiant' },
      dire: { name: 'Dire' },
      draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
      players: { radiant: [], dire: [] },
      statistics: {
        radiantScore: 25,
        direScore: 20,
        goldAdvantage: { times: [], radiantGold: [], direGold: [] },
        experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
      },
      events: [],
      result: 'radiant',
    };

    const fullMatch: Match = {
      ...placeholderMatch,
      players: {
        radiant: [
          {
            accountId: 1,
            playerName: 'Player 1',
            hero: { id: 1, name: 'npc_dota_hero_antimage', localizedName: 'Anti-Mage', imageUrl: '' },
            stats: {
              kills: 1,
              deaths: 1,
              assists: 1,
              lastHits: 1,
              denies: 0,
              gpm: 0,
              xpm: 0,
              netWorth: 0,
              level: 1,
            },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
        dire: [
          {
            accountId: 2,
            playerName: 'Player 2',
            hero: { id: 2, name: 'npc_dota_hero_axe', localizedName: 'Axe', imageUrl: '' },
            stats: {
              kills: 1,
              deaths: 1,
              assists: 1,
              lastHits: 1,
              denies: 0,
              gpm: 0,
              xpm: 0,
              netWorth: 0,
              level: 1,
            },
            items: [],
            heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
          },
        ],
      },
    };

    const mockHeroes = new Map<number, Hero>([
      [1, { id: 1, name: 'npc_dota_hero_antimage', localizedName: 'Anti-Mage', imageUrl: '' }],
    ]);
    const mockItems = new Map<number, Item>([[1, { id: 1, name: 'item_blink', imageUrl: '' }]]);

    const mockFetch = fetchAndProcessMatch as jest.MockedFunction<typeof fetchAndProcessMatch>;
    mockFetch.mockResolvedValue(fullMatch);

    const mockLoadHeroes = loadHeroes as jest.MockedFunction<typeof loadHeroes>;
    mockLoadHeroes.mockResolvedValue(mockHeroes);

    const mockLoadItems = loadItems as jest.MockedFunction<typeof loadItems>;
    mockLoadItems.mockResolvedValue(mockItems);

    const appData = {
      _matches: new Map([[matchId, placeholderMatch]]),
      _teams: new Map([[teamKey, createTeam()]]),
      _players: new Map(),
      heroes: new Map(),
      items: new Map(),
      leagues: new Map(),
      leagueMatchesCache: new Map(),
      getTeam: jest.fn(),
      getMatch: jest.fn(),
      getPlayer: jest.fn(),
      addMatch: jest.fn(),
      addPlayer: jest.fn(),
      addTeam: jest.fn(),
      updateTeam: jest.fn(),
      setSelectedTeam: jest.fn(),
      saveToStorage: jest.fn(),
      updateTeamMatchParticipation: jest.fn(),
      updateTeamPlayersMetadata: jest.fn(),
      getTeamPlayerIds: jest.fn(),
      loadPlayersFromMatchForTeam: jest.fn(),
      loadTeamMatches: jest.fn(),
      fetchTeamAndLeagueData: jest.fn(),
      getTeams: jest.fn(),
      state: {
        selectedTeamId: '0-0',
        selectedTeamIdParsed: { teamId: 0, leagueId: 0 },
        selectedMatchId: null,
        selectedPlayerId: null,
        isLoading: false,
        error: null,
      },
    } as AppDataInitializationOpsContext;

    await loadMatch(appData, matchId);

    expect(mockLoadHeroes).toHaveBeenCalled();
    expect(mockLoadItems).toHaveBeenCalled();
    expect(appData.addMatch).toHaveBeenCalledWith(expect.objectContaining({ id: matchId, isLoading: true }));
    expect(appData.addMatch).toHaveBeenCalledWith(fullMatch);
  });
});
