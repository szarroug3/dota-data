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
import { useMatchDataFetching } from '@/contexts/match-data-fetching-context';
import { useMatchOperations } from '@/hooks/use-match-operations';
import type { Hero, Item } from '@/types/contexts/constants-context-value';
import type {
  Match,
  MatchContextProviderProps,
  MatchContextValue,
  MatchEvent,
  PlayerMatchData,
  PlayerRole
} from '@/types/contexts/match-context-value';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

interface PlayerAnalysisResult {
  player: OpenDotaMatchPlayer;
  supportScore: number;
  farmScore: number;
  killScore: number;
  totalScore: number;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const MatchContext = createContext<MatchContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useMatchState() {
  const [matches, setMatches] = useState<Map<number, Match>>(new Map());
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return {
    matches,
    setMatches,
    selectedMatchId,
    setSelectedMatchId,
    isLoading,
    setIsLoading
  };
}

function useMatchProcessing() {
  const { heroes, items } = useConstantsContext();

  // Process match data from API responses
  const processMatchData = useCallback((matchData: OpenDotaMatch): Match => {
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
      id: matchData.match_id,
      date: new Date(matchData.start_time * 1000).toISOString(),
      duration: matchData.duration,
      radiantTeamId: matchData.radiant_team_id || 0,
      direTeamId: matchData.dire_team_id || 0,
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
      events,
      statistics: {
        radiantScore: matchData.radiant_score || 0,
        direScore: matchData.dire_score || 0,
        goldAdvantage,
        experienceAdvantage
      },
      result: matchData.radiant_win ? 'radiant' : 'dire'
    };
  }, [heroes, items]);

  return {
    processMatchData
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateAdvantageData(matchData: OpenDotaMatch) {
  const times = Array.from({ length: matchData.radiant_gold_adv?.length || 0 }, (_, i) => i * 60);
  const goldAdvantage = matchData.radiant_gold_adv || [];
  const experienceAdvantage = matchData.radiant_xp_adv || [];
  
  return {
    goldAdvantage: {
      times,
      radiantGold: goldAdvantage,
      direGold: goldAdvantage.map(adv => -adv)
    },
    experienceAdvantage: {
      times,
      radiantExperience: experienceAdvantage,
      direExperience: experienceAdvantage.map(adv => -adv)
    }
  };
}

function calculateSupportScore(player: OpenDotaMatchPlayer): number {
  return (player.observer_uses || 0) + (player.sentry_uses || 0) * 2;
}

function analyzePlayer(player: OpenDotaMatchPlayer): PlayerAnalysisResult {
  const supportScore = calculateSupportScore(player);
  const farmScore = (player.gold_per_min || 0) + (player.xp_per_min || 0);
  const killScore = (player.kills || 0) + (player.assists || 0) * 0.5;
  
  return {
    player,
    supportScore,
    farmScore,
    killScore,
    totalScore: supportScore + farmScore + killScore
  };
}

function groupPlayersByLaneRole(playerAnalysis: PlayerAnalysisResult[]) {
  const playersByLaneRole: Record<number, PlayerAnalysisResult[]> = {};
  
  playerAnalysis.forEach(analysis => {
    const laneRole = analysis.player.lane_role || 0;
    if (!playersByLaneRole[laneRole]) {
      playersByLaneRole[laneRole] = [];
    }
    playersByLaneRole[laneRole].push(analysis);
  });
  
  return playersByLaneRole;
}

function assignMidRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const midPlayers = playersByLaneRole[2] || [];
  if (midPlayers.length > 0) {
    const bestMid = midPlayers.reduce((best, current) => 
      current.farmScore > best.farmScore ? current : best
    );
    roleMap[bestMid.player.account_id.toString()] = 'mid';
  }
}

function assignSafeLaneRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const safeLanePlayers = playersByLaneRole[1] || [];
  if (safeLanePlayers.length > 0) {
    const bestCarry = safeLanePlayers.reduce((best, current) => 
      current.farmScore > best.farmScore ? current : best
    );
    roleMap[bestCarry.player.account_id.toString()] = 'carry';
    
    // Assign support role to the other safe lane player
    const support = safeLanePlayers.find(p => p.player.account_id !== bestCarry.player.account_id);
    if (support) {
      roleMap[support.player.account_id.toString()] = 'support';
    }
  }
}

function assignOffLaneRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const offLanePlayers = playersByLaneRole[3] || [];
  if (offLanePlayers.length > 0) {
    const bestOffLane = offLanePlayers.reduce((best, current) => 
      current.totalScore > best.totalScore ? current : best
    );
    roleMap[bestOffLane.player.account_id.toString()] = 'offlane';
    
    // Assign hard support role to the other off lane player
    const hardSupport = offLanePlayers.find(p => p.player.account_id !== bestOffLane.player.account_id);
    if (hardSupport) {
      roleMap[hardSupport.player.account_id.toString()] = 'hard_support';
    }
  }
}

function assignRemainingRoles(playerAnalysis: PlayerAnalysisResult[], roleMap: Record<string, PlayerRole>) {
  const unassigned = playerAnalysis.filter(analysis => 
    !roleMap[analysis.player.account_id.toString()]
  );
  
  unassigned.forEach(analysis => {
    if (analysis.supportScore > analysis.farmScore) {
      roleMap[analysis.player.account_id.toString()] = 'support';
    } else if (analysis.farmScore > analysis.killScore) {
      roleMap[analysis.player.account_id.toString()] = 'carry';
    } else {
      roleMap[analysis.player.account_id.toString()] = 'unknown';
    }
  });
}

export function detectTeamRoles(teamPlayers: OpenDotaMatchPlayer[]): Record<string, PlayerRole> {
  const roleMap: Record<string, PlayerRole> = {};
  
  if (teamPlayers.length === 0) return roleMap;
  
  const playerAnalysis = teamPlayers.map(analyzePlayer);
  const playersByLaneRole = groupPlayersByLaneRole(playerAnalysis);
  
  // Assign roles based on lane positions
  assignMidRoles(playersByLaneRole, roleMap);
  assignSafeLaneRoles(playersByLaneRole, roleMap);
  assignOffLaneRoles(playersByLaneRole, roleMap);
  assignRemainingRoles(playerAnalysis, roleMap);
  
  return roleMap;
}

function getPlayerItems(player: OpenDotaMatchPlayer, items: Record<string, Item>): Item[] {
  const itemIds = [
    player.item_0, player.item_1, player.item_2, 
    player.item_3, player.item_4, player.item_5
  ];
  
  return itemIds
    .filter(itemId => itemId !== 0)
    .map(itemId => items[itemId.toString()])
    .filter(Boolean);
}

function getBasicStats(player: OpenDotaMatchPlayer) {
  return {
    kills: player.kills || 0,
    deaths: player.deaths || 0,
    assists: player.assists || 0
  };
}

function getFarmingStats(player: OpenDotaMatchPlayer) {
  return {
    lastHits: player.last_hits || 0,
    denies: player.denies || 0,
    gpm: player.gold_per_min || 0,
    xpm: player.xp_per_min || 0
  };
}

function getEconomicStats(player: OpenDotaMatchPlayer) {
  return {
    netWorth: player.net_worth || player.total_gold || 0,
    level: player.level || 1
  };
}

function createPlayerStats(player: OpenDotaMatchPlayer): PlayerMatchData['stats'] {
  const basicStats = getBasicStats(player);
  const farmingStats = getFarmingStats(player);
  const economicStats = getEconomicStats(player);
  
  return {
    ...basicStats,
    ...farmingStats,
    ...economicStats
  };
}

function createHeroStats(player: OpenDotaMatchPlayer): PlayerMatchData['heroStats'] {
  return {
    damageDealt: player.hero_damage || 0,
    healingDone: player.hero_healing || 0,
    towerDamage: player.tower_damage || 0
  };
}

function convertPlayer(player: OpenDotaMatchPlayer, roleMap: Record<string, PlayerRole>, items: Record<string, Item>, heroes: Record<string, Hero>): PlayerMatchData {
  const hero = heroes[player.hero_id.toString()];
  
  // Create fallback hero if not found
  const fallbackHero: Hero = {
    id: player.hero_id.toString(),
    name: `Unknown Hero ${player.hero_id}`,
    localizedName: `Unknown Hero ${player.hero_id}`,
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: [],
    imageUrl: ''
  };
  
  const playerHero = hero || fallbackHero;
  const playerItems = getPlayerItems(player, items);
  const stats = createPlayerStats(player);
  const heroStats = createHeroStats(player);
  
  return {
    accountId: player.account_id,
    playerName: player.personaname || `Player ${player.account_id}`,
    hero: playerHero,
    role: roleMap[player.account_id.toString()] || 'unknown',
    items: playerItems,
    stats,
    heroStats
  };
}

