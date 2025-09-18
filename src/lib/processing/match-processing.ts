/**
 * Match Processing Logic
 *
 * Extracted from match-context.tsx to separate complex processing logic
 * from state management. This module handles all data transformation and
 * analysis for match data.
 */

import type { Hero, Item } from '@/types/contexts/constants-context-value';
import type { HeroPick, Match } from '@/types/contexts/match-context-value';
import type { OpenDotaMatch } from '@/types/external-apis';

import {
  calculateAdvantageData,
  calculateTeamFightStats,
  convertDraftData,
  convertPlayer,
  detectTeamRoles,
  determinePickOrder,
  generateEvents,
  processDraftData,
  processGameEvents,
} from './match-processing/index';

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

export function processMatchData(
  matchData: OpenDotaMatch,
  heroes: Record<string, Hero>,
  heroesByName: Record<string, Hero>,
  items: Record<string, Item>,
): Match {
  // Separate radiant and dire players (derive side when isRadiant is missing)
  const isRadiantSide = (p: OpenDotaMatch['players'][number]) =>
    typeof p.isRadiant === 'boolean' ? p.isRadiant : p.player_slot < 128;
  const radiantPlayers = matchData.players.filter((player) => isRadiantSide(player));
  const direPlayers = matchData.players.filter((player) => !isRadiantSide(player));

  // Calculate advantage data
  const { goldAdvantage, experienceAdvantage } = calculateAdvantageData(matchData);

  // Determine pick order
  const pickOrder = determinePickOrder(matchData);

  // Convert draft data
  const { radiantPicks, direPicks, radiantBans, direBans } = convertDraftData(matchData, heroes);

  // Generate events
  const events = generateEvents(matchData, heroes, heroesByName);

  // Detect roles for each team
  const radiantRoleMap = detectTeamRoles(radiantPlayers);
  const direRoleMap = detectTeamRoles(direPlayers);

  // Update draft picks with correct roles
  radiantPicks.forEach((pick: HeroPick) => {
    const player = radiantPlayers.find((p) => p.hero_id.toString() === pick.hero.id);
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

  direPicks.forEach((pick: HeroPick) => {
    const player = direPlayers.find((p) => p.hero_id.toString() === pick.hero.id);
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
      direBans,
    },
    players: {
      radiant: radiantPlayers.map((player) => convertPlayer(player, radiantRoleMap, items, heroes)),
      dire: direPlayers.map((player) => convertPlayer(player, direRoleMap, items, heroes)),
    },
    events,
    statistics: {
      radiantScore: matchData.radiant_score || 0,
      direScore: matchData.dire_score || 0,
      goldAdvantage,
      experienceAdvantage,
    },
    result: matchData.radiant_win ? 'radiant' : 'dire',
    pickOrder,
  };

  // Process additional data for components
  const processedDraft = processDraftData(match, matchData);
  const processedEvents = processGameEvents(match);
  const teamFightStats = calculateTeamFightStats(match);

  return {
    ...match,
    processedDraft,
    processedEvents,
    teamFightStats,
  };
}
