/**
 * Match Events Processor
 *
 * Processes match objectives into events
 */

import type { OpenDotaMatch } from '@/types/external-apis';

import type { Hero, Match, MatchEvent, GameEvent } from './app-data-types';

/**
 * Get team name from side
 */
function getTeamName(side: 'radiant' | 'dire'): string {
  return side === 'radiant' ? 'Radiant' : 'Dire';
}

/**
 * Generate event description for display
 */
function generateEventDescription(event: MatchEvent): string {
  const teamName = getTeamName(event.side);

  switch (event.type) {
    case 'CHAT_MESSAGE_ROSHAN_KILL':
      return `${teamName} killed Roshan`;
    case 'CHAT_MESSAGE_AEGIS':
      return `Aegis picked up by ${event.details.aegisHolder || 'unknown player'}`;
    case 'building_kill':
      return `${teamName} destroyed ${event.details.buildingType || 'building'}`;
    case 'CHAT_MESSAGE_FIRSTBLOOD':
      return `First Blood: ${event.details.killer || 'unknown player'} killed ${event.details.victim || 'unknown player'}`;
    case 'team_fight':
      return `Team Fight`;
    default:
      return `Event at ${event.timestamp}s`;
  }
}

/**
 * Get side from player slot
 */
function getSideFromPlayerSlot(playerSlot?: number): 'radiant' | 'dire' {
  return playerSlot !== undefined && playerSlot < 128 ? 'radiant' : 'dire';
}

/**
 * Get hero name from player slot
 */
function getHeroNameFromPlayerSlot(
  playerSlot: number,
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): string {
  const player = players.find((p) => p.player_slot === playerSlot);
  if (!player) return 'unknown player';
  const hero = heroes.get(player.hero_id);
  return hero ? hero.localizedName : 'unknown hero';
}

/**
 * Get player name from player slot
 */
function getPlayerNameFromPlayerSlot(playerSlot: number, players: OpenDotaMatch['players']): string {
  const player = players.find((p) => p.player_slot === playerSlot);
  if (!player) return 'unknown player';
  return player.personaname || `Player ${player.account_id || 'Unknown'}`;
}

/**
 * Create first blood event
 */
function createFirstBloodEvent(
  objective: { time: number; player_slot?: number; slot?: number; type: string },
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): MatchEvent {
  const killerName =
    objective.player_slot !== undefined
      ? getHeroNameFromPlayerSlot(objective.player_slot, players, heroes)
      : 'unknown player';
  let victimName = 'unknown player';
  let victimHero: Hero | undefined;
  let killerHero: Hero | undefined;

  if (objective.player_slot !== undefined) {
    const killer = players.find((p) => p.player_slot === objective.player_slot);
    if (killer) {
      killerHero = heroes.get(killer.hero_id);
      if (killer.kills_log && killer.kills_log.length > 0) {
        const firstKill = killer.kills_log.find((kill) => kill.time === objective.time);
        if (firstKill && firstKill.key) {
          // Find hero by name in the key
          const heroName = firstKill.key.replace('npc_dota_hero_', '');
          victimHero = Array.from(heroes.values()).find((h) => h.name === heroName);
          victimName = victimHero ? victimHero.localizedName : heroName;
        }
      }
    }
  }

  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { killer: killerName, victim: victimName, killerHero, victimHero },
  };
}

/**
 * Create Roshan kill event
 */
function createRoshanKillEvent(objective: { time: number; player_slot?: number; type: string }): MatchEvent {
  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    details: {},
  };
}

/**
 * Create Aegis pickup event
 */
function createAegisPickupEvent(
  objective: { time: number; player_slot?: number; type: string },
  players: OpenDotaMatch['players'],
): MatchEvent {
  const aegisHolder =
    objective.player_slot !== undefined
      ? getPlayerNameFromPlayerSlot(objective.player_slot, players)
      : 'unknown player';

  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { aegisHolder },
  };
}

/**
 * Create building kill event
 */
function createBuildingKillEvent(objective: {
  time: number;
  player_slot?: number;
  type: string;
  unit?: string;
}): MatchEvent | null {
  if (!objective.unit) return null;

  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { buildingType: objective.unit as 'tower' | 'barracks' | undefined },
  };
}

/**
 * Generate events from OpenDota objectives
 */
export function generateEvents(matchData: OpenDotaMatch, heroes: Map<number, Hero>): MatchEvent[] {
  const events: MatchEvent[] = [];

  if (!matchData.objectives) {
    return events;
  }

  for (const objective of matchData.objectives) {
    switch (objective.type) {
      case 'CHAT_MESSAGE_FIRSTBLOOD':
        events.push(createFirstBloodEvent(objective, matchData.players, heroes));
        break;
      case 'CHAT_MESSAGE_ROSHAN_KILL':
        events.push(createRoshanKillEvent(objective));
        break;
      case 'CHAT_MESSAGE_AEGIS':
        events.push(createAegisPickupEvent(objective, matchData.players));
        break;
      case 'building_kill': {
        const buildingEvent = createBuildingKillEvent(objective);
        if (buildingEvent) {
          events.push(buildingEvent);
        }
        break;
      }
      case 'CHAT_MESSAGE_COURIER_LOST':
        // Skip courier lost events
        break;
      default:
        // Skip unknown event types
        break;
    }
  }

  return events;
}

/**
 * Process game events for UI display using new Match format
 */
export function processGameEvents(match: Match): GameEvent[] {
  if (!match.events) {
    return [];
  }

  return match.events.map((event) => ({
    type: event.type,
    time: event.timestamp,
    description: generateEventDescription(event),
    team: event.side,
  }));
}
