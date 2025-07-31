/**
 * Match Processing Logic
 * 
 * Extracted from match-context.tsx to separate complex processing logic
 * from state management. This module handles all data transformation and
 * analysis for match data.
 */

import type { Hero, Item } from '@/types/contexts/constants-context-value';
import type {
  HeroPick,
  Match,
  MatchEvent,
  PlayerMatchData
} from '@/types/contexts/match-context-value';
import type { PlayerRole } from '@/types/contexts/team-context-value';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

interface PlayerAnalysisResult {
  player: OpenDotaMatchPlayer;
  supportScore: number;
}

// ============================================================================
// ADVANTAGE DATA CALCULATION
// ============================================================================

export function calculateAdvantageData(matchData: OpenDotaMatch) {
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

// ============================================================================
// PLAYER ANALYSIS AND ROLE DETECTION
// ============================================================================

function calculateSupportScore(player: OpenDotaMatchPlayer): number {
  return (player.observer_uses || 0) + (player.sentry_uses || 0) * 2;
}

function analyzePlayer(player: OpenDotaMatchPlayer): PlayerAnalysisResult {
  const supportScore = calculateSupportScore(player);
  
  return {
    player,
    supportScore,
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
    // Always assign the first mid player as mid
    roleMap[midPlayers[0].player.account_id.toString()] = 'Mid';
  }
}

function assignSafeLaneRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const safeLanePlayers = playersByLaneRole[1] || [];
  if (safeLanePlayers.length === 0) return;
  
  // Sort players by support score (ascending for carry, descending for support)
  const sortedPlayers = [...safeLanePlayers].sort((a, b) => a.supportScore - b.supportScore);
  
  if (safeLanePlayers.length === 1) {
    // 1 player = carry
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Carry';
  } else if (safeLanePlayers.length === 2) {
    // 2 players = lower support score = carry, higher support score = hard support
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Carry';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'Hard Support';
  }
}

function assignOffLaneRoles(playersByLaneRole: Record<number, PlayerAnalysisResult[]>, roleMap: Record<string, PlayerRole>) {
  const offLanePlayers = playersByLaneRole[3] || [];
  if (offLanePlayers.length === 0) return;
  
  // Sort players by support score (ascending for offlane, descending for support)
  const sortedPlayers = [...offLanePlayers].sort((a, b) => a.supportScore - b.supportScore);
  
  if (offLanePlayers.length === 1) {
    // 1 player = offlane
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Offlane';
  } else if (offLanePlayers.length === 2) {
    // 2 players = lower support score = offlane, higher support score = hard support
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Offlane';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'Support';
  } else if (offLanePlayers.length === 3) {
    // 3 players = lowest support score = offlane, highest support score = hard support, middle support score = support
    roleMap[sortedPlayers[0].player.account_id.toString()] = 'Offlane';
    roleMap[sortedPlayers[1].player.account_id.toString()] = 'Support';
    roleMap[sortedPlayers[2].player.account_id.toString()] = 'Hard Support';
  }
}

