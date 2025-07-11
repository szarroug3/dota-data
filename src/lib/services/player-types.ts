import {
    OpenDotaPlayer,
    OpenDotaPlayerCounts,
    OpenDotaPlayerHero,
    OpenDotaPlayerMatch,
    OpenDotaPlayerRecentMatches,
    OpenDotaPlayerTotals,
    OpenDotaPlayerWL
} from '@/types/external-apis';

/**
 * Comprehensive processed player profile
 */
export interface ProcessedPlayer {
  profile: ProcessedPlayerProfile;
  statistics: ProcessedPlayerStatistics;
  performance: ProcessedPlayerPerformance;
  recentActivity: ProcessedPlayerRecentActivity;
  heroes: ProcessedPlayerHeroes;
  trends: ProcessedPlayerTrends;
  processed: {
    timestamp: string;
    version: string;
  };
}

/**
 * Processed player profile data
 */
export interface ProcessedPlayerProfile {
  accountId: number;
  steamId: string;
  personaName: string;
  realName?: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
  profileUrl: string;
  countryCode?: string;
  lastLogin?: string;
  status?: string;
  isPlusSubscriber: boolean;
  isContributor: boolean;
  isSubscriber: boolean;
  cheese: number;
  rankTier?: number;
  leaderboardRank?: number;
  mmrEstimate?: number;
  skillBracket: 'unknown' | 'normal' | 'high' | 'very_high';
}

/**
 * Processed player statistics
 */
export interface ProcessedPlayerStatistics {
  totalMatches: number;
  winRate: number;
  wins: number;
  losses: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageDuration: number;
  favoriteHeroes: Array<{
    heroId: number;
    games: number;
    winRate: number;
    avgKDA: number;
    lastPlayed: number;
  }>;
  gameModes: Array<{
    mode: string;
    games: number;
    winRate: number;
  }>;
  positions: Array<{
    position: string;
    games: number;
    winRate: number;
  }>;
}

/**
 * Processed player performance metrics
 */
export interface ProcessedPlayerPerformance {
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'professional';
  consistency: number; // 0-100
  versatility: number; // 0-100
  teamwork: number; // 0-100
  laning: number; // 0-100
  farming: number; // 0-100
  fighting: number; // 0-100
  supporting: number; // 0-100
  leadership: number; // 0-100
  improvement: number; // -100 to +100 (negative = declining, positive = improving)
  strengths: string[];
  weaknesses: string[];
}

/**
 * Processed recent activity
 */
export interface ProcessedPlayerRecentActivity {
  recentMatches: Array<{
    matchId: number;
    heroId: number;
    result: 'win' | 'loss';
    duration: number;
    startTime: number;
    kda: number;
    gpm: number;
    xpm: number;
    gameMode: string;
    lobbyType: string;
  }>;
  activityLevel: 'inactive' | 'low' | 'moderate' | 'high' | 'very_high';
  streaks: {
    currentWinStreak: number;
    currentLossStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
  };
  playTime: {
    hoursLast7Days: number;
    hoursLast30Days: number;
    avgSessionLength: number;
  };
}

/**
 * Processed hero data
 */
export interface ProcessedPlayerHeroes {
  totalHeroesPlayed: number;
  mostPlayedHeroes: Array<{
    heroId: number;
    games: number;
    winRate: number;
    avgKDA: number;
    avgGPM: number;
    avgXPM: number;
    lastPlayed: number;
    performance: number; // 0-100
  }>;
  bestPerformingHeroes: Array<{
    heroId: number;
    games: number;
    winRate: number;
    avgKDA: number;
    performance: number;
  }>;
  recentlyPlayedHeroes: Array<{
    heroId: number;
    games: number;
    winRate: number;
    lastPlayed: number;
  }>;
  heroRoles: {
    carry: { games: number; winRate: number; };
    support: { games: number; winRate: number; };
    initiator: { games: number; winRate: number; };
    nuker: { games: number; winRate: number; };
    disabler: { games: number; winRate: number; };
    jungler: { games: number; winRate: number; };
    durable: { games: number; winRate: number; };
    escape: { games: number; winRate: number; };
    pusher: { games: number; winRate: number; };
  };
}

/**
 * Processed player trends
 */
export interface ProcessedPlayerTrends {
  mmrTrend: 'improving' | 'stable' | 'declining';
  winRateTrend: 'improving' | 'stable' | 'declining';
  performanceTrend: 'improving' | 'stable' | 'declining';
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  predictions: {
    nextRankPrediction?: string;
    improvementAreas: string[];
    recommendedHeroes: number[];
  };
}

/**
 * Raw player data input for processing
 */
export interface RawPlayerData {
  profile: OpenDotaPlayer;
  matches?: OpenDotaPlayerMatch[];
  heroes?: OpenDotaPlayerHero[];
  counts?: Record<string, OpenDotaPlayerCounts[]>;
  totals?: OpenDotaPlayerTotals;
  winLoss?: OpenDotaPlayerWL;
  recentMatches?: OpenDotaPlayerRecentMatches[];
} 