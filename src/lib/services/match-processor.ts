import { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

/**
 * Processed match data optimized for frontend consumption
 */
export interface ProcessedMatch {
  matchId: number;
  startTime: number;
  duration: number;
  radiantWin: boolean;
  gameMode: string;
  lobbyType: string;
  leagueId?: number;
  averageRank: number;
  teams: {
    radiant: ProcessedTeam;
    dire: ProcessedTeam;
  };
  picksBans?: ProcessedPickBan[];
  statistics: MatchStatistics;
  processed: {
    timestamp: string;
    version: string;
  };
}

/**
 * Processed team data
 */
export interface ProcessedTeam {
  name?: string;
  teamId?: number;
  score?: number;
  players: ProcessedPlayer[];
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalNetWorth: number;
  avgLevel: number;
  avgGPM: number;
  avgXPM: number;
  teamFightPerformance: number;
  objectives: {
    towers: number;
    barracks: number;
    roshan: number;
  };
}

/**
 * Processed player data
 */
export interface ProcessedPlayer {
  accountId: number;
  heroId: number;
  playerSlot: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  netWorth: number;
  level: number;
  lastHits: number;
  denies: number;
  gpm: number;
  xpm: number;
  heroDamage: number;
  towerDamage: number;
  heroHealing: number;
  items: number[];
  backpack: number[];
  neutralItem: number;
  performance: {
    laning: number;
    teamfight: number;
    farming: number;
    support: number;
  };
  lane?: number;
  laneRole?: number;
  isRoaming?: boolean;
  rankTier?: number;
}

/**
 * Processed pick/ban data
 */
export interface ProcessedPickBan {
  order: number;
  isPick: boolean;
  heroId: number;
  team: 'radiant' | 'dire';
  phase: 'ban1' | 'pick1' | 'ban2' | 'pick2' | 'ban3' | 'pick3';
}

/**
 * Match statistics
 */
export interface MatchStatistics {
  totalKills: number;
  killsPerMinute: number;
  averageMatchRank: number;
  gameDurationCategory: 'short' | 'medium' | 'long' | 'very_long';
  dominanceScore: number;
  teamFightIntensity: number;
  farmingEfficiency: {
    radiant: number;
    dire: number;
  };
  heroComplexity: number;
}

// Game mode and lobby type mappings removed as OpenDotaMatch interface 
// doesn't include these fields. Using hardcoded 'Unknown' values instead.

/**
 * Processes raw OpenDota match data into frontend-friendly format
 * @param rawMatch Raw OpenDota match data
 * @returns Processed match data
 * @throws Error if match data is invalid or processing fails
 */
export function processMatch(rawMatch: OpenDotaMatch): ProcessedMatch {
  try {
    validateRawMatch(rawMatch);

    const radiantPlayers = rawMatch.players.filter(p => p.player_slot < 5);
    const direPlayers = rawMatch.players.filter(p => p.player_slot >= 128);

    const radiantTeam = processTeam(radiantPlayers, 'radiant', rawMatch.radiant_name, rawMatch.radiant_team_id, rawMatch.radiant_score);
    const direTeam = processTeam(direPlayers, 'dire', rawMatch.dire_name, rawMatch.dire_team_id, rawMatch.dire_score);

    const statistics = calculateMatchStatistics(rawMatch, radiantTeam, direTeam);
    const picksBans = rawMatch.picks_bans ? processPicksBans(rawMatch.picks_bans) : undefined;

    return {
      matchId: rawMatch.match_id,
      startTime: rawMatch.start_time,
      duration: rawMatch.duration,
      radiantWin: rawMatch.radiant_win,
      gameMode: 'Unknown', // OpenDotaMatch doesn't include game_mode
      lobbyType: 'Unknown', // OpenDotaMatch doesn't include lobby_type
      leagueId: rawMatch.leagueid,
      averageRank: calculateAverageRank(rawMatch.players),
      teams: {
        radiant: radiantTeam,
        dire: direTeam,
      },
      picksBans,
      statistics,
      processed: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  } catch (error) {
    throw new Error(`Failed to process match data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates basic match data
 */
function validateBasicMatchData(rawMatch: OpenDotaMatch): void {
  if (!rawMatch) {
    throw new Error('Match data is null or undefined');
  }

  if (!rawMatch.match_id || typeof rawMatch.match_id !== 'number') {
    throw new Error('Invalid match ID');
  }
}

/**
 * Validates match players data
 */
function validateMatchPlayers(rawMatch: OpenDotaMatch): void {
  if (!rawMatch.players || !Array.isArray(rawMatch.players)) {
    throw new Error('Invalid players data');
  }

  if (rawMatch.players.length !== 10) {
    throw new Error(`Expected 10 players, got ${rawMatch.players.length}`);
  }
}

/**
 * Validates match timing data
 */
function validateMatchTiming(rawMatch: OpenDotaMatch): void {
  if (typeof rawMatch.duration !== 'number' || rawMatch.duration <= 0) {
    throw new Error('Invalid match duration');
  }

  if (typeof rawMatch.start_time !== 'number') {
    throw new Error('Invalid start time');
  }

  if (typeof rawMatch.radiant_win !== 'boolean') {
    throw new Error('Invalid radiant win status');
  }
}

/**
 * Validates raw match data
 * @param rawMatch Raw match data to validate
 * @throws Error if validation fails
 */
function validateRawMatch(rawMatch: OpenDotaMatch): void {
  validateBasicMatchData(rawMatch);
  validateMatchPlayers(rawMatch);
  validateMatchTiming(rawMatch);
}

/**
 * Processes team data
 * @param players Array of players for this team
 * @param side Team side (radiant or dire)
 * @param teamName Optional team name
 * @param teamId Optional team ID
 * @param score Optional team score
 * @returns Processed team data
 */
function processTeam(
  players: OpenDotaMatchPlayer[],
  side: 'radiant' | 'dire',
  teamName?: string,
  teamId?: number,
  score?: number
): ProcessedTeam {
  const processedPlayers = players.map(player => processPlayer(player));
  
  const totalKills = processedPlayers.reduce((sum, p) => sum + p.kills, 0);
  const totalDeaths = processedPlayers.reduce((sum, p) => sum + p.deaths, 0);
  const totalAssists = processedPlayers.reduce((sum, p) => sum + p.assists, 0);
  const totalNetWorth = processedPlayers.reduce((sum, p) => sum + p.netWorth, 0);
  const avgLevel = processedPlayers.reduce((sum, p) => sum + p.level, 0) / processedPlayers.length;
  const avgGPM = processedPlayers.reduce((sum, p) => sum + p.gpm, 0) / processedPlayers.length;
  const avgXPM = processedPlayers.reduce((sum, p) => sum + p.xpm, 0) / processedPlayers.length;
  
  const teamFightPerformance = calculateTeamFightPerformance(processedPlayers);
  const objectives = calculateObjectives(processedPlayers);

  return {
    name: teamName,
    teamId,
    score,
    players: processedPlayers,
    totalKills,
    totalDeaths,
    totalAssists,
    totalNetWorth,
    avgLevel: Math.round(avgLevel * 100) / 100,
    avgGPM: Math.round(avgGPM),
    avgXPM: Math.round(avgXPM),
    teamFightPerformance,
    objectives,
  };
}

/**
 * Processes individual player data
 * @param player Raw player data
 * @returns Processed player data
 */
function processPlayer(player: OpenDotaMatchPlayer): ProcessedPlayer {
  const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : player.kills + player.assists;
  const netWorth = player.total_gold || (player.gold + player.gold_spent);
  
  const performance = calculatePlayerPerformance(player);
  const items = [
    player.item_0,
    player.item_1,
    player.item_2,
    player.item_3,
    player.item_4,
    player.item_5,
  ].filter(item => item > 0);

  const backpack = [
    player.backpack_0,
    player.backpack_1,
    player.backpack_2,
  ].filter(item => item > 0);

  return {
    accountId: player.account_id,
    heroId: player.hero_id,
    playerSlot: player.player_slot,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    kda: Math.round(kda * 100) / 100,
    netWorth,
    level: player.level,
    lastHits: player.last_hits,
    denies: player.denies,
    gpm: player.gold_per_min,
    xpm: player.xp_per_min,
    heroDamage: player.hero_damage,
    towerDamage: player.tower_damage,
    heroHealing: player.hero_healing,
    items,
    backpack,
    neutralItem: player.item_neutral,
    performance,
    lane: player.lane,
    laneRole: player.lane_role,
    isRoaming: player.is_roaming,
    rankTier: player.rank_tier,
  };
}

/**
 * Calculates player performance metrics
 * @param player Raw player data
 * @returns Performance metrics
 */
function calculatePlayerPerformance(player: OpenDotaMatchPlayer): ProcessedPlayer['performance'] {
  const laning = calculateLaningPerformance(player);
  const teamfight = calculateTeamfightPerformance(player);
  const farming = calculateFarmingPerformance(player);
  const support = calculateSupportPerformance(player);

  return {
    laning: Math.round(laning * 100) / 100,
    teamfight: Math.round(teamfight * 100) / 100,
    farming: Math.round(farming * 100) / 100,
    support: Math.round(support * 100) / 100,
  };
}

/**
 * Calculates laning performance score
 * @param player Raw player data
 * @returns Laning performance score (0-100)
 */
function calculateLaningPerformance(player: OpenDotaMatchPlayer): number {
  const lastHitsScore = Math.min(player.last_hits / 10, 10); // Max 10 points for 100+ last hits
  const deniesScore = Math.min(player.denies / 2, 5); // Max 5 points for 10+ denies
  const gpmScore = Math.min(player.gold_per_min / 50, 5); // Max 5 points for 250+ GPM
  const xpmScore = Math.min(player.xp_per_min / 50, 5); // Max 5 points for 250+ XPM
  
  return Math.min((lastHitsScore + deniesScore + gpmScore + xpmScore) * 4, 100);
}

/**
 * Calculates teamfight performance score
 * @param player Raw player data
 * @returns Teamfight performance score (0-100)
 */
function calculateTeamfightPerformance(player: OpenDotaMatchPlayer): number {
  const kda = player.deaths > 0 ? (player.kills + player.assists) / player.deaths : player.kills + player.assists;
  const kdaScore = Math.min(kda * 10, 50); // Max 50 points for 5+ KDA
  const damageScore = Math.min(player.hero_damage / 1000, 25); // Max 25 points for 25k+ damage
  const participationScore = Math.min((player.kills + player.assists) * 2, 25); // Max 25 points
  
  return Math.min(kdaScore + damageScore + participationScore, 100);
}

/**
 * Calculates farming performance score
 * @param player Raw player data
 * @returns Farming performance score (0-100)
 */
function calculateFarmingPerformance(player: OpenDotaMatchPlayer): number {
  const gpmScore = Math.min(player.gold_per_min / 8, 50); // Max 50 points for 400+ GPM
  const lastHitsScore = Math.min(player.last_hits / 5, 30); // Max 30 points for 150+ last hits
  const neutralKillsScore = Math.min((player.neutral_kills || 0) * 2, 20); // Max 20 points
  
  return Math.min(gpmScore + lastHitsScore + neutralKillsScore, 100);
}

/**
 * Calculates support performance score
 * @param player Raw player data
 * @returns Support performance score (0-100)
 */
function calculateSupportPerformance(player: OpenDotaMatchPlayer): number {
  const assistsScore = Math.min(player.assists * 3, 30); // Max 30 points for 10+ assists
  const healingScore = Math.min(player.hero_healing / 100, 25); // Max 25 points for 2.5k+ healing
  const wardsScore = Math.min(((player.observer_uses || 0) + (player.sentry_uses || 0)) * 2, 25); // Max 25 points
  const supportKillsScore = Math.min(((player.observer_kills || 0) + (player.sentry_kills || 0)) * 5, 20); // Max 20 points
  
  return Math.min(assistsScore + healingScore + wardsScore + supportKillsScore, 100);
}

/**
 * Calculates team fight performance for a team
 * @param players Array of processed players
 * @returns Team fight performance score (0-100)
 */
function calculateTeamFightPerformance(players: ProcessedPlayer[]): number {
  const avgTeamfight = players.reduce((sum, p) => sum + p.performance.teamfight, 0) / players.length;
  return Math.round(avgTeamfight * 100) / 100;
}

/**
 * Calculates objectives taken by a team
 * @param players Array of processed players
 * @returns Objectives data
 */
function calculateObjectives(players: ProcessedPlayer[]): ProcessedTeam['objectives'] {
  const towers = players.reduce((sum, p) => sum + (p.towerDamage > 0 ? 1 : 0), 0);
  const roshan = players.reduce((sum, p) => sum + (p.performance.teamfight > 70 ? 1 : 0), 0);
  
  return {
    towers,
    barracks: Math.floor(towers / 2), // Estimate barracks from towers
    roshan,
  };
}

/**
 * Processes picks and bans
 * @param picksBans Raw picks and bans data
 * @returns Processed picks and bans
 */
function processPicksBans(picksBans: OpenDotaMatch['picks_bans']): ProcessedPickBan[] {
  if (!picksBans) return [];
  
  return picksBans.map(pb => ({
    order: pb.order,
    isPick: pb.is_pick,
    heroId: pb.hero_id,
    team: pb.team === 0 ? 'radiant' : 'dire',
    phase: getPickBanPhase(pb.order),
  }));
}

/**
 * Determines pick/ban phase based on order
 * @param order Pick/ban order
 * @returns Phase name
 */
function getPickBanPhase(order: number): ProcessedPickBan['phase'] {
  if (order <= 6) return 'ban1';
  if (order <= 10) return 'pick1';
  if (order <= 14) return 'ban2';
  if (order <= 18) return 'pick2';
  if (order <= 22) return 'ban3';
  return 'pick3';
}

/**
 * Calculates average rank for the match
 * @param players Array of raw players
 * @returns Average rank tier
 */
function calculateAverageRank(players: OpenDotaMatchPlayer[]): number {
  const rankedPlayers = players.filter(p => p.rank_tier && p.rank_tier > 0);
  if (rankedPlayers.length === 0) return 0;
  
  const totalRank = rankedPlayers.reduce((sum, p) => sum + (p.rank_tier || 0), 0);
  return Math.round(totalRank / rankedPlayers.length);
}

/**
 * Calculates comprehensive match statistics
 * @param rawMatch Raw match data
 * @param radiantTeam Processed radiant team
 * @param direTeam Processed dire team
 * @returns Match statistics
 */
function calculateMatchStatistics(
  rawMatch: OpenDotaMatch,
  radiantTeam: ProcessedTeam,
  direTeam: ProcessedTeam
): MatchStatistics {
  const totalKills = radiantTeam.totalKills + direTeam.totalKills;
  const killsPerMinute = Math.round((totalKills / (rawMatch.duration / 60)) * 100) / 100;
  const averageMatchRank = calculateAverageRank(rawMatch.players);
  
  const gameDurationCategory = getGameDurationCategory(rawMatch.duration);
  const dominanceScore = calculateDominanceScore(radiantTeam, direTeam);
  const teamFightIntensity = calculateTeamFightIntensity(totalKills, rawMatch.duration);
  
  const farmingEfficiency = {
    radiant: radiantTeam.avgGPM,
    dire: direTeam.avgGPM,
  };
  
  const heroComplexity = calculateHeroComplexity(rawMatch.players);

  return {
    totalKills,
    killsPerMinute,
    averageMatchRank,
    gameDurationCategory,
    dominanceScore,
    teamFightIntensity,
    farmingEfficiency,
    heroComplexity,
  };
}

/**
 * Categorizes game duration
 * @param duration Game duration in seconds
 * @returns Duration category
 */
function getGameDurationCategory(duration: number): MatchStatistics['gameDurationCategory'] {
  const minutes = duration / 60;
  if (minutes < 25) return 'short';
  if (minutes < 40) return 'medium';
  if (minutes < 60) return 'long';
  return 'very_long';
}

/**
 * Calculates match dominance score
 * @param radiantTeam Processed radiant team
 * @param direTeam Processed dire team
 * @returns Dominance score (0-100, 50 is balanced)
 */
function calculateDominanceScore(radiantTeam: ProcessedTeam, direTeam: ProcessedTeam): number {
  const killDiff = radiantTeam.totalKills - direTeam.totalKills;
  const networthDiff = radiantTeam.totalNetWorth - direTeam.totalNetWorth;
  const levelDiff = radiantTeam.avgLevel - direTeam.avgLevel;
  
  const killScore = Math.max(-25, Math.min(25, killDiff * 2));
  const networthScore = Math.max(-15, Math.min(15, networthDiff / 1000));
  const levelScore = Math.max(-10, Math.min(10, levelDiff * 5));
  
  return Math.round(50 + killScore + networthScore + levelScore);
}

/**
 * Calculates team fight intensity
 * @param totalKills Total kills in match
 * @param duration Match duration in seconds
 * @returns Team fight intensity score (0-100)
 */
function calculateTeamFightIntensity(totalKills: number, duration: number): number {
  const killsPerMinute = totalKills / (duration / 60);
  const intensityScore = Math.min(killsPerMinute * 10, 100);
  return Math.round(intensityScore);
}

/**
 * Calculates hero complexity score
 * @param players Array of raw players
 * @returns Hero complexity score (0-100)
 */
function calculateHeroComplexity(players: OpenDotaMatchPlayer[]): number {
  // This is a simplified calculation - in a real implementation,
  // you'd have a database of hero complexity ratings
  const complexitySum = players.reduce((sum, player) => {
    // Simple heuristic: heroes with more abilities/items tend to be more complex
    const itemCount = [
      player.item_0, player.item_1, player.item_2,
      player.item_3, player.item_4, player.item_5
    ].filter(item => item > 0).length;
    
    return sum + (itemCount * 10) + (player.hero_id % 10); // Simplified complexity
  }, 0);
  
  return Math.min(Math.round(complexitySum / players.length), 100);
}

/**
 * Batch processes multiple matches
 * @param rawMatches Array of raw match data
 * @returns Array of processed matches with error handling
 */
export function batchProcessMatches(rawMatches: OpenDotaMatch[]): Array<ProcessedMatch | { error: string; matchId?: number }> {
  return rawMatches.map(rawMatch => {
    try {
      return processMatch(rawMatch);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        matchId: rawMatch?.match_id,
      };
    }
  });
}

/**
 * Validates processed match data
 * @param processedMatch Processed match data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateProcessedMatch(processedMatch: ProcessedMatch): boolean {
  if (!processedMatch.matchId || typeof processedMatch.matchId !== 'number') {
    throw new Error('Invalid processed match ID');
  }
  
  if (!processedMatch.teams.radiant.players || processedMatch.teams.radiant.players.length !== 5) {
    throw new Error('Invalid radiant team players');
  }
  
  if (!processedMatch.teams.dire.players || processedMatch.teams.dire.players.length !== 5) {
    throw new Error('Invalid dire team players');
  }
  
  if (!processedMatch.statistics) {
    throw new Error('Missing match statistics');
  }
  
  if (!processedMatch.processed.timestamp) {
    throw new Error('Missing processing timestamp');
  }
  
  return true;
} 