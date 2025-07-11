import { OpenDotaHero } from '@/types/external-apis';

import {
    ProcessedHero,
    ProcessedHeroAttributes,
    ProcessedHeroBuilds,
    ProcessedHeroMatchups,
    ProcessedHeroMeta,
    ProcessedHeroPerformance,
    ProcessedHeroStatistics,
    ProcessedHeroTrends,
    RawHeroData
} from './hero-types';

/**
 * Determine hero complexity based on abilities and mechanics
 */
export function determineComplexity(hero: OpenDotaHero): ProcessedHeroAttributes['complexity'] {
  // Simplified complexity calculation based on hero name/id
  // In a real implementation, this would analyze abilities, cooldowns, etc.
  const complexHeroes = ['Invoker', 'Meepo', 'Chen', 'Visage', 'Lone Druid'];
  const moderateHeroes = ['Anti-Mage', 'Pudge', 'Crystal Maiden', 'Drow Ranger'];
  
  if (complexHeroes.some(name => hero.localized_name?.includes(name))) {
    return 'very_complex';
  }
  if (moderateHeroes.some(name => hero.localized_name?.includes(name))) {
    return 'moderate';
  }
  return 'simple';
}

/**
 * Calculate growth statistics per level
 */
export function calculateGrowthStats(): ProcessedHeroAttributes['growth'] {
  // Mock implementation - would calculate from hero data
  return {
    healthPerLevel: 20 + Math.random() * 10,
    manaPerLevel: 15 + Math.random() * 8,
    damagePerLevel: 2 + Math.random() * 3,
  };
}

/**
 * Process skill bracket statistics
 */
export function processSkillBracketStats(): ProcessedHeroStatistics['bySkillBracket'] {
  // Mock implementation - would use real statistical data
  const brackets = ['herald', 'guardian', 'crusader', 'archon', 'legend', 'ancient', 'divine', 'immortal'] as const;
  const stats: Record<string, { picks: number; wins: number; winRate: number }> = {};
  
  brackets.forEach(bracket => {
    const picks = Math.floor(Math.random() * 10000);
    const wins = Math.floor(picks * (0.4 + Math.random() * 0.2));
    stats[bracket] = {
      picks,
      wins,
      winRate: wins / picks * 100
    };
  });
  
  return stats as ProcessedHeroStatistics['bySkillBracket'];
}

/**
 * Process professional scene statistics
 */
export function processProfessionalStats(): ProcessedHeroStatistics['professional'] {
  const picks = Math.floor(Math.random() * 500);
  const wins = Math.floor(picks * (0.4 + Math.random() * 0.2));
  
  return {
    picks,
    wins,
    winRate: wins / picks * 100,
    banRate: Math.random() * 30,
    contestRate: Math.random() * 60,
    averageGameDuration: 35 + Math.random() * 20
  };
}

/**
 * Process turbo mode statistics
 */
export function processTurboStats(): ProcessedHeroStatistics['turbo'] {
  const picks = Math.floor(Math.random() * 5000);
  const wins = Math.floor(picks * (0.4 + Math.random() * 0.2));
  
  return {
    picks,
    wins,
    winRate: wins / picks * 100
  };
}

/**
 * Determine hero strengths based on abilities and stats
 */
export function determineHeroStrengths(hero: OpenDotaHero): string[] {
  const strengths = ['High damage output', 'Strong crowd control', 'Good mobility'];
  
  // Mock logic based on hero attributes
  if (hero.primary_attr === 'str') {
    strengths.push('High survivability');
  }
  if (hero.attack_type === 'Ranged') {
    strengths.push('Safe laning');
  }
  
  return strengths.slice(0, 3);
}

/**
 * Determine hero weaknesses
 */
export function determineHeroWeaknesses(hero: OpenDotaHero): string[] {
  const weaknesses = ['Vulnerable to ganks', 'Weak early game', 'Item dependent'];
  
  // Mock logic
  if (hero.primary_attr === 'agi') {
    weaknesses.push('Low health pool');
  }
  if (hero.attack_type === 'Melee') {
    weaknesses.push('Limited range');
  }
  
  return weaknesses.slice(0, 3);
}

/**
 * Calculate optimal game duration performance
 */
export function calculateOptimalGameDuration(): ProcessedHeroPerformance['optimalGameDuration'] {
  return {
    early: 40 + Math.random() * 30,
    mid: 50 + Math.random() * 30,
    late: 60 + Math.random() * 30
  };
}

/**
 * Calculate role effectiveness ratings
 */
export function calculateRoleEffectiveness(hero: OpenDotaHero): ProcessedHeroPerformance['roleEffectiveness'] {
  const base = Math.random() * 50;
  
  return {
    carry: hero.primary_attr === 'agi' ? base + 30 : base,
    mid: base + Math.random() * 20,
    offlane: hero.primary_attr === 'str' ? base + 25 : base,
    support: hero.primary_attr === 'int' ? base + 30 : base,
    hardSupport: hero.primary_attr === 'int' ? base + 25 : base
  };
}

