import {
    ProcessedTeam,
    ProcessedTeamAchievements,
    ProcessedTeamMatches,
    ProcessedTeamPerformance,
    ProcessedTeamProfile,
    ProcessedTeamRoster,
    ProcessedTeamStatistics,
    RawTeamData
} from './team-types';
import {
    calculateAdaptability,
    calculateAverageMatchDuration,
    calculateAveragePlayerTenure,
    calculateClutchFactor,
    calculateFormFactor,
    calculateLaning,
    calculateLateGame,
    calculateMidGame,
    calculatePlayStyle,
    calculateRatingFromMatches,
    calculateRosterStability,
    calculateTeamConsistency,
    calculateTeamImprovement,
    calculateTeamStreaks,
    calculateTeamVersatility,
    calculateTeamwork,
    categorizeGames,
    determinePlayerRole,
    determineRegion,
    determineSkillLevel,
    determineTeamStrengths,
    determineTeamWeaknesses,
    extractMatchesFromDotabuff,
    extractTagFromName,
    extractTeamFromDotabuff,
    getLastMatchTime,
    processHeadToHead,
    processRecentMatches,
    processTournamentPerformance,
    processUpcomingMatches
} from './team-utils';

/**
 * Processes raw team data from external APIs into processed team data
 * @param rawData Raw team data from external APIs
 * @returns Processed team data optimized for frontend consumption
 */