function convertDraftData(matchData: OpenDotaMatch, heroes: Record<string, Hero>) {
  const radiantPicks: PlayerMatchData[] = [];
  const direPicks: PlayerMatchData[] = [];
  const radiantBans: string[] = [];
  const direBans: string[] = [];
  
  if (matchData.picks_bans) {
    matchData.picks_bans.forEach(pickBan => {
      const hero = heroes[pickBan.hero_id.toString()];
      if (!hero) return;
      
      if (pickBan.is_pick) {
        const heroPick: PlayerMatchData = {
          accountId: 0, // Will be filled when we have player-hero mapping
          playerName: '', // Will be determined from player slot
          hero,
          role: 'unknown', // Will be determined from player slot
          items: [],
          stats: { kills: 0, deaths: 0, assists: 0, lastHits: 0, denies: 0, gpm: 0, xpm: 0, netWorth: 0, level: 1 },
          heroStats: { damageDealt: 0, healingDone: 0, towerDamage: 0 }
        };
        
        if (pickBan.team === 0) {
          radiantPicks.push(heroPick);
        } else {
          direPicks.push(heroPick);
        }
      } else {
        const heroId = pickBan.hero_id.toString();
        if (pickBan.team === 0) {
          radiantBans.push(heroId);
        } else {
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

function getSideFromPlayerSlot(playerSlot?: number): 'radiant' | 'dire' {
  return playerSlot !== undefined && playerSlot < 128 ? 'radiant' : 'dire';
}

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

function parseBuildingInfo(buildingKey: string): { buildingType: 'tower' | 'barracks'; buildingTier: number; buildingLane: 'top' | 'mid' | 'bottom' } {
  const parts = buildingKey.split('_');
  const buildingType = parts[0] as 'tower' | 'barracks';
  const buildingTier = parseInt(parts[1]) || 1;
  const buildingLane = parts[2] as 'top' | 'mid' | 'bottom';
  
  return {
    buildingType,
    buildingTier,
    buildingLane
  };
}

function createBuildingKillEvent(objective: { time: number; player_slot?: number; key?: string }): MatchEvent | null {
  if (!objective.key) return null;
  
  const buildingInfo = parseBuildingInfo(objective.key);
  
  return {
    timestamp: objective.time,
    type: buildingInfo.buildingType === 'tower' ? 'tower_kill' : 'barracks_kill',
    side: getSideFromPlayerSlot(objective.player_slot),
    details: {
      buildingType: buildingInfo.buildingType,
      buildingTier: buildingInfo.buildingTier,
      buildingLane: buildingInfo.buildingLane
    }
  };
}

function generateEvents(matchData: OpenDotaMatch): MatchEvent[] {
  const events: MatchEvent[] = [];
  
  if (!matchData.objectives) return events;
  
  matchData.objectives.forEach(objective => {
    switch (objective.type) {
      case 'first_blood':
        events.push(createFirstBloodEvent(objective));
        break;
      case 'roshan_kill':
        events.push(createRoshanKillEvent(objective));
        break;
      case 'aegis_pickup':
        events.push(createAegisPickupEvent(objective));
        break;
      case 'building_kill': {
        const buildingEvent = createBuildingKillEvent(objective);
        if (buildingEvent) {
          events.push(buildingEvent);
        }
        break;
      }
    }
  });
  
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const MatchProvider: React.FC<MatchContextProviderProps> = ({ children }) => {
  const state = useMatchState();
  const processing = useMatchProcessing();
  const matchDataFetching = useMatchDataFetching();
  
  const actions = useMatchOperations(state, processing, matchDataFetching);

  const contextValue: MatchContextValue = {
    // State
    matches: state.matches,
    selectedMatchId: state.selectedMatchId,
    setSelectedMatchId: state.setSelectedMatchId,
    isLoading: state.isLoading,
    
    // Core operations
    addMatch: actions.addMatch,
    refreshMatch: actions.refreshMatch,
    parseMatch: actions.parseMatch,
    removeMatch: actions.removeMatch,
    
    // Data access
    getMatch: (matchId: number) => state.matches.get(matchId),
    getMatches: (matchIds: number[]) => matchIds.map(id => state.matches.get(id)).filter((match): match is Match => match !== undefined)
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