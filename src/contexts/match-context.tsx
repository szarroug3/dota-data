"use client";

/**
 * Match Context
 *
 * Manages match state, filtering, selection, and business logic.
 * Uses MatchDataFetchingContext for all data fetching (no API calls here).
 * Provides a clean, type-safe interface for match data and actions.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { useConstantsContext } from '@/contexts/constants-context';
import type { Hero, Item } from '@/types/contexts/constants-context-value';
import type {
  Match,
  MatchContextProviderProps,
  MatchContextValue,
  MatchEvent,
  EventType,
  PlayerMatchData,
  PlayerRole,
  HeroPick
} from '@/types/contexts/match-context-value';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const MatchContext = createContext<MatchContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useMatchState() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    matches, setMatches,
    selectedMatchId, setSelectedMatchId,
    isLoading, setIsLoading,
    error, setError
  };
}

function useMatchActions(state: ReturnType<typeof useMatchState>, generateMatchFromOpenDota: (matchData: OpenDotaMatch) => Match) {
  // Select match
  const selectMatch = useCallback((matchId: string) => {
    state.setSelectedMatchId(matchId);
  }, [state]);

  // Add match
  const addMatch = useCallback((matchData: OpenDotaMatch) => {
    // Generate the match from OpenDota data
    const generatedMatch = generateMatchFromOpenDota(matchData);
    
    state.setMatches(prev => {
      const existingMatch = prev.find(m => m.id === generatedMatch.id);
      if (existingMatch) {
        return prev.map(m => m.id === generatedMatch.id ? { ...existingMatch, ...generatedMatch } : m);
      }
      return [...prev, generatedMatch];
    });
    
    return generatedMatch;
  }, [state, generateMatchFromOpenDota]);

  // Update match
  const updateMatch = useCallback((matchId: string, updates: Partial<Match>) => {
    state.setMatches(prev => prev.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    ));
  }, [state]);

  // Remove match
  const removeMatch = useCallback((matchId: string) => {
    state.setMatches(prev => prev.filter(match => match.id !== matchId));
    if (state.selectedMatchId === matchId) {
      state.setSelectedMatchId(null);
    }
  }, [state]);

  // Refresh matches
  const refreshMatches = useCallback(async () => {
    state.setIsLoading(true);
    state.setError(null);
    try {
      // No-op for now - will be implemented with data fetching context
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to refresh matches');
    } finally {
      state.setIsLoading(false);
    }
  }, [state]);

  // Clear error
  const clearError = useCallback(() => {
    state.setError(null);
  }, [state]);

  // Utility functions
  const getMatchById = useCallback((matchId: string) => {
    return state.matches.find(match => match.id === matchId);
  }, [state.matches]);

  const getMatchEvents = useCallback((matchId: string, eventTypes?: EventType[]) => {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return [];
    
    let events = match.events;
    if (eventTypes) {
      events = events.filter(event => eventTypes.includes(event.type));
    }
    return events;
  }, [state.matches]);

  const getPlayerPerformance = useCallback((matchId: string, playerId: string) => {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return undefined;

    // Search in both radiant and dire players
    const radiantPlayer = match.players.radiant.find(p => p.playerId === playerId);
    if (radiantPlayer) return radiantPlayer;

    const direPlayer = match.players.dire.find(p => p.playerId === playerId);
    return direPlayer;
  }, [state.matches]);

  const getTeamPerformance = useCallback((matchId: string, side: 'radiant' | 'dire') => {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) {
      return {
        kills: 0,
        gold: 0,
        experience: 0,
        players: []
      };
    }

    const players = match.players[side];
    
    // Calculate total kills from players
    const kills = players.reduce((sum, player) => sum + player.stats.kills, 0);
    
    // Get the latest gold and experience values from advantage data
    const goldAdvantage = match.statistics.goldAdvantage;
    const experienceAdvantage = match.statistics.experienceAdvantage;
    
    const gold = side === 'radiant' 
      ? (goldAdvantage.radiantGold[goldAdvantage.radiantGold.length - 1] || 0)
      : (goldAdvantage.direGold[goldAdvantage.direGold.length - 1] || 0);
    
    const experience = side === 'radiant'
      ? (experienceAdvantage.radiantExperience[experienceAdvantage.radiantExperience.length - 1] || 0)
      : (experienceAdvantage.direExperience[experienceAdvantage.direExperience.length - 1] || 0);

    return {
      kills,
      gold,
      experience,
      players
    };
  }, [state.matches]);

  return {
    selectMatch,
    addMatch,
    updateMatch,
    removeMatch,
    refreshMatches,
    clearError,
    getMatchById,
    getMatchEvents,
    getPlayerPerformance,
    getTeamPerformance
  };
}

// ============================================================================
// MATCH DATA CONVERSION UTILITIES
// ============================================================================

/**
 * Calculate gold and experience advantage over time from OpenDota match data
 */
