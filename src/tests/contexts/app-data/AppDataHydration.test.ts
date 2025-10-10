import type React from 'react';

import { AppData } from '@/frontend/lib/app-data';
import { GLOBAL_TEAM_KEY } from '@/frontend/lib/app-data-types';

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
});
