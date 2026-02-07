/**
 * Tests for app-data-loading-ops
 */

import { loadTeamMatches } from '@/frontend/lib/app-data-loading-ops';
import type { AppDataLoadingOpsContext } from '@/frontend/lib/app-data-loading-ops';
import type { LeagueMatchesCache, Match, Player, Team } from '@/frontend/lib/app-data-types';
import type { StoredMatchData } from '@/frontend/lib/storage-manager';

const minimalHero = {
  id: 1,
  name: 'npc_dota_hero_antimage',
  localizedName: 'Anti-Mage',
  imageUrl: '/heroes/antimage.png',
};

function createPlaceholderPlayerMatchData(accountId: number): Match['players']['radiant'][0] {
  return {
    accountId,
    playerName: `Player ${accountId}`,
    hero: minimalHero,
    stats: {
      kills: 0,
      deaths: 0,
      assists: 0,
      lastHits: 0,
      denies: 0,
      gpm: 0,
      xpm: 0,
      netWorth: 0,
      level: 0,
    },
    items: [],
    heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 },
  };
}

/** Placeholder match as created from storage: one side has players with accountId 0 */
function createPlaceholderMatch(matchId: number): Match {
  const placeholderPlayers = [1, 2, 3, 4, 5].map(() => createPlaceholderPlayerMatchData(0));
  return {
    id: matchId,
    date: new Date().toISOString(),
    duration: 1800,
    radiant: { name: 'Radiant' },
    dire: { name: 'Dire' },
    draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
    players: {
      radiant: placeholderPlayers,
      dire: [],
    },
    statistics: {
      radiantScore: 1,
      direScore: 0,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
    },
    events: [],
    result: 'radiant',
  };
}

/** Fully loaded match with real account IDs */
function createFullyLoadedMatch(matchId: number): Match {
  const radiantPlayers = [10001, 10002, 10003, 10004, 10005].map((id) => createPlaceholderPlayerMatchData(id));
  const direPlayers = [20001, 20002, 20003, 20004, 20005].map((id) => createPlaceholderPlayerMatchData(id));
  return {
    ...createPlaceholderMatch(matchId),
    players: {
      radiant: radiantPlayers,
      dire: direPlayers,
    },
  };
}

function createStoredMatchData(matchId: number, side: 'radiant' | 'dire'): StoredMatchData {
  return {
    matchId,
    result: 'won',
    opponentName: 'Opponent',
    side,
    duration: 1800,
    date: new Date().toISOString(),
    pickOrder: 'first',
    heroes: [],
    isManual: false,
    isHidden: false,
  };
}

function createMockTeam(teamKey: string, teamId: number, leagueId: number, matchIds: number[]): Team {
  const now = Date.now();
  const matches = new Map<number, StoredMatchData>();
  matchIds.forEach((id) => matches.set(id, createStoredMatchData(id, 'radiant')));
  return {
    id: teamKey,
    teamId,
    leagueId,
    name: `Team ${teamId}`,
    leagueName: `League ${leagueId}`,
    timeAdded: now,
    matches,
    players: new Map(),
    createdAt: now,
    updatedAt: now,
    isLoading: false,
    highPerformingHeroes: new Set(),
  };
}

