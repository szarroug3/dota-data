import {
    createHeroLookupMap,
    createHeroNameLookupMap,
    filterCaptainsModeHeroes,
    filterHeroesByAttackType,
    filterHeroesByAttribute,
    filterHeroesByRole,
    findHeroById,
    findHeroByLocalizedName,
    findHeroByName,
    getAllPrimaryAttributes,
    getAllRoles,
    getHeroStatistics,
    heroToDisplayFormat,
    searchHeroesByName,
    sortHeroesByName,
    sortHeroesByPickRate,
    sortHeroesByWinRate
} from '@/lib/api/services/hero-utils';
import { OpenDotaHero } from '@/types/external-apis';

describe('Hero Utils', () => {
  const mockHeroes: OpenDotaHero[] = [
    {
      id: 1,
      name: 'npc_dota_hero_antimage',
      localized_name: 'Anti-Mage',
      primary_attr: 'agi',
      attack_type: 'Melee',
      roles: ['Carry', 'Escape', 'Nuker'],
      img: '/antimage_full.png',
      icon: '/antimage_icon.png',
      base_health: 200,
      base_mana: 75,
      base_armor: 0,
      base_attack_min: 29,
      base_attack_max: 33,
      move_speed: 310,
      base_attack_time: 1.4,
      attack_point: 0.3,
      attack_range: 150,
      projectile_speed: 0,
      turn_rate: 0.6,
      cm_enabled: true,
      legs: 2,
      day_vision: 1800,
      night_vision: 800,
      hero_id: 1,
      turbo_picks: 100,
      turbo_wins: 60,
      pro_ban: 10,
      pro_win: 8,
      pro_pick: 10,
      "1_pick": 0,
      "1_win": 0,
      "2_pick": 0,
      "2_win": 0,
      "3_pick": 0,
      "3_win": 0,
      "4_pick": 0,
      "4_win": 0,
      "5_pick": 0,
      "5_win": 0,
      "6_pick": 0,
      "6_win": 0,
      "7_pick": 0,
      "7_win": 0,
      "8_pick": 0,
      "8_win": 0,
      null_pick: 0,
      null_win: 0,
    },
    {
      id: 2,
      name: 'npc_dota_hero_axe',
      localized_name: 'Axe',
      primary_attr: 'str',
      attack_type: 'Melee',
      roles: ['Initiator', 'Durable', 'Disabler'],
      img: '/axe_full.png',
      icon: '/axe_icon.png',
      base_health: 220,
      base_mana: 50,
      base_armor: 1,
      base_attack_min: 27,
      base_attack_max: 31,
      move_speed: 310,
      base_attack_time: 1.7,
      attack_point: 0.5,
      attack_range: 150,
      projectile_speed: 0,
      turn_rate: 0.6,
      cm_enabled: false,
      legs: 2,
      day_vision: 1800,
      night_vision: 800,
      hero_id: 2,
      turbo_picks: 80,
      turbo_wins: 40,
      pro_ban: 5,
      pro_win: 3,
      pro_pick: 5,
      "1_pick": 0,
      "1_win": 0,
      "2_pick": 0,
      "2_win": 0,
      "3_pick": 0,
      "3_win": 0,
      "4_pick": 0,
      "4_win": 0,
      "5_pick": 0,
      "5_win": 0,
      "6_pick": 0,
      "6_win": 0,
      "7_pick": 0,
      "7_win": 0,
      "8_pick": 0,
      "8_win": 0,
      null_pick: 0,
      null_win: 0,
    },
    {
      id: 3,
      name: 'npc_dota_hero_crystal_maiden',
      localized_name: 'Crystal Maiden',
      primary_attr: 'int',
      attack_type: 'Ranged',
      roles: ['Support', 'Disabler', 'Nuker'],
      img: '/crystal_maiden_full.png',
      icon: '/crystal_maiden_icon.png',
      base_health: 160,
      base_mana: 100,
      base_armor: -1,
      base_attack_min: 17,
      base_attack_max: 21,
      move_speed: 280,
      base_attack_time: 1.7,
      attack_point: 0.56,
      attack_range: 600,
      projectile_speed: 900,
      turn_rate: 0.5,
      cm_enabled: true,
      legs: 2,
      day_vision: 1800,
      night_vision: 800,
      hero_id: 3,
      turbo_picks: 120,
      turbo_wins: 72,
      pro_ban: 15,
      pro_win: 12,
      pro_pick: 20,
      "1_pick": 0,
      "1_win": 0,
      "2_pick": 0,
      "2_win": 0,
      "3_pick": 0,
      "3_win": 0,
      "4_pick": 0,
      "4_win": 0,
      "5_pick": 0,
      "5_win": 0,
      "6_pick": 0,
      "6_win": 0,
      "7_pick": 0,
      "7_win": 0,
      "8_pick": 0,
      "8_win": 0,
      null_pick: 0,
      null_win: 0,
    },
  ];

  describe('findHeroById', () => {
    it('should find hero by ID', () => {
      const result = findHeroById(mockHeroes, 1);
      expect(result).toBe(mockHeroes[0]);
    });

    it('should return null for non-existent ID', () => {
      const result = findHeroById(mockHeroes, 999);
      expect(result).toBeNull();
    });
  });

  describe('findHeroByName', () => {
    it('should find hero by internal name', () => {
      const result = findHeroByName(mockHeroes, 'npc_dota_hero_axe');
      expect(result).toBe(mockHeroes[1]);
    });

    it('should return null for non-existent name', () => {
      const result = findHeroByName(mockHeroes, 'non_existent_hero');
      expect(result).toBeNull();
    });
  });

  describe('findHeroByLocalizedName', () => {
    it('should find hero by localized name', () => {
      const result = findHeroByLocalizedName(mockHeroes, 'Crystal Maiden');
      expect(result).toBe(mockHeroes[2]);
    });

    it('should return null for non-existent localized name', () => {
      const result = findHeroByLocalizedName(mockHeroes, 'Non-existent Hero');
      expect(result).toBeNull();
    });
  });

  describe('filterHeroesByAttribute', () => {
    it('should filter heroes by strength attribute', () => {
      const result = filterHeroesByAttribute(mockHeroes, 'str');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[1]);
    });

    it('should filter heroes by agility attribute', () => {
      const result = filterHeroesByAttribute(mockHeroes, 'agi');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[0]);
    });

    it('should filter heroes by intelligence attribute', () => {
      const result = filterHeroesByAttribute(mockHeroes, 'int');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[2]);
    });

    it('should return empty array for non-existent attribute', () => {
      const result = filterHeroesByAttribute(mockHeroes, 'non_existent');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterHeroesByAttackType', () => {
    it('should filter heroes by melee attack type', () => {
      const result = filterHeroesByAttackType(mockHeroes, 'Melee');
      expect(result).toHaveLength(2);
      expect(result).toContain(mockHeroes[0]);
      expect(result).toContain(mockHeroes[1]);
    });

    it('should filter heroes by ranged attack type', () => {
      const result = filterHeroesByAttackType(mockHeroes, 'Ranged');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[2]);
    });
  });

  describe('filterHeroesByRole', () => {
    it('should filter heroes by Support role', () => {
      const result = filterHeroesByRole(mockHeroes, 'Support');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[2]);
    });

    it('should filter heroes by Carry role', () => {
      const result = filterHeroesByRole(mockHeroes, 'Carry');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[0]);
    });

    it('should return empty array for non-existent role', () => {
      const result = filterHeroesByRole(mockHeroes, 'Non-existent Role');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterCaptainsModeHeroes', () => {
    it('should filter heroes enabled in Captain\'s Mode', () => {
      const result = filterCaptainsModeHeroes(mockHeroes);
      expect(result).toHaveLength(2);
      expect(result).toContain(mockHeroes[0]);
      expect(result).toContain(mockHeroes[2]);
    });
  });

  describe('getAllRoles', () => {
    it('should get all unique roles sorted', () => {
      const result = getAllRoles(mockHeroes);
      expect(result).toEqual(['Carry', 'Disabler', 'Durable', 'Escape', 'Initiator', 'Nuker', 'Support']);
    });
  });

  describe('getAllPrimaryAttributes', () => {
    it('should get all unique primary attributes sorted', () => {
      const result = getAllPrimaryAttributes(mockHeroes);
      expect(result).toEqual(['agi', 'int', 'str']);
    });
  });

  describe('searchHeroesByName', () => {
    it('should search heroes by localized name (case insensitive)', () => {
      const result = searchHeroesByName(mockHeroes, 'crystal');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[2]);
    });

    it('should search heroes by internal name (case insensitive)', () => {
      const result = searchHeroesByName(mockHeroes, 'antimage');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockHeroes[0]);
    });

    it('should search heroes case sensitive', () => {
      const result = searchHeroesByName(mockHeroes, 'CRYSTAL', true);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for non-matching query', () => {
      const result = searchHeroesByName(mockHeroes, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortHeroesByName', () => {
    it('should sort heroes by name ascending', () => {
      const result = sortHeroesByName(mockHeroes);
      expect(result[0].localized_name).toBe('Anti-Mage');
      expect(result[1].localized_name).toBe('Axe');
      expect(result[2].localized_name).toBe('Crystal Maiden');
    });

    it('should sort heroes by name descending', () => {
      const result = sortHeroesByName(mockHeroes, false);
      expect(result[0].localized_name).toBe('Crystal Maiden');
      expect(result[1].localized_name).toBe('Axe');
      expect(result[2].localized_name).toBe('Anti-Mage');
    });
  });

  describe('sortHeroesByWinRate', () => {
    it('should sort heroes by win rate descending', () => {
      const result = sortHeroesByWinRate(mockHeroes);
      expect(result[0]).toBe(mockHeroes[0]); // Anti-Mage: 8/10 = 0.8
      expect(result[1]).toBe(mockHeroes[1]); // Axe: 3/5 = 0.6
      expect(result[2]).toBe(mockHeroes[2]); // Crystal Maiden: 12/20 = 0.6
    });

    it('should sort heroes by win rate ascending', () => {
      const result = sortHeroesByWinRate(mockHeroes, true);
      expect(result[2]).toBe(mockHeroes[0]); // Highest win rate last
    });
  });

  describe('sortHeroesByPickRate', () => {
    it('should sort heroes by pick rate descending', () => {
      const result = sortHeroesByPickRate(mockHeroes);
      expect(result[0]).toBe(mockHeroes[2]); // Crystal Maiden: 20 picks
      expect(result[1]).toBe(mockHeroes[0]); // Anti-Mage: 10 picks
      expect(result[2]).toBe(mockHeroes[1]); // Axe: 5 picks
    });

    it('should sort heroes by pick rate ascending', () => {
      const result = sortHeroesByPickRate(mockHeroes, true);
      expect(result[0]).toBe(mockHeroes[1]); // Axe: 5 picks (lowest)
      expect(result[2]).toBe(mockHeroes[2]); // Crystal Maiden: 20 picks (highest)
    });
  });

  describe('getHeroStatistics', () => {
    it('should return correct hero statistics', () => {
      const result = getHeroStatistics(mockHeroes);
      expect(result).toEqual({
        totalHeroes: 3,
        strengthHeroes: 1,
        agilityHeroes: 1,
        intelligenceHeroes: 1,
        meleeHeroes: 2,
        rangedHeroes: 1,
        captainsModeHeroes: 2,
        uniqueRoles: ['Carry', 'Disabler', 'Durable', 'Escape', 'Initiator', 'Nuker', 'Support']
      });
    });
  });

  describe('heroToDisplayFormat', () => {
    it('should convert hero to display format', () => {
      const result = heroToDisplayFormat(mockHeroes[0]);
      expect(result).toEqual({
        id: 1,
        name: 'npc_dota_hero_antimage',
        displayName: 'Anti-Mage',
        attribute: 'agi',
        attackType: 'Melee',
        roles: ['Carry', 'Escape', 'Nuker'],
        image: '/antimage_full.png',
        icon: '/antimage_icon.png',
        isEnabled: true,
        winRate: 0.8,
        pickRate: 10
      });
    });

    it('should handle heroes with no pro picks', () => {
      const heroWithNoPicks = { ...mockHeroes[0], pro_pick: 0, pro_win: 0 };
      const result = heroToDisplayFormat(heroWithNoPicks);
      expect(result.winRate).toBe(0);
      expect(result.pickRate).toBe(0);
    });
  });

  describe('createHeroLookupMap', () => {
    it('should create a lookup map by hero ID', () => {
      const result = createHeroLookupMap(mockHeroes);
      expect(result.size).toBe(3);
      expect(result.get(1)).toBe(mockHeroes[0]);
      expect(result.get(2)).toBe(mockHeroes[1]);
      expect(result.get(3)).toBe(mockHeroes[2]);
    });
  });

  describe('createHeroNameLookupMap', () => {
    it('should create a lookup map by hero name', () => {
      const result = createHeroNameLookupMap(mockHeroes);
      expect(result.size).toBe(3);
      expect(result.get('npc_dota_hero_antimage')).toBe(mockHeroes[0]);
      expect(result.get('npc_dota_hero_axe')).toBe(mockHeroes[1]);
      expect(result.get('npc_dota_hero_crystal_maiden')).toBe(mockHeroes[2]);
    });
  });
}); 