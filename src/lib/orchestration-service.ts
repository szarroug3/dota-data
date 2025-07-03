/**
 * Orchestration Service
 * 
 * High-level service for managing the complete data fetching flow:
 * - Team import and match discovery
 * - Background match data queueing
 * - Player data queueing from matches
 * - Cache invalidation and refresh logic
 * - Queue status monitoring
 */

import { orchestrateTeamImportAndQueue } from './api/dotabuff/teams';
import { getMatch } from './api/opendota/matches';
import { getPlayerData } from './api/opendota/players';
import { cacheService } from './cache-service';
import { rateLimiter } from './rate-limiter';
import { logWithTimestampToFile } from './server-logger';

export interface TeamImportResult {
  id: string;
  teamId: string;
  teamName: string;
  leagueId: string;
  leagueName: string;
  matchIds: string[];
  matches: unknown[];
  players: unknown[];
  status: 'queued' | 'ready' | 'partial' | 'error';
  error?: string;
}

export interface QueueStatus {
  services: Record<string, {
    length: number;
    processing: boolean;
    activeSignatures: number;
    activeSignaturesList: string[];
    currentlyProcessing?: string;
  }>;
  timestamp: string;
}

export interface OrchestrationConfig {
  maxConcurrentMatches?: number;
  maxConcurrentPlayers?: number;
  matchQueueTimeout?: number;
  playerQueueTimeout?: number;
  enableAutoRefresh?: boolean;
}

/**
 * Main orchestration service class
 */
export class OrchestrationService {
  private config: Required<OrchestrationConfig>;

  constructor(config: OrchestrationConfig = {}) {
    this.config = {
      maxConcurrentMatches: config.maxConcurrentMatches || 5,
      maxConcurrentPlayers: config.maxConcurrentPlayers || 10,
      matchQueueTimeout: config.matchQueueTimeout || 30000, // 30 seconds
      playerQueueTimeout: config.playerQueueTimeout || 15000, // 15 seconds
      enableAutoRefresh: config.enableAutoRefresh || false,
    };
  }

  /**
   * Import a team and queue all related data fetching
   */
  async importTeam(
    teamId: string,
    leagueId: string,
    options: {
      forceRefresh?: boolean;
      refresh?: boolean;
    } = {}
  ): Promise<TeamImportResult | { status: string; signature: string }> {
    const { forceRefresh = false, refresh = false } = options;
    
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Starting team import: teamId=${teamId}, leagueId=${leagueId}, forceRefresh=${forceRefresh}, refresh=${refresh}`);
    
    try {
      const result = await orchestrateTeamImportAndQueue(teamId, leagueId, forceRefresh, refresh);
      return this.handleImportTeamResult(result, teamId, leagueId);
    } catch (error) {
      return this.handleImportTeamError(error, teamId, leagueId);
    }
  }

  /**
   * Queue match data fetching for a specific match
   */
  async queueMatchData(
    matchId: string,
    teamId?: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<unknown | { status: string; signature: string }> {
    const { forceRefresh = false } = options;
    
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Queueing match data: matchId=${matchId}, teamId=${teamId}, forceRefresh=${forceRefresh}`);
    
    try {
      const result = await getMatch(Number(matchId), forceRefresh, teamId);
      
      if (result && typeof result === 'object' && 'status' in result && result.status === 'queued') {
        logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Match data queued: ${JSON.stringify(result)}`);
      } else {
        logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Match data ready: matchId=${matchId}`);
      }
      
