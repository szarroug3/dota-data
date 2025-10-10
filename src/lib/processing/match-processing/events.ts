import type { Hero, EventType, MatchEvent } from '@/frontend/lib/app-data-types';
import type { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

function getSideFromPlayerSlot(playerSlot?: number): 'radiant' | 'dire' {
  return playerSlot !== undefined && playerSlot < 128 ? 'radiant' : 'dire';
}

function getHeroNameFromPlayerSlot(
  playerSlot: number,
  players: OpenDotaMatchPlayer[],
  heroes: Record<string, Hero>,
): string {
  const player = players.find((p) => p.player_slot === playerSlot);
  if (!player) return 'unknown player';
  const hero = heroes[player.hero_id.toString()];
  return hero ? hero.localizedName : 'unknown hero';
}

export function createFirstBloodEvent(
  objective: { time: number; player_slot?: number; slot?: number; type: string },
  players: OpenDotaMatchPlayer[],
  heroes: Record<string, Hero>,
  heroesByName: Record<string, Hero>,
): MatchEvent {
  const killerSlot = objective.player_slot ?? objective.slot;
  const killerName =
    killerSlot !== undefined ? getHeroNameFromPlayerSlot(killerSlot, players, heroes) : 'unknown player';

  let victimName = 'unknown player';
  let victimHero: Hero | undefined;
  let killerHero: Hero | undefined;

  if (killerSlot !== undefined) {
    const killer = players.find((p) => p.player_slot === killerSlot);
    if (killer) {
      killerHero = heroes[killer.hero_id.toString()];
      victimHero = resolveFirstBloodVictim(killer, objective.time, heroesByName);
      if (victimHero) victimName = victimHero.localizedName;
    }
  }

  return {
    timestamp: objective.time,
    type: objective.type as EventType,
    side: getSideFromPlayerSlot(killerSlot),
    details: { killer: killerName, victim: victimName, killerHero, victimHero },
  };
}

function resolveFirstBloodVictim(
  killer: OpenDotaMatchPlayer,
  time: number,
  heroesByName: Record<string, Hero>,
): Hero | undefined {
  if (!killer.kills_log) return undefined;
  const firstKill = killer.kills_log.find((kill) => kill.time === time);
  if (!firstKill?.key) return undefined;
  const normalizedKey = firstKill.key.startsWith('npc_dota_hero_')
    ? firstKill.key
    : `npc_dota_hero_${firstKill.key.replace('npc_dota_hero_', '')}`;
  return heroesByName[normalizedKey];
}

export function createRoshanKillEvent(objective: { time: number; player_slot?: number; type: string }): MatchEvent {
  return {
    timestamp: objective.time,
    type: objective.type as EventType,
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { roshanKiller: getSideFromPlayerSlot(objective.player_slot) },
  };
}

export function createAegisPickupEvent(
  objective: { time: number; player_slot?: number; type: string },
  players: OpenDotaMatchPlayer[],
  heroes: Record<string, Hero>,
): MatchEvent {
  const holderName =
    objective.player_slot !== undefined
      ? getHeroNameFromPlayerSlot(objective.player_slot, players, heroes)
      : 'unknown player';
  let aegisHolderHero: Hero | undefined;
  if (objective.player_slot !== undefined) {
    const holder = players.find((p) => p.player_slot === objective.player_slot);
    if (holder) {
      aegisHolderHero = heroes[holder.hero_id.toString()];
    }
  }
  return {
    timestamp: objective.time,
    type: objective.type as EventType,
    side: getSideFromPlayerSlot(objective.player_slot),
    details: { aegisHolder: holderName, aegisHolderHero },
  };
}

function parseBuildingInfo(buildingKey: string): {
  buildingType: 'tower' | 'barracks';
  buildingTier: number;
  buildingLane: 'top' | 'mid' | 'bottom';
} {
  if (buildingKey.includes('tower')) {
    const parts = buildingKey.split('_');
    const tier = parseInt(parts[parts.length - 2]) || 1;
    const buildingLane = parts[parts.length - 1] as 'top' | 'mid' | 'bottom';
    return { buildingType: 'tower', buildingTier: tier, buildingLane };
  } else if (buildingKey.includes('rax')) {
    const parts = buildingKey.split('_');
    const tier = 1;
    const buildingLane = parts[parts.length - 1] as 'top' | 'mid' | 'bottom';
    return { buildingType: 'barracks', buildingTier: tier, buildingLane };
  } else if (buildingKey.includes('fort')) {
    return { buildingType: 'tower', buildingTier: 4, buildingLane: 'mid' };
  }
  return { buildingType: 'tower', buildingTier: 1, buildingLane: 'mid' };
}

export function createBuildingKillEvent(objective: {
  time: number;
  player_slot?: number;
  key?: string;
  type: string;
}): MatchEvent | null {
  if (!objective.key) return null;
  const buildingInfo = parseBuildingInfo(objective.key);
  const side = getSideFromPlayerSlot(objective.player_slot);
  return {
    timestamp: objective.time,
    type: objective.type as EventType,
    side,
    details: {
      buildingType: buildingInfo.buildingType,
      buildingTier: buildingInfo.buildingTier,
      buildingLane: buildingInfo.buildingLane,
    },
  };
}

type TeamfightPlayerMetrics = {
  deaths?: number;
  buybacks?: number;
  gold_delta?: number;
  xp_delta?: number;
  damage?: number;
  healing?: number;
};

export function createTeamFightEvent(teamfight: {
  start: number;
  end: number;
  deaths: number;
  players: TeamfightPlayerMetrics[];
}): MatchEvent {
  const duration = teamfight.end - teamfight.start;
  const side: 'radiant' | 'dire' = 'radiant'; // Neutral events attributed to radiant for now
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
    side,
    details: {
      participants: teamfight.players.map((_, index) => index.toString()),
      duration,
      casualties: teamfight.deaths,
      playerDetails,
    },
  };
}

export function generateEvents(
  matchData: OpenDotaMatch,
  heroes: Record<string, Hero>,
  heroesByName: Record<string, Hero>,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  if (matchData.objectives) {
    matchData.objectives.forEach((objective) => {
      switch (objective.type) {
        case 'CHAT_MESSAGE_FIRSTBLOOD':
          events.push(createFirstBloodEvent(objective, matchData.players, heroes, heroesByName));
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
          break;
        default:
          break;
      }
    });
  }
  if (matchData.teamfights) {
    matchData.teamfights.forEach((teamfight) => {
      events.push(createTeamFightEvent(teamfight));
    });
  }
  return events.sort((a, b) => a.timestamp - b.timestamp);
}
