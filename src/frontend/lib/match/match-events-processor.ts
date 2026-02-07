/**
 * Match Events Processor
 *
 * Processes match objectives into events
 */

import type { Hero, Match, MatchEvent, GameEvent } from '@/frontend/lib/app-data/app-data-types';
import type { OpenDotaMatch } from '@/types/external-apis';

type OpenDotaObjective = NonNullable<OpenDotaMatch['objectives']>[number];

/**
 * Get team name from side
 */
function getTeamName(side: 'radiant' | 'dire' | 'neutral'): string {
  if (side === 'radiant') return 'Radiant';
  if (side === 'dire') return 'Dire';
  return 'Neutral';
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
  objective: OpenDotaObjective,
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
function createRoshanKillEvent(objective: OpenDotaObjective): MatchEvent {
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
  objective: OpenDotaObjective,
  players: OpenDotaMatch['players'],
  heroes?: Map<number, Hero>,
): MatchEvent {
  const aegisHolder =
    objective.player_slot !== undefined
      ? getPlayerNameFromPlayerSlot(objective.player_slot, players)
      : 'unknown player';
  let aegisHolderHero: Hero | undefined;
  if (objective.player_slot !== undefined && heroes) {
    const player = players.find((p) => p.player_slot === objective.player_slot);
    if (player) {
      aegisHolderHero = heroes.get(player.hero_id);
    }
  }

  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { aegisHolder, aegisHolderHero },
  };
}

/**
 * Create building kill event
 */
function createBuildingKillEvent(objective: OpenDotaObjective): MatchEvent | null {
  if (!objective.unit) return null;

  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { buildingType: objective.unit as 'tower' | 'barracks' | undefined },
  };
}

/**
 * Create team fight event
 */
function createTeamFightEvent(teamfight: {
  start: number;
  end: number;
  deaths: number;
  players: Array<{
    deaths: number;
    buybacks: number;
    gold_delta: number;
    xp_delta: number;
    damage: number;
    healing: number;
  }>;
}): MatchEvent {
  const duration = teamfight.end - teamfight.start;
  const playerDetails = teamfight.players.map((player, index) => ({
    playerIndex: index,
    deaths: player.deaths || 0,
    buybacks: player.buybacks || 0,
    goldDelta: player.gold_delta || 0,
    xpDelta: player.xp_delta || 0,
    damage: player.damage || 0,
    healing: player.healing || 0,
  }));
  return {
    timestamp: teamfight.start,
    type: 'team_fight',
    side: 'neutral',
    details: {
      participants: teamfight.players.map((_, index) => index.toString()),
      duration,
      casualties: teamfight.deaths,
      playerDetails,
    },
  };
}

function getObjectiveEvent(
  objective: OpenDotaObjective,
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): MatchEvent | null {
  switch (objective.type) {
    case 'CHAT_MESSAGE_FIRSTBLOOD':
      return createFirstBloodEvent(objective, players, heroes);
    case 'CHAT_MESSAGE_ROSHAN_KILL':
      return createRoshanKillEvent(objective);
    case 'CHAT_MESSAGE_AEGIS':
      return createAegisPickupEvent(objective, players, heroes);
    case 'building_kill':
      return createBuildingKillEvent(objective);
    case 'CHAT_MESSAGE_COURIER_LOST':
    default:
      return null;
  }
}

/**
 * Generate events from OpenDota objectives
 */
export function generateEvents(matchData: OpenDotaMatch, heroes: Map<number, Hero>): MatchEvent[] {
  const events: MatchEvent[] = [];

  const objectives = matchData.objectives ?? [];
  for (const objective of objectives) {
    const event = getObjectiveEvent(objective, matchData.players, heroes);
    if (event) {
      events.push(event);
    }
  }

  // Process teamfights
  if (matchData.teamfights) {
    matchData.teamfights.forEach((teamfight) => {
      events.push(createTeamFightEvent(teamfight));
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
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
    details: event.details,
  }));
}
