/**
 * Match Loader
 *
 * Handles fetching and processing match data for AppData.
 * Includes in-flight request deduplication to prevent duplicate API calls.
 */

import { detectTeamRoles } from '@/lib/processing/match-processing/roles';
import type { OpenDotaMatch } from '@/types/external-apis';

import type { DraftPhase, Hero, Item, Match, PlayerMatchData } from './app-data-types';
import { generateEvents, processGameEvents } from './match-events-processor';

// ============================================================================
// IN-FLIGHT REQUEST CACHE
// ============================================================================

const inFlightMatchRequests = new Map<number, Promise<Match | null>>();

// ============================================================================
// FETCH MATCH DATA
// ============================================================================

/**
 * Fetches match data from the API
 *
 * @param matchId - Match ID to fetch
 * @param force - If true, bypasses cache and fetches fresh data
 * @returns Match data or null on error
 */
async function fetchMatchData(matchId: number, force = false): Promise<OpenDotaMatch | null> {
  try {
    const url = force ? `/api/matches/${matchId}?force=true` : `/api/matches/${matchId}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch match ${matchId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as OpenDotaMatch;
  } catch (error) {
    console.error(`Error fetching match ${matchId}:`, error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines if a player is on the Radiant team
 */
function isRadiantPlayer(player: OpenDotaMatch['players'][number]): boolean {
  return typeof player.isRadiant === 'boolean' ? player.isRadiant : player.player_slot < 128;
}

/**
 * Finds the player who played a specific hero on a team
 */
function findPlayerForHero(
  players: OpenDotaMatch['players'],
  heroId: number,
  team: 0 | 1,
): OpenDotaMatch['players'][number] | undefined {
  return players.find((p) => {
    const isCorrectTeam = team === 0 ? isRadiantPlayer(p) : !isRadiantPlayer(p);
    return isCorrectTeam && p.hero_id === heroId;
  });
}

/**
 * Creates role object for a pick if role data is available
 */
function createRoleObject(
  player: OpenDotaMatch['players'][number] | undefined,
  roleMap: Record<string, string>,
): { role: string; lane: number } | undefined {
  if (!player || player.lane === undefined || player.lane === null) return undefined;
  const accountIdStr = player.account_id?.toString();
  const detectedRole = accountIdStr ? roleMap[accountIdStr] : undefined;
  return detectedRole ? { role: detectedRole, lane: player.lane } : undefined;
}

/**
 * Processes draft picks for a team and matches them to players
 */
function processPicks(
  picksBans: OpenDotaMatch['picks_bans'],
  team: 0 | 1,
  players: OpenDotaMatch['players'],
  heroes: Map<number, Hero>,
  roleMap: Record<string, string>,
) {
  const picks = picksBans?.filter((pb) => pb.is_pick && pb.team === team).sort((a, b) => a.order - b.order) ?? [];

  return picks
    .map((pb, idx) => {
      const player = findPlayerForHero(players, pb.hero_id, team);
      const hero = heroes.get(pb.hero_id);

      if (!hero) {
        console.warn(`Hero ${pb.hero_id} not found in heroes map`);
        return null;
      }

      return {
        hero,
        order: idx + 1,
        accountId: player?.account_id ?? 0,
        role: createRoleObject(player, roleMap),
      };
    })
    .filter((pick): pick is NonNullable<typeof pick> => pick !== null);
}

/**
 * Processes draft bans for a team
 */
function processBans(picksBans: OpenDotaMatch['picks_bans'], team: 0 | 1, heroes: Map<number, Hero>) {
  const bans = picksBans?.filter((pb) => !pb.is_pick && pb.team === team) ?? [];
  return bans
    .map((pb) => {
      const hero = heroes.get(pb.hero_id);
      if (!hero) {
        console.warn(`Hero ${pb.hero_id} not found in heroes map`);
        return null;
      }
      return hero;
    })
    .filter((hero): hero is Hero => hero !== null);
}

/**
 * Calculates gold and experience advantage over time
 */
function calculateAdvantageData(goldData?: number[], xpData?: number[]) {
  if (!goldData || !xpData || goldData.length === 0) {
    return {
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
    };
  }

  const times = goldData.map((_, idx) => idx * 60); // Every minute
  return {
    goldAdvantage: {
      times,
      radiantGold: goldData,
      direGold: goldData.map((val) => -val), // Invert for dire
    },
    experienceAdvantage: {
      times,
      radiantExperience: xpData,
      direExperience: xpData.map((val) => -val),
    },
  };
}

/**
 * Extracts and validates player items from raw OpenDota player data
 */
function getPlayerItems(player: OpenDotaMatch['players'][number], items: Map<number, Item>): Item[] {
  const itemIds = [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5].filter(
    (id) => id > 0,
  );
  return itemIds.map((id) => items.get(id)).filter((item): item is Item => item !== undefined);
}

/**
 * Extracts player statistics from raw OpenDota player data
 */
function getPlayerStats(player: OpenDotaMatch['players'][number]) {
  return {
    kills: player.kills ?? 0,
    deaths: player.deaths ?? 0,
    assists: player.assists ?? 0,
    lastHits: player.last_hits ?? 0,
    denies: player.denies ?? 0,
    gpm: player.gold_per_min ?? 0,
    xpm: player.xp_per_min ?? 0,
    netWorth: player.total_gold ?? 0,
    level: player.level ?? 0,
  };
}

/**
 * Extracts hero-specific statistics from raw OpenDota player data
 */
function getPlayerHeroStats(player: OpenDotaMatch['players'][number]) {
  return {
    damageDealt: player.hero_damage ?? 0,
    healingDone: player.hero_healing ?? 0,
    towerDamage: player.tower_damage ?? 0,
  };
}

/**
 * Converts a raw OpenDota player to AppData player format
 */
function convertPlayer(
  player: OpenDotaMatch['players'][number],
  heroes: Map<number, Hero>,
  items: Map<number, Item>,
  roleMap: Record<string, string>,
): PlayerMatchData | null {
  // Look up full Hero object
  const hero = heroes.get(player.hero_id);
  if (!hero) {
    console.warn(`Hero ${player.hero_id} not found for player ${player.account_id}`);
    return null;
  }

  // Get player items and role
  const playerItems = getPlayerItems(player, items);
  const accountIdStr = player.account_id?.toString();
  const detectedRole = accountIdStr ? roleMap[accountIdStr] : undefined;

  return {
    accountId: player.account_id,
    playerName: player.personaname ?? player.name ?? `Player ${player.account_id}`,
    hero,
    role:
      player.lane !== undefined && player.lane !== null && detectedRole
        ? { role: detectedRole, lane: player.lane }
        : undefined,
    stats: getPlayerStats(player),
    items: playerItems,
    heroStats: getPlayerHeroStats(player),
  };
}

/**
 * Calculates pick order information from draft data
 * Determines which team picked first and second based on the draft order
 */
function calculatePickOrder(picksBans: OpenDotaMatch['picks_bans']) {
  if (!picksBans || picksBans.length === 0) {
    return undefined;
  }

  const firstPick = picksBans.find((pb) => pb.is_pick);
  if (!firstPick) {
    return undefined;
  }

  return {
    radiant: firstPick.team === 0 ? 'first' : 'second',
    dire: firstPick.team === 1 ? 'first' : 'second',
  } as const;
}

/**
 * Process draft picks and bans into a timeline format for UI display
 * Converts hero IDs to full Hero objects for display
 */
function processDraftTimeline(picksBans: OpenDotaMatch['picks_bans'], heroes: Map<number, Hero>): DraftPhase[] {
  if (!picksBans || picksBans.length === 0) {
    return [];
  }

  return picksBans
    .map((pb) => {
      const hero = heroes.get(pb.hero_id);
      if (!hero) {
        console.warn(`Hero not found for ID: ${pb.hero_id}`);
        return null;
      }

      return {
        phase: pb.is_pick ? 'pick' : 'ban',
        team: pb.team === 0 ? 'radiant' : 'dire',
        hero,
        time: pb.order + 1,
      } as DraftPhase;
    })
    .filter((phase): phase is DraftPhase => phase !== null);
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Processes raw OpenDota match data into AppData Match format
 *
 * @param matchData - Raw match data from OpenDota API
 * @param heroes - Map of hero ID to Hero object for lookup
 * @param items - Map of item ID to Item object for lookup
 * @returns Processed Match object
 *
 */
export function processMatchData(matchData: OpenDotaMatch, heroes: Map<number, Hero>, items: Map<number, Item>): Match {
  // Separate radiant and dire players
  const radiantPlayers = matchData.players.filter(isRadiantPlayer);
  const direPlayers = matchData.players.filter((p) => !isRadiantPlayer(p));

  // Detect roles for each team
  const radiantRoles = detectTeamRoles(radiantPlayers);
  const direRoles = detectTeamRoles(direPlayers);

  // Process draft (match heroes to players)
  const radiantPicks = processPicks(matchData.picks_bans, 0, matchData.players, heroes, radiantRoles);
  const direPicks = processPicks(matchData.picks_bans, 1, matchData.players, heroes, direRoles);
  const radiantBans = processBans(matchData.picks_bans, 0, heroes);
  const direBans = processBans(matchData.picks_bans, 1, heroes);

  // Calculate advantages
  const { goldAdvantage, experienceAdvantage } = calculateAdvantageData(
    matchData.radiant_gold_adv,
    matchData.radiant_xp_adv,
  );

  // Calculate pick order
  const pickOrder = calculatePickOrder(matchData.picks_bans);

  // Process draft timeline with full Hero objects
  const processedDraft = processDraftTimeline(matchData.picks_bans, heroes);

  // Generate events from objectives
  const events = generateEvents(matchData, heroes);

  // Build the match object first (needed for processGameEvents)
  const match: Match = {
    id: matchData.match_id,
    date: new Date(matchData.start_time * 1000).toISOString(),
    duration: matchData.duration,
    radiant: {
      id: matchData.radiant_team_id,
      name: matchData.radiant_name,
    },
    dire: {
      id: matchData.dire_team_id,
      name: matchData.dire_name,
    },
    draft: {
      radiantPicks,
      direPicks,
      radiantBans,
      direBans,
    },
    players: {
      radiant: radiantPlayers
        .map((p) => convertPlayer(p, heroes, items, radiantRoles))
        .filter((p): p is PlayerMatchData => p !== null),
      dire: direPlayers
        .map((p) => convertPlayer(p, heroes, items, direRoles))
        .filter((p): p is PlayerMatchData => p !== null),
    },
    statistics: {
      radiantScore: matchData.radiant_score,
      direScore: matchData.dire_score,
      goldAdvantage,
      experienceAdvantage,
    },
    events,
    result: matchData.radiant_win ? 'radiant' : 'dire',
    pickOrder,
    processedDraft,
  };

  // Process events into game events for UI display
  const processedEvents = processGameEvents(match);
  match.processedEvents = processedEvents;

  return match;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Fetches and processes match data with in-flight request deduplication
 *
 * @param matchId - Match ID to load
 * @param heroes - Map of hero ID to Hero object for lookup
 * @param items - Map of item ID to Item object for lookup
 * @param force - If true, bypasses cache and in-flight deduplication to fetch fresh data
 * @returns Processed Match object or null on error
 */
export async function fetchAndProcessMatch(
  matchId: number,
  heroes: Map<number, Hero>,
  items: Map<number, Item>,
  force = false,
): Promise<Match | null> {
  // Skip in-flight deduplication if force=true (we want fresh data)
  if (!force) {
    const existingRequest = inFlightMatchRequests.get(matchId);
    if (existingRequest) {
      return existingRequest;
    }
  }

  // Create new request
  const request = (async () => {
    try {
      const rawData = await fetchMatchData(matchId, force);

      if (!rawData) {
        return null;
      }

      const processedMatch = processMatchData(rawData, heroes, items);
      return processedMatch;
    } catch (error) {
      console.error(`Failed to load match ${matchId}:`, error);
      return null;
    } finally {
      // Clean up in-flight request
      inFlightMatchRequests.delete(matchId);
    }
  })();

  // Cache the promise (unless force=true)
  if (!force) {
    inFlightMatchRequests.set(matchId, request);
  }

  return request;
}