function calculateAdvantageData(matchData: OpenDotaMatch) {
  // Use the advantage arrays directly from the match data
  const times = Array.from({ length: matchData.radiant_gold_adv?.length || 0 }, (_, i) => i * 60); // Assuming 1-minute intervals
  
  return {
    goldAdvantage: {
      times,
      radiantGold: matchData.radiant_gold_adv || [],
      direGold: (matchData.radiant_gold_adv || []).map(adv => -adv) // Dire gold is negative radiant advantage
    },
    experienceAdvantage: {
      times,
      radiantExperience: matchData.radiant_xp_adv || [],
      direExperience: (matchData.radiant_xp_adv || []).map(adv => -adv) // Dire XP is negative radiant advantage
    }
  };
}

/**
 * Check if match has purchase time data (indicates parsed match)
 */
function hasPurchaseTimeData(teamPlayers: OpenDotaMatchPlayer[]): boolean {
  return teamPlayers.some(player => player.purchase_time && Object.keys(player.purchase_time).length > 0);
}

/**
 * Analyze player's support score based on purchased items
 */
function calculateSupportScore(player: OpenDotaMatchPlayer): number {
  const supportItemNames = ['ward_observer', 'ward_sentry', 'smoke_of_deceit', 'dust'];
  return Object.keys(player.purchase_time).filter(itemName => supportItemNames.includes(itemName)).length;
}

/**
 * Create player analysis with lane and support score
 */
function analyzePlayer(player: OpenDotaMatchPlayer) {
  return {
    player,
    lane: player.lane,
    laneRole: player.lane_role,
    supportScore: calculateSupportScore(player),
  };
}

/**
 * Group players by their lane role
 */
function groupPlayersByLaneRole(playerAnalysis: ReturnType<typeof analyzePlayer>[]) {
  const playersByLaneRole: Record<number, typeof playerAnalysis> = {};
  playerAnalysis.forEach(analysis => {
    const laneRole = analysis.laneRole;
    if (!playersByLaneRole[laneRole]) {
      playersByLaneRole[laneRole] = [];
    }
    playersByLaneRole[laneRole].push(analysis);
  });
  return playersByLaneRole;
}

/**
 * Assign roles to mid players (lane_role=2)
 */
function assignMidRoles(playersByLaneRole: Record<number, ReturnType<typeof analyzePlayer>[]>, roleMap: Record<string, PlayerRole>) {
  if (playersByLaneRole[2]) {
    playersByLaneRole[2].forEach(analysis => {
      const playerId = analysis.player.account_id.toString();
      roleMap[playerId] = 'mid';
    });
  }
}

/**
 * Assign roles to safe lane players (lane_role=1)
 */
function assignSafeLaneRoles(playersByLaneRole: Record<number, ReturnType<typeof analyzePlayer>[]>, roleMap: Record<string, PlayerRole>) {
  if (!playersByLaneRole[1]) return;

  const sortedPlayers = [...playersByLaneRole[1]].sort((a, b) => b.supportScore - a.supportScore);
  
  if (sortedPlayers.length >= 3) {
    // 3+ players: highest = hard_support, middle = support, lowest = carry
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'hard_support';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'support';
    roleMap[sortedPlayers[2].player.account_id.toString()] = 'carry';
    
    // Handle additional players (assign as carry)
    for (let i = 3; i < sortedPlayers.length; i++) {
      roleMap[sortedPlayers[i].player.account_id.toString()] = 'carry';
    }
  } else if (sortedPlayers.length === 2) {
    // 2 players: highest = hard_support, lowest = carry
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'hard_support';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'carry';
  } else if (sortedPlayers.length === 1) {
    // 1 player: assign as carry
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'carry';
  }
}