/**
 * Calculate teamfight contribution metrics
 */
export function calculateTeamfightContribution(): ProcessedHeroPerformance['teamfightContribution'] {
  return {
    damage: Math.random() * 100,
    control: Math.random() * 100,
    utility: Math.random() * 100,
    tankiness: Math.random() * 100,
    mobility: Math.random() * 100
  };
}

/**
 * Calculate farming efficiency rating
 */
export function calculateFarmingEfficiency(hero: OpenDotaHero): number {
  // Mock calculation based on hero type
  if (hero.roles?.includes('Carry')) {
    return 60 + Math.random() * 30;
  }
  return 20 + Math.random() * 40;
}

/**
 * Calculate pusher potential rating
 */
export function calculatePusherPotential(hero: OpenDotaHero): number {
  if (hero.roles?.includes('Pusher')) {
    return 70 + Math.random() * 30;
  }
  return 30 + Math.random() * 40;
}

/**
 * Calculate solo kill potential
 */
export function calculateSoloKillPotential(hero: OpenDotaHero): number {
  if (hero.roles?.includes('Nuker') || hero.roles?.includes('Carry')) {
    return 60 + Math.random() * 30;
  }
  return 20 + Math.random() * 50;
}

/**
 * Calculate team dependency rating
 */
export function calculateTeamDependency(hero: OpenDotaHero): number {
  if (hero.roles?.includes('Support')) {
    return 70 + Math.random() * 20;
  }
  return 30 + Math.random() * 40;
}

/**
 * Calculate skill ceiling rating
 */
export function calculateSkillCeiling(hero: OpenDotaHero): number {
  const complexity = determineComplexity(hero);
  
  switch (complexity) {
    case 'very_complex': return 80 + Math.random() * 20;
    case 'complex': return 60 + Math.random() * 25;
    case 'moderate': return 40 + Math.random() * 30;
    default: return 20 + Math.random() * 30;
  }
}

/**
 * Calculate skill floor rating
 */
export function calculateSkillFloor(hero: OpenDotaHero): number {
  const complexity = determineComplexity(hero);
  
  switch (complexity) {
    case 'very_complex': return 60 + Math.random() * 20;
    case 'complex': return 40 + Math.random() * 25;
    case 'moderate': return 25 + Math.random() * 30;
    default: return 10 + Math.random() * 25;
  }
}

/**
 * Calculate hero tier ranking
 */
export function calculateHeroTier(hero: OpenDotaHero): ProcessedHeroMeta['tier'] {
  // Use hero ID to generate consistent tier (mock implementation)
  const heroBasedValue = (hero.id % 100) + 40; // 40-139 range, normalized to 40-80
  const winRate = Math.min(80, heroBasedValue);
  
  if (winRate > 70) return 'S';
  if (winRate > 60) return 'A';
  if (winRate > 50) return 'B';
  if (winRate > 40) return 'C';
  return 'D';
}

/**
 * Calculate meta score
 */
export function calculateMetaScore(): number {
  return Math.random() * 100;
}

/**
 * Calculate popularity trend
 */
