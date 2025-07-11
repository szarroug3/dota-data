/**
 * Processed hero data optimized for frontend consumption
 */
export interface ProcessedHero {
  heroId: number;
  name: string;
  displayName: string;
  attributes: ProcessedHeroAttributes;
  statistics: ProcessedHeroStatistics;
  performance: ProcessedHeroPerformance;
  meta: ProcessedHeroMeta;
  matchups: ProcessedHeroMatchups;
  builds: ProcessedHeroBuilds;
  trends: ProcessedHeroTrends;
  processed: {
    timestamp: string;
    version: string;
  };
}

/**
 * Processed hero attributes and basic information
 */
export interface ProcessedHeroAttributes {
  primaryAttribute: 'str' | 'agi' | 'int';
  attackType: 'Melee' | 'Ranged';
  roles: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  baseStats: {
    health: number;
    mana: number;
    armor: number;
    attackDamage: {
      min: number;
      max: number;
    };
    moveSpeed: number;
    attackTime: number;
    attackRange: number;
    turnRate: number;
    vision: {
      day: number;
      night: number;
    };
    legs: number;
  };
  growth: {
    healthPerLevel: number;
    manaPerLevel: number;
    damagePerLevel: number;
  };
  urls: {
    image: string;
    icon: string;
  };
}

/**
 * Processed hero statistics
 */
export interface ProcessedHeroStatistics {
  totalPicks: number;
  totalWins: number;
  globalWinRate: number;
  pickRate: number;
  banRate: number;
  contestRate: number; // pick rate + ban rate
  bySkillBracket: {
    herald: { picks: number; wins: number; winRate: number; };
    guardian: { picks: number; wins: number; winRate: number; };
    crusader: { picks: number; wins: number; winRate: number; };
    archon: { picks: number; wins: number; winRate: number; };
    legend: { picks: number; wins: number; winRate: number; };
    ancient: { picks: number; wins: number; winRate: number; };
    divine: { picks: number; wins: number; winRate: number; };
    immortal: { picks: number; wins: number; winRate: number; };
  };
  professional: {
    picks: number;
    wins: number;
    winRate: number;
    banRate: number;
    contestRate: number;
    averageGameDuration: number;
  };
  turbo: {
    picks: number;
    wins: number;
    winRate: number;
  };
}

/**
 * Processed hero performance metrics
 */
export interface ProcessedHeroPerformance {
  strengths: string[];
  weaknesses: string[];
  optimalGameDuration: {
    early: number; // 0-20 minutes
    mid: number; // 20-40 minutes
    late: number; // 40+ minutes
  };
  roleEffectiveness: {
    carry: number; // 0-100
    mid: number; // 0-100
    offlane: number; // 0-100
    support: number; // 0-100
    hardSupport: number; // 0-100
  };
  teamfightContribution: {
    damage: number; // 0-100
    control: number; // 0-100
    utility: number; // 0-100
    tankiness: number; // 0-100
    mobility: number; // 0-100
  };
  farmingEfficiency: number; // 0-100
  pusherPotential: number; // 0-100
  soloKillPotential: number; // 0-100
  teamDependency: number; // 0-100 (higher = more team dependent)
  skillCeiling: number; // 0-100
  skillFloor: number; // 0-100
}

/**
 * Processed hero meta information
 */
export interface ProcessedHeroMeta {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  metaScore: number; // 0-100
  popularityTrend: 'rising' | 'stable' | 'falling';
  winRateTrend: 'improving' | 'stable' | 'declining';
  patchNotes: Array<{
    patch: string;
    changes: string[];
    impact: 'major_buff' | 'minor_buff' | 'neutral' | 'minor_nerf' | 'major_nerf';
  }>;
  recommendedFor: {
    beginners: boolean;
    intermediate: boolean;
    advanced: boolean;
    professional: boolean;
  };
  currentMeta: {
    isViable: boolean;
    metaRank: number; // 1-130+ (hero rank in current meta)
    reasonsForViability: string[];
    reasonsAgainstViability: string[];
  };
}

/**
 * Processed hero matchups
 */
export interface ProcessedHeroMatchups {
  strongAgainst: Array<{
    heroId: number;
    winRate: number;
    games: number;
    advantage: number; // percentage points above average
    reason: string;
  }>;
  weakAgainst: Array<{
    heroId: number;
    winRate: number;
    games: number;
    disadvantage: number; // percentage points below average
    reason: string;
  }>;
  synergizes: Array<{
    heroId: number;
    winRate: number;
    games: number;
    synergy: number; // percentage points above average
    reason: string;
  }>;
  struggles: Array<{
    heroId: number;
    winRate: number;
    games: number;
    struggle: number; // percentage points below average
    reason: string;
  }>;
  neutralMatchups: Array<{
    heroId: number;
    winRate: number;
    games: number;
  }>;
}

/**
 * Processed hero builds and items
 */
export interface ProcessedHeroBuilds {
  popularBuilds: Array<{
    name: string;
    winRate: number;
    popularity: number;
    items: {
      starting: number[];
      early: number[];
      core: number[];
      luxury: number[];
      situational: number[];
    };
    skillBuild: number[];
    gameStage: 'early' | 'mid' | 'late' | 'all';
  }>;
  itemRecommendations: {
    startingItems: Array<{
      itemId: number;
      winRate: number;
      popularity: number;
      situational: boolean;
    }>;
    coreItems: Array<{
      itemId: number;
      winRate: number;
      popularity: number;
      timing: number; // average minute purchased
    }>;
    luxuryItems: Array<{
      itemId: number;
      winRate: number;
      popularity: number;
      timing: number;
    }>;
    situationalItems: Array<{
      itemId: number;
      winRate: number;
      popularity: number;
      situation: string;
    }>;
  };
  skillProgression: {
    maxFirst: number[]; // skill IDs in order of max priority
    popularProgression: number[]; // most common skill build
    alternatives: Array<{
      name: string;
      skills: number[];
      winRate: number;
      popularity: number;
      situation: string;
    }>;
  };
}

/**
 * Processed hero trends and predictions
 */
export interface ProcessedHeroTrends {
  pickTrend: 'increasing' | 'stable' | 'decreasing';
  winRateTrend: 'improving' | 'stable' | 'declining';
  banTrend: 'increasing' | 'stable' | 'decreasing';
  professionalTrend: 'rising' | 'stable' | 'falling';
  predictions: {
    nextPatchImpact: 'major_buff' | 'minor_buff' | 'neutral' | 'minor_nerf' | 'major_nerf';
    metaForecast: 'rising' | 'stable' | 'falling';
    recommendedAction: 'learn' | 'master' | 'avoid' | 'monitor';
  };
}

/**
 * Raw hero data input for processing
 */
export interface RawHeroData {
  hero: import('@/types/external-apis').OpenDotaHero;
  totalHeroes: number;
  gameVersion?: string;
  patchDate?: string;
} 