/**
 * Assign roles to off lane players (lane_role=3)
 */
function assignOffLaneRoles(playersByLaneRole: Record<number, ReturnType<typeof analyzePlayer>[]>, roleMap: Record<string, PlayerRole>) {
  if (!playersByLaneRole[3]) return;

  const sortedPlayers = [...playersByLaneRole[3]].sort((a, b) => b.supportScore - a.supportScore);
  
  if (sortedPlayers.length >= 3) {
    // 3+ players: highest = hard_support, middle = support, lowest = offlane
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'hard_support';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'support';
    roleMap[sortedPlayers[2].player.account_id.toString()] = 'offlane';
    
    // Handle additional players (assign as offlane)
    for (let i = 3; i < sortedPlayers.length; i++) {
      roleMap[sortedPlayers[i].player.account_id.toString()] = 'offlane';
    }
  } else if (sortedPlayers.length === 2) {
    // 2 players: highest = support, lowest = offlane
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'support';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'offlane';
  } else if (sortedPlayers.length === 1) {
    // 1 player: assign as offlane
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'offlane';
  }
}

/**
 * Assign roles to remaining players (roaming, jungle, etc.)
 */
function assignRemainingRoles(playerAnalysis: ReturnType<typeof analyzePlayer>[], roleMap: Record<string, PlayerRole>) {
  playerAnalysis.forEach(analysis => {
    const playerId = analysis.player.account_id.toString();
    
    // Skip if already assigned a role
    if (roleMap[playerId]) {
      return;
    }
    
    // Check for roaming/jungle
    if (analysis.player.is_roaming === true) {
      roleMap[playerId] = 'roaming';
    } else if (analysis.laneRole === 4) {
      roleMap[playerId] = 'jungle';
    } else {
      // Fallback to unknown
      roleMap[playerId] = 'unknown';
    }
  });
}

/**
 * Determine roles for all players in a team
 */
export function detectTeamRoles(teamPlayers: OpenDotaMatchPlayer[]): Record<string, PlayerRole> {
  const roleMap: Record<string, PlayerRole> = {};
  
  // If no purchase_time data, all roles are unknown (match not parsed)
  if (!hasPurchaseTimeData(teamPlayers)) {
    teamPlayers.forEach(player => {
      roleMap[player.account_id.toString()] = 'unknown';
    });
    return roleMap;
  }
  
  // Analyze each player's items and lane position
  const playerAnalysis = teamPlayers.map(analyzePlayer);
  const playersByLaneRole = groupPlayersByLaneRole(playerAnalysis);
  
  // Assign roles based on lane positions
  assignMidRoles(playersByLaneRole, roleMap);
  assignSafeLaneRoles(playersByLaneRole, roleMap);
  assignOffLaneRoles(playersByLaneRole, roleMap);
  assignRemainingRoles(playerAnalysis, roleMap);
  
  return roleMap;
}

/**
 * Convert OpenDota player data to our internal format
 */
function convertPlayer(player: OpenDotaMatchPlayer, roleMap: Record<string, PlayerRole>, items: Record<string, Item>, heroes: Record<string, Hero>): PlayerMatchData {
  // Get role from the role map
  const role = roleMap[player.account_id.toString()] || 'unknown';
  
  // Get hero data
  const heroId = player.hero_id.toString();
  const hero = heroes[heroId];
  
  // Convert items
  const playerItems: Item[] = [
    player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5
  ].filter(itemId => itemId !== 0).map(itemId => {
    const itemIdStr = itemId.toString();
    const item = items[itemIdStr];
    return item || {
      id: itemIdStr,
      name: `Item ${itemId}`,
      imageUrl: ''
    };
  });

  return {
    playerId: player.account_id.toString(),
    playerName: player.personaname || player.name || `Player ${player.account_id}`,
    hero,
    role,
    stats: {
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      lastHits: player.last_hits,
      denies: player.denies,
      gpm: player.gold_per_min,
      xpm: player.xp_per_min,
      netWorth: player.net_worth || player.total_gold,
      level: player.level
    },
    items: playerItems,
    heroStats: {
      damageDealt: player.hero_damage,
      damageTaken: 0, // Not available in OpenDota data
      healingDone: player.hero_healing,
      stuns: 0, // Not available in OpenDota data
      towerDamage: player.tower_damage
    }
  };
}