function assignRemainingRoles(playerAnalysis: PlayerAnalysisResult[], roleMap: Record<string, PlayerRole>) {
  const unassigned = playerAnalysis.filter(analysis => 
    !roleMap[analysis.player.account_id.toString()]
  );
  
  unassigned.forEach(analysis => {
    if (analysis.player.is_roaming) {
      roleMap[analysis.player.account_id.toString()] = 'Roaming';
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

// ============================================================================
// PLAYER DATA CONVERSION
// ============================================================================

function getPlayerItems(player: OpenDotaMatchPlayer, items: Record<number, Item>): Item[] {
  const itemIds = [
    player.item_0, player.item_1, player.item_2, 
    player.item_3, player.item_4, player.item_5
  ];
  
  return itemIds
    .filter(itemId => itemId !== 0)
    .map(itemId => {
      const item = items[itemId];
      console.log(`Looking for item ${itemId}:`, item);
      return item;
    })
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

export function convertPlayer(
  player: OpenDotaMatchPlayer, 
  roleMap: Record<string, PlayerRole>, 
  items: Record<string, Item>, 
  heroes: Record<string, Hero>
): PlayerMatchData {
  const hero = heroes[player.hero_id.toString()];
  
  const playerHero = hero;
  const playerItems = getPlayerItems(player, items);
  const stats = createPlayerStats(player);
  const heroStats = createHeroStats(player);
  
  return {
    accountId: player.account_id,
    playerName: player.personaname || `Player ${player.account_id}`,
    hero: playerHero,
    role: roleMap[player.account_id.toString()],
    items: playerItems,
    stats,
    heroStats
  };
}

// ============================================================================
// PICK ORDER DETERMINATION
// ============================================================================

/**
 * Determine pick order from draft data
 * Returns which team picked first based on the draft order
 */
export function determinePickOrder(matchData: OpenDotaMatch): {
  radiant: 'first' | 'second' | null;
  dire: 'first' | 'second' | null;
} {
  if (!matchData.picks_bans || matchData.picks_bans.length === 0) {
    return {
      radiant: null,
      dire: null
    };
  }

  // Find the first pick in the draft
  const firstPick = matchData.picks_bans.find(pick => pick.is_pick);
  
  if (!firstPick) {
    return {
      radiant: null,
      dire: null
    };
  }

  // Determine which team made the first pick
  // team === 0 means radiant, team === 1 means dire
  const firstPickTeam = firstPick.team === 0 ? 'radiant' : 'dire';

  return {
    radiant: firstPickTeam === 'radiant' ? 'first' : 'second',
    dire: firstPickTeam === 'dire' ? 'first' : 'second'
  };
}

// ============================================================================
// DRAFT DATA CONVERSION
// ============================================================================

export function convertDraftData(matchData: OpenDotaMatch, heroes: Record<string, Hero>) {
  const radiantPicks: HeroPick[] = [];
  const direPicks: HeroPick[] = [];
  const radiantBans: string[] = [];
  const direBans: string[] = [];
  
  if (matchData.picks_bans) {
    matchData.picks_bans.forEach(pickBan => {
      const hero = heroes[pickBan.hero_id.toString()];
      if (!hero) return;
      
      if (pickBan.is_pick) {
        const heroPick: HeroPick = {
          accountId: 0, // Will be filled when we have player-hero mapping
          hero
          // role will be assigned later when we have player data
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

// ============================================================================
// EVENT GENERATION
// ============================================================================

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
  // Handle different building key formats
  if (buildingKey.includes('tower')) {
    const parts = buildingKey.split('_');
    const tier = parseInt(parts[parts.length - 2]) || 1;
    const buildingLane = parts[parts.length - 1] as 'top' | 'mid' | 'bottom';
    
    return {
      buildingType: 'tower',
      buildingTier: tier,
      buildingLane
    };
  } else if (buildingKey.includes('rax')) {
    const parts = buildingKey.split('_');
    const tier = 1; // Barracks are always tier 1
    const buildingLane = parts[parts.length - 1] as 'top' | 'mid' | 'bottom';
    
    return {
      buildingType: 'barracks',
      buildingTier: tier,
      buildingLane
    };
  } else if (buildingKey.includes('fort')) {
    return {
      buildingType: 'tower',
      buildingTier: 4, // Ancient towers
      buildingLane: 'mid'
    };
  }
  
  // Default fallback
  return {
    buildingType: 'tower',
    buildingTier: 1,
    buildingLane: 'mid'
  };
}

function createBuildingKillEvent(objective: { time: number; player_slot?: number; key?: string }): MatchEvent | null {
  if (!objective.key) return null;
  
  const buildingInfo = parseBuildingInfo(objective.key);
  const side = getSideFromPlayerSlot(objective.player_slot);
  
  return {
    timestamp: objective.time,
    type: buildingInfo.buildingType === 'barracks' ? 'barracks_kill' : 'tower_kill',
    side,
    details: {
      buildingType: buildingInfo.buildingType,
      buildingTier: buildingInfo.buildingTier,
      buildingLane: buildingInfo.buildingLane
    }
  };
}

export function generateEvents(matchData: OpenDotaMatch): MatchEvent[] {
  const events: MatchEvent[] = [];
  
  if (!matchData.objectives) return events;
  
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
        // Skip courier lost events for now as they're less significant
        break;
        
      default:
        // Skip unknown event types
        break;
    }
  });
  
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================================================
// DRAFT AND EVENTS PROCESSING FOR COMPONENTS
// ============================================================================

export interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: string;
  time: number;
}

export interface GameEvent {
  type: 'roshan' | 'aegis' | 'teamfight' | 'tower' | 'barracks' | 'first_blood';
  time: number;
  description: string;
  team?: 'radiant' | 'dire';
}

export interface TeamFightStats {
  radiant: { total: number; wins: number; losses: number };
  dire: { total: number; wins: number; losses: number };
}

function calculateWinsForTeam(fights: MatchEvent[], matchResult: 'radiant' | 'dire'): number {
  return fights.filter(fight => fight.side === matchResult).length;
}

function calculateLossesForTeam(fights: MatchEvent[], matchResult: 'radiant' | 'dire'): number {
  const opposingSide = matchResult === 'radiant' ? 'dire' : 'radiant';
  return fights.filter(fight => fight.side === opposingSide).length;
}

export function processDraftData(match: Match, originalMatchData?: OpenDotaMatch): DraftPhase[] {
  const phases: DraftPhase[] = [];
  
  // If we have access to the original OpenDota data, use it to preserve the exact order
  if (originalMatchData?.picks_bans) {
    originalMatchData.picks_bans.forEach((pickBan, index) => {
      const order = index + 1; // Use the original index from OpenDota
      
      if (pickBan.is_pick) {
        phases.push({
          phase: 'pick',
          team: pickBan.team === 0 ? 'radiant' : 'dire',
          hero: pickBan.hero_id.toString(),
          time: order
        });
      } else {
        phases.push({
          phase: 'ban',
          team: pickBan.team === 0 ? 'radiant' : 'dire',
          hero: pickBan.hero_id.toString(),
          time: order
        });
      }
    });
    
    return phases.sort((a, b) => a.time - b.time);
  }

  return [];
}

export function processGameEvents(match: Match): GameEvent[] {
  return match.events.map(event => ({
    type: mapEventType(event.type),
    time: event.timestamp,
    description: generateEventDescription(event),
    team: event.side === 'neutral' ? undefined : event.side
  }));
}

function mapEventType(eventType: string): GameEvent['type'] {
  switch (eventType) {
    case 'CHAT_MESSAGE_ROSHAN_KILL':
      return 'roshan';
    case 'CHAT_MESSAGE_AEGIS':
      return 'aegis';
    case 'CHAT_MESSAGE_FIRSTBLOOD':
      return 'first_blood';
    case 'building_kill':
      // Check if it's a barracks or tower based on the key
      return 'tower'; // Default to tower, will be refined in createBuildingKillEvent
    default:
      return 'teamfight';
  }
}

function getTeamName(side: 'radiant' | 'dire' | 'neutral'): string {
  return side === 'radiant' ? 'Radiant' : 'Dire';
}

function generateEventDescription(event: MatchEvent): string {
  const teamName = getTeamName(event.side);
  
  switch (event.type) {
    case 'roshan_kill':
      return `${teamName} killed Roshan`;
    case 'aegis_pickup':
      return `Aegis picked up by ${event.details.aegisHolder || 'unknown player'}`;
    case 'team_fight':
      return `Team fight at ${event.timestamp}s - ${teamName} victory`;
    case 'tower_kill':
      return `${teamName} destroyed ${event.details.buildingType || 'tower'}`;
    case 'barracks_kill':
      return `${teamName} destroyed barracks`;
    case 'first_blood':
      return `${teamName} got first blood`;
    default:
      return `Event at ${event.timestamp}s`;
  }
}

export function calculateTeamFightStats(match: Match): TeamFightStats {
  const teamFightEvents = match.events.filter(e => e.type === 'team_fight');
  
  const radiantFights = teamFightEvents.filter(e => e.side === 'radiant');
  const direFights = teamFightEvents.filter(e => e.side === 'dire');
  
  return {
    radiant: {
      total: radiantFights.length,
      wins: calculateWinsForTeam(radiantFights, match.result),
      losses: calculateLossesForTeam(radiantFights, match.result)
    },
    dire: {
      total: direFights.length,
      wins: calculateWinsForTeam(direFights, match.result),
      losses: calculateLossesForTeam(direFights, match.result)
    }
  };
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

export function processMatchData(
  matchData: OpenDotaMatch,
  heroes: Record<string, Hero>,
  items: Record<string, Item>
): Match {
  // Separate radiant and dire players
  const radiantPlayers = matchData.players.filter(player => player.isRadiant);
  const direPlayers = matchData.players.filter(player => !player.isRadiant);

  // Calculate advantage data
  const { goldAdvantage, experienceAdvantage } = calculateAdvantageData(matchData);

  // Determine pick order
  const pickOrder = determinePickOrder(matchData);

  // Convert draft data
  const { radiantPicks, direPicks, radiantBans, direBans } = convertDraftData(matchData, heroes);

  // Generate events
  const events = generateEvents(matchData);

  // Detect roles for each team
  const radiantRoleMap = detectTeamRoles(radiantPlayers);
  const direRoleMap = detectTeamRoles(direPlayers);

  // Update draft picks with correct roles
  radiantPicks.forEach(pick => {
    const player = radiantPlayers.find(p => p.hero_id.toString() === pick.hero.id);
    if (player) {
      const role = radiantRoleMap[player.account_id.toString()];
      if (role) {
        pick.role = role;
      } else {
        // Remove role if we don't have valid data
        delete pick.role;
      }
    } else {
      // Remove role if we can't find the player
      delete pick.role;
    }
  });

  direPicks.forEach(pick => {
    const player = direPlayers.find(p => p.hero_id.toString() === pick.hero.id);
    if (player) {
      const role = direRoleMap[player.account_id.toString()];
      if (role) {
        pick.role = role;
      } else {
        // Remove role if we don't have valid data
        delete pick.role;
      }
    } else {
      // Remove role if we can't find the player
      delete pick.role;
    }
  });

  // Create the base match object
  const match: Match = {
    id: matchData.match_id,
    date: new Date(matchData.start_time * 1000).toISOString(),
    duration: matchData.duration,
    radiant: {
      id: matchData.radiant_team_id || 0,
      name: matchData.radiant_name || '',
    },
    dire: {
      id: matchData.dire_team_id || 0,
      name: matchData.dire_name || '',
    },
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
    result: matchData.radiant_win ? 'radiant' : 'dire',
    pickOrder
  };

  // Process additional data for components
  const processedDraft = processDraftData(match, matchData);
  const processedEvents = processGameEvents(match);
  const teamFightStats = calculateTeamFightStats(match);

  return {
    ...match,
    processedDraft,
    processedEvents,
    teamFightStats
  };
} 