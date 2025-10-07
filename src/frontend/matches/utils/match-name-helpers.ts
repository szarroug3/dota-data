/**
 * Match Name Helpers
 *
 * Shared utilities for determining team names in matches
 * Handles the hierarchy: User team name → Match data team name → Default side name
 */

import type { Match, Team, TeamMatchParticipation } from '@/frontend/lib/app-data-types';

/**
 * Determines the display name for a team based on a hierarchy
 *
 * Hierarchy:
 * 1. Non-global user team name (e.g., "Team Liquid")
 * 2. Match data team name (e.g., "Doggo Mid And Feed")
 * 3. Default side name ("Radiant" or "Dire")
 *
 * @param userTeamName - The user's team name (may be "Default" for global team)
 * @param matchTeamName - The team name from match data
 * @param defaultSideName - Fallback side name
 * @returns The display name to use
 */
export function getTeamName(
  userTeamName: string | undefined,
  matchTeamName: string | undefined,
  defaultSideName: 'Radiant' | 'Dire',
): string {
  // Hierarchy: 1. Non-global user team name, 2. Match data team name, 3. Radiant/Dire
  if (userTeamName && userTeamName !== 'Default') {
    return userTeamName;
  }
  if (matchTeamName) {
    return matchTeamName;
  }
  return defaultSideName;
}

/**
 * Gets the opponent's display name based on the user's side
 *
 * @param match - The match data
 * @param teamMatch - Team match participation data
 * @returns The opponent's display name
 */
export function getOpponentName(match: Match, teamMatch: TeamMatchParticipation): string {
  // Determine opponent based on user's side
  if (teamMatch.side === 'radiant') {
    // User is radiant, opponent is dire
    return getTeamName(teamMatch.opponentName, match.dire.name, 'Dire');
  } else {
    // User is dire, opponent is radiant
    return getTeamName(teamMatch.opponentName, match.radiant.name, 'Radiant');
  }
}

/**
 * Gets display names for both teams (left/right in UI)
 *
 * @param teamMatch - Team match participation data
 * @param selectedTeam - The currently selected team
 * @param match - The match data
 * @returns Left and right display names for the UI
 */
export function getTeamDisplayNames(
  teamMatch: TeamMatchParticipation,
  selectedTeam: Team,
  match: Match,
): { leftDisplayName: string; rightDisplayName: string } {
  // Determine user team name and opponent name using hierarchy
  const userTeamSide = teamMatch.side;
  const userTeamMatchName = userTeamSide === 'radiant' ? match.radiant.name : match.dire.name;
  const opponentMatchName = userTeamSide === 'radiant' ? match.dire.name : match.radiant.name;

  const userTeamName = getTeamName(
    selectedTeam.name,
    userTeamMatchName,
    userTeamSide === 'radiant' ? 'Radiant' : 'Dire',
  );
  const opponentName = getTeamName(
    teamMatch.opponentName,
    opponentMatchName,
    userTeamSide === 'radiant' ? 'Dire' : 'Radiant',
  );

  const isUserTeamRadiant = userTeamSide === 'radiant';
  return {
    leftDisplayName: isUserTeamRadiant ? userTeamName : opponentName,
    rightDisplayName: isUserTeamRadiant ? opponentName : userTeamName,
  };
}
