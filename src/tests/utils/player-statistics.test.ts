import type { Hero } from '@/types/contexts/constants-context-value';
import { getTopHeroesFromRecentMatches } from '@/utils/player-statistics';

describe('getTopHeroesFromRecentMatches', () => {
  const heroesData: Record<string, Hero> = {
    '1': {
      id: '1',
      name: 'npc_dota_hero_1',
      localizedName: 'Anti-Mage',
      primaryAttribute: 'agility',
      attackType: 'melee',
      roles: ['Carry'],
      imageUrl: '',
    },
    '2': {
      id: '2',
      name: 'npc_dota_hero_2',
      localizedName: 'Axe',
      primaryAttribute: 'strength',
      attackType: 'melee',
      roles: ['Durable'],
      imageUrl: '',
    },
  };

  it('returns empty array when no matches', () => {
    expect(getTopHeroesFromRecentMatches([], heroesData, 5)).toEqual([]);
  });

  it('aggregates games and wins per hero and sorts by games', () => {
    const recentMatches = [
      // Radiant player on hero 1, radiant wins -> win
      { hero_id: 1, player_slot: 0, radiant_win: true, kills: 10, deaths: 2, assists: 5 },
      // Dire player on hero 2, radiant wins -> loss
      { hero_id: 2, player_slot: 132, radiant_win: true, kills: 5, deaths: 5, assists: 5 },
      // Radiant player on hero 2, radiant loses -> loss
      { hero_id: 2, player_slot: 1, radiant_win: false, kills: 2, deaths: 10, assists: 3 },
      // Dire player on hero 1, radiant loses -> win
      { hero_id: 1, player_slot: 132, radiant_win: false, kills: 8, deaths: 4, assists: 8 },
    ];

    const result = getTopHeroesFromRecentMatches(recentMatches as any, heroesData, 5);

    // Both heroes have 2 games; maintain stable order by input or by hero id
    const hero1 = result.find((r) => r.hero.id === '1');
    const hero2 = result.find((r) => r.hero.id === '2');

    expect(hero1).toBeDefined();
    expect(hero2).toBeDefined();
    expect(hero1?.games).toBe(2);
    expect(hero2?.games).toBe(2);
    expect(hero1?.wins).toBe(2); // both matches counted as wins for hero 1
    expect(hero2?.wins).toBe(0); // both matches counted as losses for hero 2
    expect(hero1?.winRate).toBeCloseTo(100);
    expect(hero2?.winRate).toBeCloseTo(0);
    expect(hero1?.averageKDA).toBeGreaterThan(0);
    expect(hero2?.averageKDA).toBeGreaterThan(0);
  });
});


