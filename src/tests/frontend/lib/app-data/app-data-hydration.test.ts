import type React from 'react';

import { AppData } from '@/frontend/lib/app-data/app-data';
import { GLOBAL_TEAM_KEY } from '@/frontend/lib/app-data/app-data-types';

const TEAMS_STORAGE_KEY = 'dota-scout-assistant-teams';
const ACTIVE_TEAM_STORAGE_KEY = 'dota-scout-assistant-active-team';

describe('AppData.loadFromStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('hydrates teams, matches, players, and selects the stored active team', async () => {
    const teamKey = '123-456';

    window.localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify({
        [teamKey]: {
          team: { id: 123, name: 'Radiant Reborn' },
          league: { id: 456, name: 'Ancient League' },
          timeAdded: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          matches: {
            1111: {
              matchId: 1111,
              result: 'won',
              opponentName: 'Dire Dynasty',
              side: 'radiant',
              duration: 2500,
              date: '2024-01-02T00:00:00.000Z',
              pickOrder: 'first',
              heroes: [
                {
                  id: 1,
                  name: 'npc_dota_hero_1',
                  localizedName: 'Anti-Mage',
                  imageUrl: 'anti-mage.png',
                },
              ],
              isManual: false,
              isHidden: false,
            },
          },
          players: {
            42: {
              accountId: 42,
              name: 'Invoker Main',
              rank: 'Divine 2',
              rank_tier: 72,
              leaderboard_rank: 1500,
              games: 100,
              winRate: 55,
              topHeroes: [
                {
                  id: 74,
                  name: 'npc_dota_hero_74',
                  localizedName: 'Invoker',
                  imageUrl: 'invoker.png',
                },
              ],
              avatar: 'invoker.jpg',
              isManual: false,
              isHidden: false,
            },
          },
        },
      }),
    );

    window.localStorage.setItem(
      ACTIVE_TEAM_STORAGE_KEY,
      JSON.stringify({
        teamId: 123,
        leagueId: 456,
      }),
    );

    const appData = new AppData();

    const teamsState: Array<Map<string, unknown>> = [];
    const matchesState: Array<Map<number, unknown>> = [];
    const playersState: Array<Map<number, unknown>> = [];

    const applySetState = <T>(list: Array<T>, initial: T) => {
      return (next: React.SetStateAction<T>) => {
        if (typeof next === 'function') {
          const updater = next as (prev: T) => T;
          const value = list.length > 0 ? list[list.length - 1] : initial;
          const updated = updater(value);
          list.push(updated);
          return;
        }
        list.push(next);
      };
    };

    appData.setTeamsStateFn(applySetState(teamsState, new Map()));
    appData.setMatchesStateFn(applySetState(matchesState, new Map()));
    appData.setPlayersStateFn(applySetState(playersState, new Map()));

    const result = await appData.loadFromStorage();

    expect(result.activeTeam).toEqual({
      teamKey,
      teamId: 123,
      leagueId: 456,
    });

    expect(result.otherTeams).toEqual([]);
    expect(appData.state.selectedTeamId).toBe(teamKey);

    const hydratedTeam = appData.getTeam(teamKey);
    expect(hydratedTeam).toBeDefined();
    expect(hydratedTeam?.matches.has(1111)).toBe(true);
    expect(hydratedTeam?.players.has(42)).toBe(true);

    const placeholderMatch = appData.matches.get(1111);
    expect(placeholderMatch?.id).toBe(1111);

    const placeholderPlayer = appData.players.get(42);
    expect(placeholderPlayer?.accountId).toBe(42);
    expect(placeholderPlayer?.profile.personaname).toBe('Invoker Main');

    expect(teamsState.at(-1)?.has(teamKey)).toBe(true);
    expect(matchesState.at(-1)?.has(1111)).toBe(true);
    expect(playersState.at(-1)?.has(42)).toBe(true);

    const globalTeam = appData.getTeam(GLOBAL_TEAM_KEY);
    expect(globalTeam).toBeDefined();
  });

  it('clears matches and players before hydrating again', async () => {
    const firstTeamKey = '111-222';
    const secondTeamKey = '333-444';

    window.localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify({
        [firstTeamKey]: {
          team: { id: 111, name: 'First Team' },
          league: { id: 222, name: 'First League' },
          timeAdded: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          matches: {
            1111: {
              matchId: 1111,
              result: 'won',
              opponentName: 'Old Opponent',
              side: 'radiant',
              duration: 1800,
              date: '2024-01-02T00:00:00.000Z',
              pickOrder: 'first',
              heroes: [],
              isManual: false,
              isHidden: false,
            },
          },
          players: {
            42: {
              accountId: 42,
              name: 'Old Player',
              rank: 'Legend 1',
              rank_tier: 41,
              leaderboard_rank: 0,
              games: 10,
              winRate: 60,
              topHeroes: [],
              avatar: 'old.png',
              isManual: false,
              isHidden: false,
            },
          },
        },
      }),
    );

    window.localStorage.setItem(
      ACTIVE_TEAM_STORAGE_KEY,
      JSON.stringify({
        teamId: 111,
        leagueId: 222,
      }),
    );

    const appData = new AppData();
    await appData.loadFromStorage();

    expect(appData.matches.has(1111)).toBe(true);
    expect(appData.players.has(42)).toBe(true);

    window.localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify({
        [secondTeamKey]: {
          team: { id: 333, name: 'Second Team' },
          league: { id: 444, name: 'Second League' },
          timeAdded: new Date('2024-02-01T00:00:00.000Z').toISOString(),
          matches: {
            2222: {
              matchId: 2222,
              result: 'lost',
              opponentName: 'New Opponent',
              side: 'dire',
              duration: 2000,
              date: '2024-02-02T00:00:00.000Z',
              pickOrder: 'second',
              heroes: [],
              isManual: false,
              isHidden: false,
            },
          },
          players: {
            99: {
              accountId: 99,
              name: 'New Player',
              rank: 'Ancient 3',
              rank_tier: 63,
              leaderboard_rank: 0,
              games: 20,
              winRate: 45,
              topHeroes: [],
              avatar: 'new.png',
              isManual: false,
              isHidden: false,
            },
          },
        },
      }),
    );

    window.localStorage.setItem(
      ACTIVE_TEAM_STORAGE_KEY,
      JSON.stringify({
        teamId: 333,
        leagueId: 444,
      }),
    );

    await appData.loadFromStorage();

    expect(appData.matches.has(1111)).toBe(false);
    expect(appData.players.has(42)).toBe(false);
    expect(appData.matches.has(2222)).toBe(true);
    expect(appData.players.has(99)).toBe(true);
  });
});

