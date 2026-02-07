import type { Hero, Item } from '@/frontend/lib/app-data-types';
import { processMatchData } from '@/frontend/lib/match-loader';
import type { OpenDotaMatch } from '@/types/external-apis';

jest.mock('@/lib/processing/match-processing/roles', () => ({
  detectTeamRoles: () => ({}),
}));

jest.mock('@/frontend/lib/match-events-processor', () => ({
  generateEvents: () => [],
  processGameEvents: () => [],
}));

describe('processMatchData', () => {
  it('does not warn when a player has hero_id 0', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const matchData = {
      match_id: 1,
      start_time: 0,
      duration: 0,
      radiant_win: true,
      radiant_score: 0,
      dire_score: 0,
      players: [
        {
          account_id: 186775996,
          player_slot: 0,
          hero_id: 0,
          isRadiant: true,
          item_0: 0,
          item_1: 0,
          item_2: 0,
          item_3: 0,
          item_4: 0,
          item_5: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          last_hits: 0,
          denies: 0,
          gold_per_min: 0,
          xp_per_min: 0,
          total_gold: 0,
          level: 1,
          hero_damage: 0,
          tower_damage: 0,
          hero_healing: 0,
          lane: 0,
        },
      ],
    } as OpenDotaMatch;

    const heroes = new Map<number, Hero>();
    const items = new Map<number, Item>();

    processMatchData(matchData, heroes, items);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