/**
 * Convert draft data from OpenDota picks_bans to our format
 */
function convertDraftData(matchData: OpenDotaMatch, heroes: Record<string, Hero>) {
  const radiantPicks: HeroPick[] = [];
  const direPicks: HeroPick[] = [];
  const radiantBans: string[] = [];
  const direBans: string[] = [];

  if (matchData.picks_bans) {
    matchData.picks_bans.forEach(pickBan => {
      const heroId = pickBan.hero_id.toString();
      const hero = heroes[heroId];
      const playerId = ''; // Will be filled when we have player-hero mapping
      
      if (pickBan.is_pick) {
        const heroPick: HeroPick = {
          hero,
          playerId,
          role: 'unknown' // Will be determined from player slot
        };
        
        if (pickBan.team === 0) { // Radiant
          radiantPicks.push(heroPick);
        } else { // Dire
          direPicks.push(heroPick);
        }
      } else {
        if (pickBan.team === 0) { // Radiant
          radiantBans.push(heroId);
        } else { // Dire
          direBans.push(heroId);
        }
      }
    });
  }

  return {
    radiantPicks,
    direPicks,
    radiantBans,
    direBans
  };
}

/**
 * Determine side based on player slot
 */
function getSideFromPlayerSlot(playerSlot?: number): 'radiant' | 'dire' {
  return playerSlot && playerSlot < 128 ? 'radiant' : 'dire';
}

/**
 * Create first blood event
 */
function createFirstBloodEvent(objective: { time: number; player_slot?: number }): MatchEvent {
  return {
    timestamp: objective.time,
    type: 'first_blood',
    side: getSideFromPlayerSlot(objective.player_slot),
    details: {
      killer: objective.player_slot?.toString() || ''
    }
  };
}

/**
 * Create roshan kill event
 */
function createRoshanKillEvent(objective: { time: number; player_slot?: number }): MatchEvent {
  return {
    timestamp: objective.time,
    type: 'roshan_kill',
    side: getSideFromPlayerSlot(objective.player_slot),
    details: {
      roshanKiller: getSideFromPlayerSlot(objective.player_slot)
    }
  };
}

/**
 * Create aegis pickup event
 */
function createAegisPickupEvent(objective: { time: number; player_slot?: number }): MatchEvent {
  return {
    timestamp: objective.time,
    type: 'aegis_pickup',
    side: getSideFromPlayerSlot(objective.player_slot),
    details: {
      aegisHolder: objective.player_slot?.toString() || ''
    }
  };
}

/**
 * Parse building information from key
 */
function parseBuildingInfo(buildingKey: string): { buildingType: 'tower' | 'barracks'; buildingTier: number; buildingLane: 'top' | 'mid' | 'bottom' } {
  let buildingType: 'tower' | 'barracks' = 'tower';
  let buildingTier = 1;
  let buildingLane: 'top' | 'mid' | 'bottom' = 'mid';
  
  if (buildingKey.includes('tower')) {
    buildingType = 'tower';
    // Extract tier from key (e.g., tower1, tower2, etc.)
    const tierMatch = buildingKey.match(/tower(\d+)/);
    if (tierMatch) {
      buildingTier = parseInt(tierMatch[1]);
    }
    // Extract lane from key
    if (buildingKey.includes('_top')) buildingLane = 'top';
    else if (buildingKey.includes('_mid')) buildingLane = 'mid';
    else if (buildingKey.includes('_bot')) buildingLane = 'bottom';
  } else if (buildingKey.includes('rax')) {
    buildingType = 'barracks';
    if (buildingKey.includes('_top')) buildingLane = 'top';
    else if (buildingKey.includes('_mid')) buildingLane = 'mid';
    else if (buildingKey.includes('_bot')) buildingLane = 'bottom';
  }
  
  return { buildingType, buildingTier, buildingLane };
}

/**
 * Create building kill event
 */
function createBuildingKillEvent(objective: { time: number; player_slot?: number; key?: string }): MatchEvent | null {
  const buildingKey = objective.key;
  if (!buildingKey) {
    return null; // Skip if no key available
  }
  
  const { buildingType, buildingTier, buildingLane } = parseBuildingInfo(buildingKey);
  
  return {
    timestamp: objective.time,
    type: buildingType === 'tower' ? 'tower_kill' : 'barracks_kill',
    side: getSideFromPlayerSlot(objective.player_slot),
    details: {
      buildingType,
      buildingTier,
      buildingLane
    }
  };
}