export function processTeam(rawData: RawTeamData): ProcessedTeam {
  // Validate input data
  validateRawTeamData(rawData);

  // Extract team data from different sources
  const openDotaTeam = rawData.openDotaTeam || extractTeamFromDotabuff(rawData.dotabuffTeam);
  
  if (!openDotaTeam) {
    throw new Error('No valid team data found');
  }

  // Add teamId to team data
  const teamData = {
    ...openDotaTeam,
    team_id: rawData.teamId,
  };

  // Process each section
  const profile = processTeamProfile(rawData);
  const statistics = processTeamStatistics(rawData);
  const performance = processTeamPerformance(rawData);
  const roster = processTeamRoster(rawData);
  const matches = processTeamMatches(rawData);
  const achievements = processTeamAchievements();

  return {
    teamId: rawData.teamId,
    name: teamData.name || 'Unknown Team',
    tag: teamData.tag || extractTagFromName(teamData.name || 'Unknown'),
    logoUrl: teamData.logo_url,
    sponsor: teamData.sponsor,
    countryCode: teamData.country_code,
    websiteUrl: teamData.url,
    profile,
    statistics,
    performance,
    roster,
    matches,
    achievements,
    processed: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

/**
 * Validates raw team data
 * @param rawData Raw team data to validate
 */
function validateRawTeamData(rawData: RawTeamData): void {
  if (!rawData) {
    throw new Error('Raw team data is required');
  }

  if (!rawData.teamId) {
    throw new Error('Team ID is required');
  }

  if (!rawData.openDotaTeam && !rawData.dotabuffTeam) {
    throw new Error('At least one data source (OpenDota or Dotabuff) is required');
  }
  
  // Validate OpenDota team name if provided
  if (rawData.openDotaTeam && !rawData.openDotaTeam.name) {
    throw new Error('Invalid OpenDota team name');
  }
  
  // Validate Dotabuff team name if provided
  if (rawData.dotabuffTeam && !rawData.dotabuffTeam.teamName) {
    throw new Error('Invalid Dotabuff team name');
  }
}

/**
 * Processes team profile data
 * @param rawData Raw team data
 * @returns Processed team profile
 */
function processTeamProfile(rawData: RawTeamData): ProcessedTeamProfile {
  const team = rawData.openDotaTeam || extractTeamFromDotabuff(rawData.dotabuffTeam);
  
  return {
    establishedDate: undefined, // Not available in current APIs
    region: determineRegion(team?.country_code),
    primaryLanguage: undefined, // Not available in current APIs
    socialMedia: {
      twitter: undefined,
      facebook: undefined,
      instagram: undefined,
      twitch: undefined,
      youtube: undefined,
    },
    sponsorships: team?.sponsor ? [{
      name: team.sponsor,
      type: 'main' as const,
      logoUrl: undefined,
    }] : [],
    description: undefined,
  };
}

/**
 * Calculate basic team win/loss statistics
 */
function calculateTeamWinLossStats(rawData: RawTeamData): { totalMatches: number; wins: number; losses: number; winRate: number } {
  const matches = extractMatchesFromDotabuff(rawData.dotabuffTeam);
  const team = rawData.openDotaTeam || extractTeamFromDotabuff(rawData.dotabuffTeam);
  
  // Use OpenDota values if available (including 0), otherwise calculate from matches
  const wins = team?.wins !== undefined ? team.wins : matches.filter(m => m.radiant_win).length;
  const losses = team?.losses !== undefined ? team.losses : matches.filter(m => !m.radiant_win).length;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  
  return { totalMatches, wins, losses, winRate };
}

/**
 * Calculate additional team statistics
 */
function calculateAdditionalTeamStats(rawData: RawTeamData): {
  rating: number;
  lastMatchTime: number;
  averageMatchDuration: number;
  gamesPlayed: ProcessedTeamStatistics['gamesPlayed'];
  streaks: ProcessedTeamStatistics['streaks'];
  formFactor: ProcessedTeamStatistics['formFactor'];
} {
  const matches = extractMatchesFromDotabuff(rawData.dotabuffTeam);
  const team = rawData.openDotaTeam || extractTeamFromDotabuff(rawData.dotabuffTeam);
  const teamName = rawData.dotabuffTeam?.teamName || team?.name;
  
  return {
    rating: team?.rating !== undefined ? team.rating : calculateRatingFromMatches(matches, teamName),
    lastMatchTime: team?.last_match_time !== undefined ? team.last_match_time : getLastMatchTime(matches),
    averageMatchDuration: calculateAverageMatchDuration(matches),
    gamesPlayed: categorizeGames(matches),
    streaks: calculateTeamStreaks(matches),
    formFactor: calculateFormFactor(matches),
  };
}

/**
 * Processes team statistics
 * @param rawData Raw team data
 * @returns Processed team statistics
 */
function processTeamStatistics(rawData: RawTeamData): ProcessedTeamStatistics {
  const winLossStats = calculateTeamWinLossStats(rawData);
  const additionalStats = calculateAdditionalTeamStats(rawData);
  
  return {
    ...winLossStats,
    ...additionalStats,
    totalPrizeMoney: undefined, // Not available in current APIs
  };
}

/**
 * Processes team performance data
 * @param rawData Raw team data
 * @returns Processed team performance
 */
function processTeamPerformance(rawData: RawTeamData): ProcessedTeamPerformance {
  const matches = extractMatchesFromDotabuff(rawData.dotabuffTeam);
  const team = rawData.openDotaTeam || extractTeamFromDotabuff(rawData.dotabuffTeam);
  const teamName = rawData.dotabuffTeam?.teamName || team?.name;
  
  const rating = team?.rating !== undefined ? team.rating : calculateRatingFromMatches(matches, teamName);
  const consistency = calculateTeamConsistency(matches);
  const versatility = calculateTeamVersatility(matches);
  const teamwork = calculateTeamwork(matches);
  const laning = calculateLaning(matches);
  const midGame = calculateMidGame(matches);
  const lateGame = calculateLateGame(matches);
  const adaptability = calculateAdaptability(matches);
  const clutchFactor = calculateClutchFactor(matches);
  const improvement = calculateTeamImprovement(matches);
  
  const metrics = {
    consistency,
    versatility,
    teamwork,
    laning,
    midGame,
    lateGame,
    adaptability,
    clutchFactor,
  };
  
  return {
    skillLevel: determineSkillLevel(rating),
    consistency,
    versatility,
    teamwork,
    laning,
    midGame,
    lateGame,
    adaptability,
    clutchFactor,
    improvement,
    strengths: determineTeamStrengths(metrics),
    weaknesses: determineTeamWeaknesses(metrics),
    playStyle: calculatePlayStyle(matches),
  };
}

/**
 * Processes team roster data
 * @param rawData Raw team data
 * @returns Processed team roster
 */
function processTeamRoster(rawData: RawTeamData): ProcessedTeamRoster {
  const team = rawData.openDotaTeam || extractTeamFromDotabuff(rawData.dotabuffTeam);
  const players = team?.players || [];
  
  return {
    activeRoster: players.map(player => ({
      accountId: player.account_id,
      name: player.name,
      position: 0, // Not available in OpenDotaTeam
      joinDate: undefined, // Not available in current APIs
      gamesPlayed: player.games_played,
      wins: player.wins,
      winRate: player.games_played > 0 ? (player.wins / player.games_played) * 100 : 0,
      role: determinePlayerRole(0), // Default position since not available
      isActive: true, // Assume active since they're in the team
      isCaptain: false, // Not available in current APIs
      performance: {
        averageKDA: 0, // Not available in current APIs
        averageGPM: 0, // Not available in current APIs
        averageXPM: 0, // Not available in current APIs
        impactScore: 0, // Not available in current APIs
      },
    })),
    formerPlayers: [], // Not available in current APIs
    coaching: [], // Not available in current APIs
    rosterStability: calculateRosterStability(players),
    averagePlayerTenure: calculateAveragePlayerTenure(players),
  };
}

/**
 * Processes team matches data
 * @param rawData Raw team data
 * @returns Processed team matches
 */
function processTeamMatches(rawData: RawTeamData): ProcessedTeamMatches {
  const matches = extractMatchesFromDotabuff(rawData.dotabuffTeam);
  
  return {
    recentMatches: processRecentMatches(matches),
    upcomingMatches: processUpcomingMatches(),
    headToHead: processHeadToHead(matches),
    tournamentPerformance: processTournamentPerformance(matches),
  };
}

/**
 * Processes team achievements data
 * @param _rawData Raw team data
 * @returns Processed team achievements
 */
function processTeamAchievements(): ProcessedTeamAchievements {
  // Not available in current APIs
  return {
    majorTournaments: [],
    minorTournaments: [],
    totalTournaments: 0,
    totalWins: 0,
    totalPrizeMoney: 0,
    rankings: {
      currentWorldRank: undefined,
      currentRegionalRank: undefined,
      peakWorldRank: undefined,
      peakRegionalRank: undefined,
    },
    milestones: [],
  };
}

/**
 * Processes multiple teams in batch
 * @param rawDataArray Array of raw team data
 * @returns Array of processed teams or error objects
 */
export function batchProcessTeams(rawDataArray: RawTeamData[]): Array<ProcessedTeam | { error: string; teamId?: number }> {
  return rawDataArray.map(rawData => {
    try {
      return processTeam(rawData);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        teamId: rawData?.teamId,
      };
    }
  });
}

function hasValidTeamId(team: ProcessedTeam): boolean {
  return Boolean(team.teamId);
}

function hasValidTeamName(team: ProcessedTeam): boolean {
  return Boolean(team.name);
}

function hasStatistics(team: ProcessedTeam): boolean {
  return Boolean(team.statistics);
}

function hasPerformance(team: ProcessedTeam): boolean {
  return Boolean(team.performance);
}

function hasProcessingTimestamp(team: ProcessedTeam): boolean {
  return Boolean(team.processed?.timestamp);
}

function hasAllRequiredSections(team: ProcessedTeam): boolean {
  return Boolean(team.profile && team.roster && team.matches && team.achievements);
}

/**
 * Validates a processed team object
 * @param processedTeam Processed team to validate
 * @returns True if valid, throws error if invalid
 */
export function validateProcessedTeam(processedTeam: ProcessedTeam): boolean {
  if (!hasValidTeamId(processedTeam)) {
    throw new Error('Invalid processed team ID');
  }
  if (!hasValidTeamName(processedTeam)) {
    throw new Error('Invalid processed team name');
  }
  if (!hasStatistics(processedTeam)) {
    throw new Error('Missing team statistics');
  }
  if (!hasPerformance(processedTeam)) {
    throw new Error('Missing team performance metrics');
  }
  if (!hasProcessingTimestamp(processedTeam)) {
    throw new Error('Missing processing timestamp');
  }
  if (!hasAllRequiredSections(processedTeam)) {
    throw new Error('Missing required team data sections');
  }
  return true;
}

// Re-export types for external use
export type {
    ProcessedTeam, ProcessedTeamAchievements, ProcessedTeamMatches, ProcessedTeamPerformance, ProcessedTeamProfile, ProcessedTeamRoster, ProcessedTeamStatistics, RawTeamData
} from './team-types';
