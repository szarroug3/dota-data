import { OpenDotaHero } from '@/types/external-apis';

import {
    ProcessedHero,
    ProcessedHeroAttributes,
    ProcessedHeroMeta,
    ProcessedHeroPerformance,
    ProcessedHeroStatistics,
    ProcessedHeroTrends,
    RawHeroData
} from './hero-types';
import {
    assessCurrentMeta,
    calculateBanTrend,
    calculateFarmingEfficiency,
    calculateGrowthStats,
    calculateHeroTier,
    calculateMetaScore,
    calculateOptimalGameDuration,
    calculatePickTrend,
    calculatePopularityTrend,
    calculateProfessionalTrend,
    calculatePusherPotential,
    calculateRoleEffectiveness,
    calculateSkillCeiling,
    calculateSkillFloor,
    calculateSoloKillPotential,
    calculateTeamDependency,
    calculateTeamfightContribution,
    calculateWinRateTrend,
    determineComplexity,
    determineHeroStrengths,
    determineHeroWeaknesses,
    determineRecommendedFor,
    generatePatchNotes,
    generatePredictions,
    processHeroBuilds,
    processHeroMatchups,
    processProfessionalStats,
    processSkillBracketStats,
    processTurboStats,
    validateProcessedHero
} from './hero-utils';

// Re-export types for backward compatibility
export type {
    ProcessedHero,
    ProcessedHeroAttributes, ProcessedHeroBuilds, ProcessedHeroMatchups, ProcessedHeroMeta, ProcessedHeroPerformance, ProcessedHeroStatistics, ProcessedHeroTrends,
    RawHeroData
} from './hero-types';

// Re-export utility functions for backward compatibility
export {
    batchProcessHeroes,
    validateProcessedHero
} from './hero-utils';

/**
 * Validate raw hero data input
 */
function validateRawHeroData(rawData: RawHeroData): void {
  if (!rawData.hero) {
    throw new Error('Hero data is required');
  }

  if (typeof rawData.hero.id !== 'number') {
    throw new Error('Hero ID must be a number');
  }

  if (!rawData.hero.localized_name) {
    throw new Error('Hero name is required');
  }

  if (typeof rawData.totalHeroes !== 'number' || rawData.totalHeroes <= 0) {
    throw new Error('Total heroes must be a positive number');
  }
}

/**
 * Process hero attack damage stats
 */
function processAttackDamage(hero: OpenDotaHero): { min: number; max: number } {
  return {
    min: hero.base_attack_min || 20,
    max: hero.base_attack_max || 30
  };
}

/**
 * Process hero vision stats
 */
function processVisionStats(hero: OpenDotaHero): { day: number; night: number } {
  return {
    day: hero.day_vision || 1800,
    night: hero.night_vision || 800
  };
}

/**
 * Process hero base stats
 */
function processHeroBaseStats(hero: OpenDotaHero): ProcessedHeroAttributes['baseStats'] {
  return {
    health: hero.base_health || 500,
    mana: hero.base_mana || 300,
    armor: hero.base_armor || 0,
    attackDamage: processAttackDamage(hero),
    moveSpeed: hero.move_speed || 300,
    attackTime: hero.base_attack_time || 1.7,
    attackRange: hero.attack_range || 150,
    turnRate: hero.turn_rate || 0.5,
    vision: processVisionStats(hero),
    legs: hero.legs || 2
  };
}

/**
 * Process hero URLs
 */
function processHeroUrls(hero: OpenDotaHero): ProcessedHeroAttributes['urls'] {
  return {
    image: hero.img || '',
    icon: hero.icon || ''
  };
}

/**
 * Process hero attributes
 */
function processHeroAttributes(hero: OpenDotaHero): ProcessedHeroAttributes {
  return {
    primaryAttribute: hero.primary_attr as 'str' | 'agi' | 'int',
    attackType: hero.attack_type as 'Melee' | 'Ranged',
    roles: hero.roles || [],
    complexity: determineComplexity(hero),
    baseStats: processHeroBaseStats(hero),
    growth: calculateGrowthStats(),
    urls: processHeroUrls(hero)
  };
}

/**
 * Process hero statistics
 */
function processHeroStatistics(hero: OpenDotaHero, totalHeroes: number): ProcessedHeroStatistics {
  // Mock calculation based on hero data
  const totalPicks = Math.floor(Math.random() * 100000);
  const totalWins = Math.floor(totalPicks * (0.4 + Math.random() * 0.2));
  const globalWinRate = (totalWins / totalPicks) * 100;

  return {
    totalPicks,
    totalWins,
    globalWinRate,
    pickRate: (totalPicks / (totalHeroes * 1000)) * 100,
    banRate: Math.random() * 20,
    contestRate: Math.random() * 40,
    bySkillBracket: processSkillBracketStats(),
    professional: processProfessionalStats(),
    turbo: processTurboStats()
  };
}

/**
 * Process hero performance metrics
 */
function processHeroPerformance(hero: OpenDotaHero): ProcessedHeroPerformance {
  return {
    strengths: determineHeroStrengths(hero),
    weaknesses: determineHeroWeaknesses(hero),
    optimalGameDuration: calculateOptimalGameDuration(),
    roleEffectiveness: calculateRoleEffectiveness(hero),
    teamfightContribution: calculateTeamfightContribution(),
    farmingEfficiency: calculateFarmingEfficiency(hero),
    pusherPotential: calculatePusherPotential(hero),
    soloKillPotential: calculateSoloKillPotential(hero),
    teamDependency: calculateTeamDependency(hero),
    skillCeiling: calculateSkillCeiling(hero),
    skillFloor: calculateSkillFloor(hero)
  };
}

/**
 * Process hero meta information
 */
function processHeroMeta(hero: OpenDotaHero): ProcessedHeroMeta {
  return {
    tier: calculateHeroTier(hero),
    metaScore: calculateMetaScore(),
    popularityTrend: calculatePopularityTrend(),
    winRateTrend: calculateWinRateTrend(),
    patchNotes: generatePatchNotes(),
    recommendedFor: determineRecommendedFor(hero),
    currentMeta: assessCurrentMeta(hero)
  };
}

/**
 * Process hero trends
 */
function processHeroTrends(hero: OpenDotaHero): ProcessedHeroTrends {
  return {
    pickTrend: calculatePickTrend(),
    winRateTrend: calculateWinRateTrend(),
    banTrend: calculateBanTrend(),
    professionalTrend: calculateProfessionalTrend(),
    predictions: generatePredictions(hero)
  };
}

/**
 * Main function to process hero data
 * 
 * Transforms raw OpenDota hero data into processed hero data optimized for frontend consumption.
 * Includes validation, statistical analysis, performance metrics, and meta information.
 * 
 * @param rawData - Raw hero data from OpenDota API
 * @returns Processed hero data for frontend use
 */
export function processHero(rawData: RawHeroData): ProcessedHero {
  // Validate input data
  validateRawHeroData(rawData);

  const { hero, totalHeroes } = rawData;

  // Process all hero data sections
  const processedHero: ProcessedHero = {
    heroId: hero.id,
    name: hero.name || '',
    displayName: hero.localized_name || '',
    attributes: processHeroAttributes(hero),
    statistics: processHeroStatistics(hero, totalHeroes),
    performance: processHeroPerformance(hero),
    meta: processHeroMeta(hero),
    matchups: processHeroMatchups(),
    builds: processHeroBuilds(),
    trends: processHeroTrends(hero),
    processed: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  // Validate output
  if (!validateProcessedHero(processedHero)) {
    throw new Error('Failed to validate processed hero data');
  }

  return processedHero;
} 