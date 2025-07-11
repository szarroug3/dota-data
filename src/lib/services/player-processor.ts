import { OpenDotaPlayer } from '@/types/external-apis';

import { ProcessedPlayer, ProcessedPlayerHeroes, ProcessedPlayerPerformance, ProcessedPlayerProfile, ProcessedPlayerRecentActivity, ProcessedPlayerStatistics, ProcessedPlayerTrends, RawPlayerData } from './player-types';
import { calculateActivityTrend, calculateAverageDuration, calculateAverageGPM, calculateAverageKDA, calculateAverageXPM, calculateConsistency, calculateFarmingScore, calculateFightingScore, calculateImprovementScore, calculateLaningScore, calculateLeadershipScore, calculateMMRTrend, calculatePerformanceTrend, calculatePlayTime, calculateStreaks, calculateSupportingScore, calculateTeamwork, calculateVersatility, calculateWinRateTrend, determineActivityLevel, determineSkillBracket, determineSkillLevel, determineStrengths, determineWeaknesses, estimateMMR, generatePredictions, processBestPerformingHeroes, processFavoriteHeroes, processGameModes, processHeroRoles, processMostPlayedHeroes, processPositions, processRecentlyPlayedHeroes, processRecentMatches } from './player-utils';

// Re-export types for external use
export type {
    ProcessedPlayer, ProcessedPlayerHeroes, ProcessedPlayerPerformance, ProcessedPlayerProfile, ProcessedPlayerRecentActivity, ProcessedPlayerStatistics, ProcessedPlayerTrends,
    RawPlayerData
} from './player-types';

/**
 * Processes raw player data into structured format optimized for frontend consumption
 * @param rawData Raw player data from OpenDota API
 * @returns Processed player data with analytics and insights
 */