/**
 * Generate events from OpenDota match data objectives
 */
function generateEvents(matchData: OpenDotaMatch): MatchEvent[] {
  const events: MatchEvent[] = [];
  
  if (!matchData.objectives) {
    return events;
  }

  matchData.objectives.forEach(objective => {
    switch (objective.type) {
      case 'CHAT_MESSAGE_FIRSTBLOOD':
        events.push(createFirstBloodEvent(objective));
        break;
        
      case 'CHAT_MESSAGE_ROSHAN_KILL':
        events.push(createRoshanKillEvent(objective));
        break;
        
      case 'CHAT_MESSAGE_AEGIS':
        events.push(createAegisPickupEvent(objective));
        break;
        
      case 'building_kill': {
        const buildingEvent = createBuildingKillEvent(objective);
        if (buildingEvent) {
          events.push(buildingEvent);
        }
        break;
      }
        
      case 'CHAT_MESSAGE_COURIER_LOST':
        // Optional: Add courier kill events if needed
        break;
        
      default:
        // Skip other objective types for now
        break;
    }
  });

  return events;
}

// ============================================================================
// DATA GENERATION FUNCTIONS
// ============================================================================

function useMatchGeneration(heroes: Record<string, Hero>, items: Record<string, Item>) {

  // Generate match from OpenDota data
  const generateMatchFromOpenDota = useCallback((matchData: OpenDotaMatch): Match => {
    // Separate radiant and dire players
    const radiantPlayers = matchData.players.filter(player => player.isRadiant);
    const direPlayers = matchData.players.filter(player => !player.isRadiant);

    // Calculate advantage data
    const { goldAdvantage, experienceAdvantage } = calculateAdvantageData(matchData);

    // Convert draft data
    const { radiantPicks, direPicks, radiantBans, direBans } = convertDraftData(matchData, heroes);

    // Generate events
    const events = generateEvents(matchData);

    // Detect roles for each team
    const radiantRoleMap = detectTeamRoles(radiantPlayers);
    const direRoleMap = detectTeamRoles(direPlayers);

    return {
      id: matchData.match_id.toString(),
      date: new Date(matchData.start_time * 1000).toISOString(),
      duration: matchData.duration,
      radiantTeamId: matchData.radiant_team_id?.toString() || '0',
      direTeamId: matchData.dire_team_id?.toString() || '0',
      draft: {
        radiantPicks,
        direPicks,
        radiantBans,
        direBans
      },
      players: {
        radiant: radiantPlayers.map(player => convertPlayer(player, radiantRoleMap, items, heroes)),
        dire: direPlayers.map(player => convertPlayer(player, direRoleMap, items, heroes))
      },
      statistics: {
        radiantScore: matchData.radiant_score || 0,
        direScore: matchData.dire_score || 0,
        goldAdvantage,
        experienceAdvantage
      },
      events,
      result: matchData.radiant_win ? 'radiant' : 'dire'
    };
  }, [items, heroes]);

  return {
    generateMatchFromOpenDota
  };
}



// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const MatchProvider: React.FC<MatchContextProviderProps> = ({ children }) => {
  const state = useMatchState();
  const { heroes, items } = useConstantsContext();
  
  // Generation
  const generation = useMatchGeneration(heroes, items);
  
  // Actions
  const actions = useMatchActions(state, generation.generateMatchFromOpenDota);

  // Context value
  const contextValue: MatchContextValue = {
    // State
    matches: state.matches,
    selectedMatchId: state.selectedMatchId,
    
    // Loading and error states
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    selectMatch: actions.selectMatch,
    addMatch: actions.addMatch,
    updateMatch: actions.updateMatch,
    removeMatch: actions.removeMatch,
    refreshMatches: actions.refreshMatches,
    clearError: actions.clearError,
    
    // Utility functions
    getMatchById: actions.getMatchById,
    getMatchEvents: actions.getMatchEvents,
    getPlayerPerformance: actions.getPlayerPerformance,
    getTeamPerformance: actions.getTeamPerformance
  };

  return (
    <MatchContext.Provider value={contextValue}>
      {children}
    </MatchContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useMatchContext = (): MatchContextValue => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
}; 