describe('AppData.loadFromSharePayload', () => {
  const createStoredTeamData = ({
    teamId,
    leagueId,
    teamName,
    leagueName,
    matchId,
    playerId,
  }: {
    teamId: number;
    leagueId: number;
    teamName: string;
    leagueName: string;
    matchId: number;
    playerId: number;
  }) => ({
    team: { id: teamId, name: teamName },
    league: { id: leagueId, name: leagueName },
    timeAdded: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    matches: {
      [matchId]: {
        matchId,
        result: 'won',
        opponentName: 'Opponent',
        side: 'radiant',
        duration: 2000,
        date: '2024-01-02T00:00:00.000Z',
        pickOrder: 'first',
        heroes: [],
        isManual: false,
        isHidden: false,
      },
    },
    players: {
      [playerId]: {
        accountId: playerId,
        name: `Player ${playerId}`,
        rank: 'Legend 1',
        rank_tier: 41,
        leaderboard_rank: 0,
        games: 10,
        winRate: 60,
        topHeroes: [],
        avatar: 'avatar.png',
        isManual: false,
        isHidden: false,
      },
    },
  });

  it('clears matches and players before loading a new share payload', async () => {
    const appData = new AppData();

    await appData.loadFromSharePayload({
      teams: {
        '111-222': createStoredTeamData({
          teamId: 111,
          leagueId: 222,
          teamName: 'First Team',
          leagueName: 'First League',
          matchId: 1111,
          playerId: 42,
        }),
      },
      activeTeam: { teamId: 111, leagueId: 222 },
    });

    expect(appData.matches.has(1111)).toBe(true);
    expect(appData.players.has(42)).toBe(true);

    await appData.loadFromSharePayload({
      teams: {
        '333-444': createStoredTeamData({
          teamId: 333,
          leagueId: 444,
          teamName: 'Second Team',
          leagueName: 'Second League',
          matchId: 2222,
          playerId: 99,
        }),
      },
      activeTeam: { teamId: 333, leagueId: 444 },
    });

    expect(appData.matches.has(1111)).toBe(false);
    expect(appData.players.has(42)).toBe(false);
    expect(appData.matches.has(2222)).toBe(true);
    expect(appData.players.has(99)).toBe(true);
  });
});
