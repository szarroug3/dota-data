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

function capitalizeWords(raw: string): string {
  return raw
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim();
}

/**
 * Generate event description for display
 */
function generateEventDescription(event: MatchEvent): string {
  const teamName = getTeamName(event.side);
  const handlers: Record<string, () => string> = {
    CHAT_MESSAGE_ROSHAN_KILL: () => `${teamName} killed Roshan`,
    CHAT_MESSAGE_AEGIS: () =>
      `Aegis picked up by ${event.details.aegisHolderHero?.localizedName || event.details.aegisHolder || 'Unknown Hero'}`,
    building_kill: () => `${teamName} destroyed ${event.details.buildingType || 'building'}`,
    CHAT_MESSAGE_FIRSTBLOOD: () =>
      `First Blood: ${event.details.killer || 'unknown player'} killed ${event.details.victim || 'unknown player'}`,
    team_fight: () => 'Team Fight',
  } as const;
  return (handlers as Record<string, () => string>)[event.type]?.() || `Event at ${event.timestamp}s`;
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
): { heroName: string; hero?: Hero; playerPersona?: string } {
  const player = players.find((p) => p.player_slot === playerSlot);
  if (!player) return { heroName: 'Unknown Hero', hero: undefined, playerPersona: undefined };
  const hero = heroes.get(player.hero_id);
  return { heroName: hero?.localizedName || 'Unknown Hero', hero, playerPersona: player.personaname };
}

/**
 * Get player name from player slot
 */
function getPlayerIdentityFromPlayerSlot(
  playerSlot: number,
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): { label: string; hero?: Hero } {
  const player = players.find((p) => p.player_slot === playerSlot);
  if (!player) return { label: 'Unknown Player' };
  const hero = heroes.get(player.hero_id);
  const persona = player.personaname?.trim();
  const base = persona || hero?.localizedName || `Player ${player.account_id || 'Unknown'}`;
  return { label: base, hero };
}

/**
 * Create first blood event
 */
function createFirstBloodEvent(
  objective: { time: number; player_slot?: number; slot?: number; type: string },
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): MatchEvent {
  const killerSlot = objective.player_slot ?? objective.slot;

  const primary = resolveFirstBloodPrimary(killerSlot, objective.time, players, heroes);
  let killerName = primary.killerName;
  let killerHero = primary.killerHero;
  let victimName = primary.victimName;
  let victimHero = primary.victimHero;

  if (needsFallback(killerName, victimName, players)) {
    const fallback = resolveFirstBloodFallback(players, heroes);
    if (fallback) {
      killerName = fallback.killerName;
      killerHero = fallback.killerHero;
      victimName = fallback.victimName;
      victimHero = fallback.victimHero;
    }
  }

  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(killerSlot),
    details: { killer: killerName, victim: victimName, killerHero, victimHero },
  };
}

function resolveFirstBloodPrimary(
  killerSlot: number | undefined,
  time: number,
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): { killerName: string; killerHero?: Hero; victimName: string; victimHero?: Hero } {
  if (killerSlot === undefined) return { killerName: 'Unknown Player', victimName: 'Unknown Player' };
  const { heroName, hero, playerPersona } = getHeroNameFromPlayerSlot(killerSlot, players, heroes);
  const killer = players.find((p) => p.player_slot === killerSlot);
  let victimName = 'Unknown Player';
  let victimHero: Hero | undefined;
  if (killer?.kills_log) {
    const firstKill = killer.kills_log.find((k) => k.time === time);
    if (firstKill?.key) {
      const heroKey = firstKill.key.replace('npc_dota_hero_', '');
      victimHero = Array.from(heroes.values()).find((h) => h.name.replace('npc_dota_hero_', '') === heroKey);
      victimName = victimHero?.localizedName || capitalizeWords(heroKey.replace(/_/g, ' '));
    }
  }
  return { killerName: playerPersona || heroName, killerHero: hero, victimName, victimHero };
}

function needsFallback(killerName: string, victimName: string, players: OpenDotaMatch['players']): boolean {
  return (
    (killerName === 'Unknown Player' || victimName === 'Unknown Player') && players.some((p) => p.kills_log?.length)
  );
}

function resolveFirstBloodFallback(
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
): { killerName: string; killerHero?: Hero; victimName: string; victimHero?: Hero } | null {
  let earliest: { time: number; killer: typeof players[number]; entry: { time: number; key: string } } | null = null;
  for (const p of players) {
    if (!p.kills_log) continue;
    for (const entry of p.kills_log) {
      if (!earliest || entry.time < earliest.time) {
        earliest = { time: entry.time, killer: p, entry };
      }
    }
  }
  if (!earliest) return null;
  const { killer, entry } = earliest;
  const { heroName, hero, playerPersona } = getHeroNameFromPlayerSlot(killer.player_slot, players, heroes);
  const victimKey = entry.key.replace('npc_dota_hero_', '');
  const victimHero = Array.from(heroes.values()).find((h) => h.name.replace('npc_dota_hero_', '') === victimKey);
  const victimName = victimHero?.localizedName || capitalizeWords(victimKey.replace(/_/g, ' '));
  return { killerName: playerPersona || heroName, killerHero: hero, victimName, victimHero };
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
  heroes: Map<number, Hero>,
): MatchEvent {
  let aegisHolder = 'Unknown Player';
  let aegisHolderHero: Hero | undefined;
  if (objective.player_slot !== undefined) {
    const identity = getPlayerIdentityFromPlayerSlot(objective.player_slot, players, heroes);
    aegisHolder = identity.label;
    aegisHolderHero = identity.hero;
  }
  return {
    timestamp: objective.time,
    type: objective.type as MatchEvent['type'],
    side: getSideFromPlayerSlot(objective.player_slot),
    // Store hero localized name in aegisHolder for uniform hero-based display
    details: { aegisHolder: aegisHolderHero?.localizedName || aegisHolder, aegisHolderHero },
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
        events.push(createAegisPickupEvent(objective, matchData.players, heroes));
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
    details: event.details,
  }));
}
