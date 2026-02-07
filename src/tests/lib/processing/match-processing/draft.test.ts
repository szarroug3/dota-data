import type { Hero } from '@/frontend/lib/app-data-types';
import { convertDraftData, determinePickOrder } from '@/lib/processing/match-processing/draft';
import type { OpenDotaMatch } from '@/types/external-apis';

const baseMatch: OpenDotaMatch = {
  match_id: 1,
  start_time: 0,
  duration: 1,
  radiant_win: true,
  players: [],
  radiant_score: 0,
  dire_score: 0,
};

const heroById: Record<string, Hero> = {
  '1': {
    id: 1,
    name: 'npc_dota_hero_axe',
    localizedName: 'Axe',
    imageUrl: '/heroes/axe.png',
  },
  '2': {
    id: 2,
    name: 'npc_dota_hero_bane',
    localizedName: 'Bane',
    imageUrl: '/heroes/bane.png',
  },
};

describe('draft processing', () => {
  describe('determinePickOrder', () => {
    it('returns nulls when there is no draft', () => {
      const result = determinePickOrder(baseMatch);

      expect(result).toEqual({ radiant: null, dire: null });
    });

    it('returns the first pick team', () => {
      const matchWithDraft: OpenDotaMatch = {
        ...baseMatch,
        picks_bans: [
          { is_pick: false, hero_id: 2, team: 0, order: 0 },
          { is_pick: true, hero_id: 1, team: 1, order: 1 },
        ],
      };

      const result = determinePickOrder(matchWithDraft);

      expect(result).toEqual({ radiant: 'second', dire: 'first' });
    });
  });

  describe('convertDraftData', () => {
    it('maps picks and bans with pick order', () => {
      const matchWithDraft: OpenDotaMatch = {
        ...baseMatch,
        picks_bans: [
          { is_pick: true, hero_id: 1, team: 0, order: 0 },
          { is_pick: false, hero_id: 2, team: 1, order: 1 },
          { is_pick: true, hero_id: 2, team: 1, order: 2 },
        ],
      };

      const result = convertDraftData(matchWithDraft, heroById);

      expect(result.radiantPicks).toEqual([{ accountId: 0, hero: heroById['1'], order: 0 }]);
      expect(result.direPicks).toEqual([{ accountId: 0, hero: heroById['2'], order: 2 }]);
      expect(result.radiantBans).toEqual([]);
      expect(result.direBans).toEqual(['2']);
    });
  });
});