export function calculatePopularityTrend(): ProcessedHeroMeta['popularityTrend'] {
  const trends: ProcessedHeroMeta['popularityTrend'][] = ['rising', 'stable', 'falling'];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Calculate win rate trend
 */
export function calculateWinRateTrend(): ProcessedHeroMeta['winRateTrend'] {
  const trends: ProcessedHeroMeta['winRateTrend'][] = ['improving', 'stable', 'declining'];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Generate patch notes for hero
 */
export function generatePatchNotes(): ProcessedHeroMeta['patchNotes'] {
  return [
    {
      patch: '7.33',
      changes: ['Base damage increased', 'Movement speed reduced'],
      impact: 'minor_buff' as const
    }
  ];
}

/**
 * Determine recommended skill levels
 */
export function determineRecommendedFor(hero: OpenDotaHero): ProcessedHeroMeta['recommendedFor'] {
  const complexity = determineComplexity(hero);
  
  return {
    beginners: complexity === 'simple',
    intermediate: complexity === 'simple' || complexity === 'moderate',
    advanced: true,
    professional: complexity === 'complex' || complexity === 'very_complex'
  };
}

/**
 * Assess current meta position
 */
export function assessCurrentMeta(hero: OpenDotaHero): ProcessedHeroMeta['currentMeta'] {
  const tier = calculateHeroTier(hero);
  const isViable = tier === 'S' || tier === 'A' || tier === 'B';
  
  return {
    isViable,
    metaRank: Math.floor(Math.random() * 120) + 1,
    reasonsForViability: isViable ? ['Strong in current meta', 'Fits popular strategies'] : [],
    reasonsAgainstViability: !isViable ? ['Weak against meta picks', 'Requires specific team composition'] : []
  };
}

/**
 * Calculate pick trend
 */
export function calculatePickTrend(): ProcessedHeroTrends['pickTrend'] {
  const trends: ProcessedHeroTrends['pickTrend'][] = ['increasing', 'stable', 'decreasing'];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Calculate ban trend  
 */
export function calculateBanTrend(): ProcessedHeroTrends['banTrend'] {
  const trends: ProcessedHeroTrends['banTrend'][] = ['increasing', 'stable', 'decreasing'];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Calculate professional scene trend
 */
export function calculateProfessionalTrend(): ProcessedHeroTrends['professionalTrend'] {
  const trends: ProcessedHeroTrends['professionalTrend'][] = ['rising', 'stable', 'falling'];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Generate predictions for hero
 */
export function generatePredictions(hero: OpenDotaHero): ProcessedHeroTrends['predictions'] {
  const tier = calculateHeroTier(hero);
  
  return {
    nextPatchImpact: 'neutral',
    metaForecast: tier === 'S' || tier === 'A' ? 'stable' : 'rising',
    recommendedAction: tier === 'S' || tier === 'A' ? 'learn' : 'monitor'
  };
}

/**
 * Process hero matchups (mock implementation)
 */
export function processHeroMatchups(): ProcessedHeroMatchups {
  return {
    strongAgainst: [
      {
        heroId: 1,
        winRate: 65,
        games: 100,
        advantage: 15,
        reason: 'Ability counters enemy strengths'
      }
    ],
    weakAgainst: [
      {
        heroId: 2,
        winRate: 35,
        games: 100,
        disadvantage: 15,
        reason: 'Vulnerable to enemy abilities'
      }
    ],
    synergizes: [
      {
        heroId: 3,
        winRate: 70,
        games: 50,
        synergy: 20,
        reason: 'Abilities complement each other'
      }
    ],
    struggles: [
      {
        heroId: 4,
        winRate: 30,
        games: 50,
        struggle: 20,
        reason: 'Poor teamwork potential'
      }
    ],
    neutralMatchups: [
      {
        heroId: 5,
        winRate: 50,
        games: 75
      }
    ]
  };
}

/**
 * Process hero builds (mock implementation)
 */
export function processHeroBuilds(): ProcessedHeroBuilds {
  return {
    popularBuilds: [
      {
        name: 'Standard Build',
        winRate: 60,
        popularity: 75,
        items: {
          starting: [1, 2, 3],
          early: [4, 5, 6],
          core: [7, 8, 9],
          luxury: [10, 11, 12],
          situational: [13, 14, 15]
        },
        skillBuild: [1, 2, 1, 3, 1, 4, 1, 2, 2, 2, 4],
        gameStage: 'all'
      }
    ],
    itemRecommendations: {
      startingItems: [
        {
          itemId: 1,
          winRate: 55,
          popularity: 90,
          situational: false
        }
      ],
      coreItems: [
        {
          itemId: 7,
          winRate: 65,
          popularity: 80,
          timing: 15
        }
      ],
      luxuryItems: [
        {
          itemId: 10,
          winRate: 70,
          popularity: 40,
          timing: 35
        }
      ],
      situationalItems: [
        {
          itemId: 13,
          winRate: 60,
          popularity: 25,
          situation: 'Against heavy magic damage'
        }
      ]
    },
    skillProgression: {
      maxFirst: [1, 2, 3, 4],
      popularProgression: [1, 2, 1, 3, 1, 4, 1, 2, 2, 2, 4],
      alternatives: [
        {
          name: 'Early Game Focus',
          skills: [2, 1, 2, 3, 2, 4, 2, 1, 1, 1, 4],
          winRate: 58,
          popularity: 30,
          situation: 'Against weak early game enemies'
        }
      ]
    }
  };
}

/**
 * Batch process multiple heroes
 */
export function batchProcessHeroes(rawDataArray: RawHeroData[]): Array<ProcessedHero | { error: string; heroId?: number }> {
  return rawDataArray.map(rawData => {
    try {
      // This would call the main processHero function
      return {
        heroId: rawData.hero.id,
        error: 'Processing not implemented in utils'
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        heroId: rawData?.hero?.id
      };
    }
  });
}

/**
 * Validate processed hero data
 */
export function validateProcessedHero(processedHero: ProcessedHero): boolean {
  if (!processedHero.heroId || !processedHero.name) {
    return false;
  }
  
  if (!processedHero.attributes || !processedHero.statistics) {
    return false;
  }
  
  if (!processedHero.performance || !processedHero.meta) {
    return false;
  }
  
  return true;
} 