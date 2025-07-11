import { processHero } from '@/lib/services/hero-processor';
import { ProcessedHero, RawHeroData } from '@/lib/services/hero-types';
import { batchProcessHeroes, validateProcessedHero } from '@/lib/services/hero-utils';
import { OpenDotaHero } from '@/types/external-apis';

describe('Hero Processor', () => {
  let mockRawHeroData: RawHeroData;
  let mockOpenDotaHero: OpenDotaHero;

  beforeEach(() => {
    mockOpenDotaHero = {
      id: 1,
      name: 'npc_dota_hero_antimage',
      localized_name: 'Anti-Mage',
      primary_attr: 'agi',
      attack_type: 'Melee',
      roles: ['Carry', 'Escape', 'Nuker'],
      legs: 2,
      base_health: 200,
      img: '/images/heroes/antimage.png',
      icon: '/images/heroes/antimage_icon.png',
      base_attack_time: 1.4,
      attack_point: 0.3,
      day_vision: 1800,
      night_vision: 800,
      base_mana: 75,
      base_armor: 0,
      base_attack_min: 29,
      base_attack_max: 33,
      attack_range: 150,
      projectile_speed: 0,
      move_speed: 310,
      turn_rate: 0.65,
      cm_enabled: true,
      hero_id: 1,
      turbo_picks: 12500,
      turbo_wins: 6800,
      pro_pick: 45,
      pro_win: 28,
      pro_ban: 120,
      '1_pick': 8500,
      '1_win': 4400,
      '2_pick': 9200,
      '2_win': 4800,
      '3_pick': 10500,
      '3_win': 5500,
      '4_pick': 11200,
      '4_win': 5900,
      '5_pick': 12000,
      '5_win': 6400,
      '6_pick': 11800,
      '6_win': 6200,
      '7_pick': 10800,
      '7_win': 5700,
      '8_pick': 9500,
      '8_win': 5000,
      null_pick: 1000,
      null_win: 500
    };

    mockRawHeroData = {
      hero: mockOpenDotaHero,
      totalHeroes: 130
    };
  });

  describe('processHero', () => {
    it('should process a valid hero successfully', () => {
      const result = processHero(mockRawHeroData);

      expect(result).toBeDefined();
      expect(result.heroId).toBe(1);
      expect(result.name).toBe('npc_dota_hero_antimage');
      expect(result.displayName).toBe('Anti-Mage');
      expect(result.attributes.primaryAttribute).toBe('agi');
      expect(result.attributes.attackType).toBe('Melee');
      expect(result.attributes.roles).toEqual(['Carry', 'Escape', 'Nuker']);
      expect(result.processed.timestamp).toBeDefined();
      expect(result.processed.version).toBe('1.0.0');
    });

    it('should calculate hero attributes correctly', () => {
      const result = processHero(mockRawHeroData);

      expect(result.attributes.baseStats.health).toBe(200);
      expect(result.attributes.baseStats.mana).toBe(75);
      expect(result.attributes.baseStats.armor).toBe(0);
      expect(result.attributes.baseStats.attackDamage.min).toBe(29);
      expect(result.attributes.baseStats.attackDamage.max).toBe(33);
      expect(result.attributes.baseStats.attackRange).toBe(150);
      expect(result.attributes.baseStats.moveSpeed).toBe(310);
      expect(result.attributes.baseStats.turnRate).toBe(0.65);
      expect(result.attributes.baseStats.attackTime).toBe(1.4);
    });

    it('should calculate statistics correctly', () => {
      const result = processHero(mockRawHeroData);

      expect(result.statistics.totalPicks).toBeGreaterThan(0);
      expect(result.statistics.totalWins).toBeGreaterThan(0);
      expect(result.statistics.globalWinRate).toBeGreaterThan(0);
      expect(result.statistics.pickRate).toBeGreaterThan(0);
      expect(result.statistics.banRate).toBeGreaterThan(0);
      expect(result.statistics.contestRate).toBeGreaterThan(0);
      expect(result.statistics.bySkillBracket).toBeDefined();
      expect(result.statistics.professional).toBeDefined();
      expect(result.statistics.turbo).toBeDefined();
    });

    it('should calculate performance metrics correctly', () => {
      const result = processHero(mockRawHeroData);

      expect(result.performance.strengths).toBeDefined();
      expect(Array.isArray(result.performance.strengths)).toBe(true);
      expect(result.performance.weaknesses).toBeDefined();
      expect(Array.isArray(result.performance.weaknesses)).toBe(true);
      expect(result.performance.roleEffectiveness).toBeDefined();
      expect(result.performance.roleEffectiveness.carry).toBeGreaterThanOrEqual(0);
      expect(result.performance.roleEffectiveness.carry).toBeLessThanOrEqual(100);
    });

    it('should process meta information correctly', () => {
      const result = processHero(mockRawHeroData);

      expect(result.meta.tier).toBeDefined();
      expect(['S', 'A', 'B', 'C', 'D']).toContain(result.meta.tier);
      expect(result.meta.metaScore).toBeGreaterThanOrEqual(0);
      expect(result.meta.metaScore).toBeLessThanOrEqual(100);
    });

    it('should process matchups correctly', () => {
      const result = processHero(mockRawHeroData);

      expect(result.matchups.strongAgainst).toBeDefined();
      expect(Array.isArray(result.matchups.strongAgainst)).toBe(true);
      expect(result.matchups.weakAgainst).toBeDefined();
      expect(Array.isArray(result.matchups.weakAgainst)).toBe(true);
    });

    it('should process builds correctly', () => {
      const result = processHero(mockRawHeroData);

      expect(result.builds.popularBuilds).toBeDefined();
      expect(Array.isArray(result.builds.popularBuilds)).toBe(true);
      expect(result.builds.itemRecommendations).toBeDefined();
    });

    it('should validate processed hero', () => {
      const result = processHero(mockRawHeroData);
      expect(validateProcessedHero(result)).toBe(true);
    });
  });

  describe('batchProcessHeroes', () => {
    it('should process multiple heroes', () => {
      const heroData = [mockRawHeroData, mockRawHeroData];
      const results = batchProcessHeroes(heroData);

      expect(results).toHaveLength(2);
      expect(results[0]).toBeDefined();
      expect((results[0] as ProcessedHero).heroId).toBe(1);
    });

    it('should handle errors gracefully', () => {
      const invalidData = [{ hero: null, totalHeroes: 0 } as any];
      const results = batchProcessHeroes(invalidData);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('error');
    });
  });
}); 