export function processPlayer(rawData: RawPlayerData): ProcessedPlayer {
  try {
    validateRawPlayerData(rawData);
    
    const profile = processPlayerProfile(rawData.profile);
    const statistics = processPlayerStatistics(rawData);
    const performance = processPlayerPerformance(rawData);
    const recentActivity = processPlayerRecentActivity(rawData);
    const heroes = processPlayerHeroes(rawData);
    const trends = processPlayerTrends(rawData);
    
    return {
      profile,
      statistics,
      performance,
      recentActivity,
      heroes,
      trends,
      processed: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  } catch (error) {
    throw new Error(`Failed to process player data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates raw player data
 * @param rawData Raw player data to validate
 * @throws Error if validation fails
 */
function validateRawPlayerData(rawData: RawPlayerData): void {
  if (!rawData) {
    throw new Error('Player data is null or undefined');
  }

  if (!rawData.profile || !rawData.profile.profile) {
    throw new Error('Invalid player profile data');
  }

  if (!rawData.profile.profile.account_id || typeof rawData.profile.profile.account_id !== 'number') {
    throw new Error('Invalid account ID');
  }

  if (!rawData.profile.profile.steamid || typeof rawData.profile.profile.steamid !== 'string') {
    throw new Error('Invalid Steam ID');
  }

  if (!rawData.profile.profile.personaname || typeof rawData.profile.profile.personaname !== 'string') {
    throw new Error('Invalid persona name');
  }
}

/**
 * Processes player profile data
 * @param playerProfile Raw player profile data
 * @returns Processed player profile
 */
function processPlayerProfile(playerProfile: OpenDotaPlayer): ProcessedPlayerProfile {
  const profile = playerProfile.profile;
  
  const skillBracket = determineSkillBracket(playerProfile.rank_tier);
  const mmrEstimate = estimateMMR(playerProfile.rank_tier, playerProfile.leaderboard_rank);

  return {
    accountId: profile.account_id,
    steamId: profile.steamid,
    personaName: profile.personaname,
    realName: profile.name || undefined,
    avatar: profile.avatar,
    avatarMedium: profile.avatarmedium,
    avatarFull: profile.avatarfull,
    profileUrl: profile.profileurl,
    countryCode: profile.loccountrycode || undefined,
    lastLogin: profile.last_login || undefined,
    status: profile.status || undefined,
    isPlusSubscriber: profile.plus,
    isContributor: profile.is_contributor,
    isSubscriber: profile.is_subscriber,
    cheese: profile.cheese,
    rankTier: playerProfile.rank_tier,
    leaderboardRank: playerProfile.leaderboard_rank,
    mmrEstimate,
    skillBracket,
  };
}

/**
 * Calculate basic win/loss statistics
 */
function calculateWinLossStats(rawData: RawPlayerData): { totalMatches: number; winRate: number; wins: number; losses: number } {
  const winLoss = rawData.winLoss || { win: 0, lose: 0 };
  const totalMatches = winLoss.win + winLoss.lose;
  const winRate = totalMatches > 0 ? (winLoss.win / totalMatches) * 100 : 0;

  return {
    totalMatches,
    winRate: Math.round(winRate * 100) / 100,
    wins: winLoss.win,
    losses: winLoss.lose,
  };
}

/**
 * Calculate match performance averages
 */
function calculateMatchAverages(rawData: RawPlayerData): { averageKDA: number; averageGPM: number; averageXPM: number; averageDuration: number } {
  const matches = rawData.matches || [];
  
  return {
    averageKDA: calculateAverageKDA(matches),
    averageGPM: calculateAverageGPM(matches),
    averageXPM: calculateAverageXPM(matches),
    averageDuration: calculateAverageDuration(matches),
  };
}

/**
 * Processes player statistics
 * @param rawData Raw player data
 * @returns Processed player statistics
 */
function processPlayerStatistics(rawData: RawPlayerData): ProcessedPlayerStatistics {
  const winLossStats = calculateWinLossStats(rawData);
  const matchAverages = calculateMatchAverages(rawData);
  
  // Process favorite heroes
  const favoriteHeroes = processFavoriteHeroes(rawData.heroes || []);
  
  // Process game modes
      const gameModes = processGameModes();
  
  // Process positions
      const positions = processPositions();

  return {
    ...winLossStats,
    ...matchAverages,
    favoriteHeroes,
    gameModes,
    positions,
  };
}

/**
 * Calculate core performance metrics
 */
function calculateCorePerformanceMetrics(rawData: RawPlayerData): {
  skillLevel: ProcessedPlayerPerformance['skillLevel'];
  consistency: number;
  versatility: number;
  teamwork: number;
} {
  const rankTier = rawData.profile.rank_tier || 0;
  const skillLevel = determineSkillLevel(rankTier);
  const consistency = calculateConsistency(rawData.matches || []);
  const versatility = calculateVersatility(rawData.heroes || []);
  const teamwork = calculateTeamwork(rawData.matches || []);

  return { skillLevel, consistency, versatility, teamwork };
}

/**
 * Calculate gameplay performance scores
 */
function calculateGameplayScores(rawData: RawPlayerData): {
  laning: number;
  farming: number;
  fighting: number;
  supporting: number;
  leadership: number;
  improvement: number;
} {
  const matches = rawData.matches || [];
  
  return {
    laning: calculateLaningScore(matches),
    farming: calculateFarmingScore(matches),
    fighting: calculateFightingScore(matches),
    supporting: calculateSupportingScore(matches),
    leadership: calculateLeadershipScore(matches),
    improvement: calculateImprovementScore(matches),
  };
}

/**
 * Processes player performance metrics
 * @param rawData Raw player data
 * @returns Processed player performance
 */
function processPlayerPerformance(rawData: RawPlayerData): ProcessedPlayerPerformance {
  const coreMetrics = calculateCorePerformanceMetrics(rawData);
  const gameplayScores = calculateGameplayScores(rawData);

  // Extract only numeric scores for strength/weakness analysis
  const numericScores = {
    consistency: coreMetrics.consistency,
    versatility: coreMetrics.versatility,
    teamwork: coreMetrics.teamwork,
    ...gameplayScores,
  };
  
  const strengths = determineStrengths(numericScores);
  const weaknesses = determineWeaknesses(numericScores);

  return {
    ...coreMetrics,
    ...gameplayScores,
    strengths,
    weaknesses,
  };
}

/**
 * Processes player recent activity
 * @param rawData Raw player data
 * @returns Processed recent activity
 */
function processPlayerRecentActivity(rawData: RawPlayerData): ProcessedPlayerRecentActivity {
  const recentMatches = processRecentMatches(rawData.recentMatches || []);
  const activityLevel = determineActivityLevel(recentMatches);
  const streaks = calculateStreaks(recentMatches);
  const playTime = calculatePlayTime(recentMatches);

  return {
    recentMatches,
    activityLevel,
    streaks,
    playTime,
  };
}

/**
 * Processes player heroes data
 * @param rawData Raw player data
 * @returns Processed player heroes
 */
function processPlayerHeroes(rawData: RawPlayerData): ProcessedPlayerHeroes {
  const heroes = rawData.heroes || [];
  const totalHeroesPlayed = heroes.length;
  
  const mostPlayedHeroes = processMostPlayedHeroes(heroes);
  const bestPerformingHeroes = processBestPerformingHeroes(heroes);
  const recentlyPlayedHeroes = processRecentlyPlayedHeroes(heroes);
  const heroRoles = processHeroRoles();

  return {
    totalHeroesPlayed,
    mostPlayedHeroes,
    bestPerformingHeroes,
    recentlyPlayedHeroes,
    heroRoles,
  };
}

/**
 * Processes player trends
 * @param rawData Raw player data
 * @returns Processed player trends
 */
function processPlayerTrends(rawData: RawPlayerData): ProcessedPlayerTrends {
  const matches = rawData.matches || [];
  
  const mmrTrend = calculateMMRTrend(matches);
  const winRateTrend = calculateWinRateTrend(matches);
  const performanceTrend = calculatePerformanceTrend(matches);
  const activityTrend = calculateActivityTrend(matches);
  
  const predictions = generatePredictions(rawData);

  return {
    mmrTrend,
    winRateTrend,
    performanceTrend,
    activityTrend,
    predictions,
  };
}

/**
 * Batch processes multiple players
 * @param rawDataArray Array of raw player data
 * @returns Array of processed players with error handling
 */
export function batchProcessPlayers(rawDataArray: RawPlayerData[]): Array<ProcessedPlayer | { error: string; accountId?: number }> {
  return rawDataArray.map(rawData => {
    try {
      return processPlayer(rawData);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: rawData?.profile?.profile?.account_id,
      };
    }
  });
}

/**
 * Validates processed player data
 * @param processedPlayer Processed player data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateProcessedPlayer(processedPlayer: ProcessedPlayer): boolean {
  if (!processedPlayer.profile.accountId || typeof processedPlayer.profile.accountId !== 'number') {
    throw new Error('Invalid processed player account ID');
  }
  
  if (!processedPlayer.profile.steamId || typeof processedPlayer.profile.steamId !== 'string') {
    throw new Error('Invalid processed player Steam ID');
  }
  
  if (!processedPlayer.statistics) {
    throw new Error('Missing player statistics');
  }
  
  if (!processedPlayer.performance) {
    throw new Error('Missing player performance metrics');
  }
  
  if (!processedPlayer.processed.timestamp) {
    throw new Error('Missing processing timestamp');
  }
  
  return true;
} 