describe('app-data-loading-ops', () => {
  describe('loadTeamMatches', () => {
    it('treats placeholder matches (accountId 0) as incomplete and triggers loadMatch', async () => {
      const matchId = 60000;
      const teamKey = '100-200';
      const teamId = 100;
      const leagueId = 200;

      const loadMatchCalls: number[] = [];
      const loadPlayerCalls: number[] = [];

      const team = createMockTeam(teamKey, teamId, leagueId, [matchId]);
      const teamsMap = new Map<string, Team>([[teamKey, team]]);
      const placeholderMatch = createPlaceholderMatch(matchId);
      const matchesMap = new Map<number, Match>([[matchId, placeholderMatch]]);
      const leagueCache: LeagueMatchesCache = {
        matches: new Map(),
        matchIdsByTeam: new Map([[teamId, [matchId]]]),
        fetchedAt: Date.now(),
      };
      const leagueMatchesCache = new Map<number, LeagueMatchesCache>([[leagueId, leagueCache]]);

      const appData: AppDataLoadingOpsContext = {
        _matches: matchesMap,
        _teams: teamsMap,
        leagueMatchesCache,
        getTeam: (key: string) => teamsMap.get(key),
        loadMatch: async (id: number) => {
          loadMatchCalls.push(id);
          return placeholderMatch;
        },
        loadPlayer: async (accountId: number) => {
          loadPlayerCalls.push(accountId);
          return null as unknown as Player;
        },
        updateTeamMatchParticipation: jest.fn(),
      };

      await loadTeamMatches(appData, teamKey, false);

      expect(loadMatchCalls).toContain(matchId);
      expect(appData.updateTeamMatchParticipation).toHaveBeenCalledWith(teamKey, [matchId]);
    });

    it('does not trigger loadMatch for fully loaded matches when force is false', async () => {
      const matchId = 60001;
      const teamKey = '101-201';
      const teamId = 101;
      const leagueId = 201;

      const loadMatchCalls: number[] = [];

      const team = createMockTeam(teamKey, teamId, leagueId, [matchId]);
      const teamsMap = new Map<string, Team>([[teamKey, team]]);
      const fullMatch = createFullyLoadedMatch(matchId);
      const matchesMap = new Map<number, Match>([[matchId, fullMatch]]);
      const leagueCache: LeagueMatchesCache = {
        matches: new Map(),
        matchIdsByTeam: new Map([[teamId, [matchId]]]),
        fetchedAt: Date.now(),
      };
      const leagueMatchesCache = new Map<number, LeagueMatchesCache>([[leagueId, leagueCache]]);

      const appData: AppDataLoadingOpsContext = {
        _matches: matchesMap,
        _teams: teamsMap,
        leagueMatchesCache,
        getTeam: (key: string) => teamsMap.get(key),
        loadMatch: async (id: number) => {
          loadMatchCalls.push(id);
          return fullMatch;
        },
        loadPlayer: async () => null as unknown as Player,
        updateTeamMatchParticipation: jest.fn(),
      };

      await loadTeamMatches(appData, teamKey, false);

      expect(loadMatchCalls).not.toContain(matchId);
      expect(appData.updateTeamMatchParticipation).toHaveBeenCalledWith(teamKey, [matchId]);
    });

    it('triggers loadMatch for all matches when force is true', async () => {
      const matchId = 60002;
      const teamKey = '102-202';
      const teamId = 102;
      const leagueId = 202;

      const loadMatchCalls: number[] = [];

      const team = createMockTeam(teamKey, teamId, leagueId, [matchId]);
      const teamsMap = new Map<string, Team>([[teamKey, team]]);
      const fullMatch = createFullyLoadedMatch(matchId);
      const matchesMap = new Map<number, Match>([[matchId, fullMatch]]);
      const leagueCache: LeagueMatchesCache = {
        matches: new Map(),
        matchIdsByTeam: new Map([[teamId, [matchId]]]),
        fetchedAt: Date.now(),
      };
      const leagueMatchesCache = new Map<number, LeagueMatchesCache>([[leagueId, leagueCache]]);

      const appData: AppDataLoadingOpsContext = {
        _matches: matchesMap,
        _teams: teamsMap,
        leagueMatchesCache,
        getTeam: (key: string) => teamsMap.get(key),
        loadMatch: async (id: number) => {
          loadMatchCalls.push(id);
          return fullMatch;
        },
        loadPlayer: async () => null as unknown as Player,
        updateTeamMatchParticipation: jest.fn(),
      };

      await loadTeamMatches(appData, teamKey, true);

      expect(loadMatchCalls).toContain(matchId);
    });
  });
});