      return result;
      
    } catch (error) {
      logWithTimestampToFile('error', `[ORCHESTRATION_SERVICE] Error queueing match data: ${error}`);
      throw error;
    }
  }

  /**
   * Queue player data fetching for a specific player
   */
  async queuePlayerData(
    playerId: number,
    options: { forceRefresh?: boolean } = {}
  ): Promise<unknown | { status: string; signature: string }> {
    const { forceRefresh = false } = options;
    
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Queueing player data: playerId=${playerId}, forceRefresh=${forceRefresh}`);
    
    try {
      const result = await getPlayerData(playerId, forceRefresh);
      
      if (result && typeof result === 'object' && 'status' in result && result.status === 'queued') {
        logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Player data queued: ${JSON.stringify(result)}`);
      } else {
        logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Player data ready: playerId=${playerId}`);
      }
      
      return result;
      
    } catch (error) {
      logWithTimestampToFile('error', `[ORCHESTRATION_SERVICE] Error queueing player data: ${error}`);
      throw error;
    }
  }

  /**
   * Get current queue status for all services
   */
  getQueueStatus(): QueueStatus {
    logWithTimestampToFile('log', '[ORCHESTRATION_SERVICE] Getting queue status');
    
    const cacheQueueStats = cacheService.getQueueStats();
    const requestQueueStats = rateLimiter.getQueueStats();
    
    // Merge the stats (request queue takes precedence for consistency)
    const mergedStats = {
      ...cacheQueueStats,
      ...requestQueueStats
    };
    
    return {
      services: mergedStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Invalidate cache for a team and all related data
   */
  async invalidateTeamCache(
    _teamId: string,
    _leagueId: string,
    matchIds: string[] = [],
    playerIds: string[] = []
  ): Promise<void> {
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Invalidating team cache: teamId=${_teamId}, leagueId=${_leagueId}, matches=${matchIds.length}, players=${playerIds.length}`);
    try {
      // Invalidate team cache
      const teamCacheKey = `dotabuff-team-${_teamId}-matches`;
      const teamFilename = `${teamCacheKey}.html`;
      await cacheService.invalidate(teamCacheKey, teamFilename);
      // Invalidate league cache
      if (_leagueId) {
        const leagueCacheKey = `dotabuff-league-${_leagueId}`;
        const leagueFilename = `${leagueCacheKey}.html`;
        await cacheService.invalidate(leagueCacheKey, leagueFilename);
      }
      // Invalidate match and player caches
      for (const matchId of matchIds) {
        const matchCacheKey = `opendota-match-${matchId}`;
        const matchFilename = `${matchCacheKey}.json`;
        await cacheService.invalidate(matchCacheKey, matchFilename);
      }
      for (const playerId of playerIds) {
        const playerCacheKey = `opendota-player-${playerId}`;
        const playerFilename = `${playerCacheKey}.json`;
        await cacheService.invalidate(playerCacheKey, playerFilename);
      }
      logWithTimestampToFile('log', '[ORCHESTRATION_SERVICE] Team cache invalidation complete');
    } catch (error) {
      logWithTimestampToFile('error', `[ORCHESTRATION_SERVICE] Error invalidating team cache: ${error}`);
      throw error;
    }
  }

  /**
   * Clear all queues for a specific service
   */
  clearServiceQueue(service: string): void {
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Clearing queue for service: ${service}`);
    
    try {
      rateLimiter.clearQueue(service);
      logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Queue cleared for service: ${service}`);
    } catch (error) {
      logWithTimestampToFile('error', `[ORCHESTRATION_SERVICE] Error clearing queue: ${error}`);
      throw error;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<OrchestrationConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Configuration updated: ${JSON.stringify(this.config)}`);
  }

  private handleImportTeamResult(result: unknown, _teamId: string, _leagueId: string): TeamImportResult | { status: string; signature: string } {
    if (result && typeof result === 'object' && 'status' in result && result.status === 'queued' && 'signature' in result) {
      logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Team import queued: ${JSON.stringify(result)}`);
      return result as { status: string; signature: string };
    }
    if (result && typeof result === 'object' && 'error' in result) {
      logWithTimestampToFile('error', `[ORCHESTRATION_SERVICE] Team import error: ${JSON.stringify(result)}`);
      return {
        ...(result as object),
        status: 'error'
      } as TeamImportResult;
    }
    const teamResult = result as TeamImportResult;
    teamResult.status = teamResult.status || 'ready';
    logWithTimestampToFile('log', `[ORCHESTRATION_SERVICE] Team import completed: ${JSON.stringify(teamResult)}`);
    return teamResult;
  }

  private handleImportTeamError(error: unknown, teamId: string, leagueId: string): TeamImportResult {
    logWithTimestampToFile('error', `[ORCHESTRATION_SERVICE] Error in team import: ${error}`);
    return {
      id: `${teamId}-${leagueId}`,
      teamId,
      teamName: 'Unknown',
      leagueId,
      leagueName: leagueId,
      matchIds: [],
      matches: [],
      players: [],
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export singleton instance
export const orchestrationService = new OrchestrationService();
