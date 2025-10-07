/**
 * Match Operations for AppData
 *
 * Handles manual match operations (add, remove, edit) for teams.
 * Extracted to reduce app-data.ts file size.
 */

import type { Match, Team } from './app-data-types';

/**
 * Interface for AppData instance methods needed by match operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataMatchOpsContext {
  _teams: Map<string, Team>;
  updateTeam(teamKey: string, updates: Partial<Team>): void;
  saveToStorage(): void;
  loadMatch(matchId: number): Promise<Match | null>;
  updateTeamMatchParticipation(teamKey: string, matchIds: number[]): void;
}

/**
 * Add a manual match to a team
 * @param userSelectedSide - User-selected side (required - user must choose which side in the form)
 */
export async function addManualMatchToTeam(
  appData: AppDataMatchOpsContext,
  matchId: number,
  teamKey: string,
  userSelectedSide: 'radiant' | 'dire',
): Promise<Match | null> {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  // Load full match data
  const match = await appData.loadMatch(matchId);

  if (!match) {
    return null;
  }

  // Add to manual matches if not already present
  const existingMatchData = team.matches.get(matchId);
  if (!existingMatchData?.isManual) {
    // Create new match data for manual match
    const newMatchData = {
      matchId,
      result: 'won' as 'won' | 'lost',
      opponentName: 'Unknown',
      side: userSelectedSide,
      duration: 0,
      date: new Date().toISOString(),
      pickOrder: 'unknown',
      heroes: [],
      isManual: true,
      isHidden: false,
    };

    team.matches.set(matchId, newMatchData);
    appData.updateTeam(teamKey, { matches: team.matches });
    const allMatchIds = Array.from(team.matches.keys());
    appData.updateTeamMatchParticipation(teamKey, allMatchIds);
  }

  return match;
}

/**
 * Remove a manual match from a team
 */
export function removeManualMatchFromTeam(appData: AppDataMatchOpsContext, matchId: number, teamKey: string): void {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  // Remove from manual matches
  const matchData = team.matches.get(matchId);
  if (matchData?.isManual) {
    team.matches.delete(matchId);
    appData.updateTeam(teamKey, { matches: team.matches });
    const remainingMatchIds = Array.from(team.matches.keys());
    appData.updateTeamMatchParticipation(teamKey, remainingMatchIds);
  }
}

/**
 * Edit a manual match by replacing it with a new match (atomic operation to prevent flickering)
 * @param userSelectedSide - User-selected side (required - user must choose which side in the form)
 */
export async function editManualMatchToTeam(
  appData: AppDataMatchOpsContext,
  oldMatchId: number,
  newMatchId: number,
  teamKey: string,
  userSelectedSide: 'radiant' | 'dire',
): Promise<Match | null> {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  // Load the new match data first (don't remove old match until we have the new one)
  const newMatch = await appData.loadMatch(newMatchId);
  if (!newMatch) {
    throw new Error(`Failed to load match ${newMatchId}`);
  }

  // Now atomically swap: remove old, add new (single state update)
  const oldMatchData = team.matches.get(oldMatchId);
  if (oldMatchData?.isManual) {
    team.matches.delete(oldMatchId);
  }

  // Add new manual match
  const newMatchData = {
    matchId: newMatchId,
    result: 'won' as 'won' | 'lost',
    opponentName: 'Unknown',
    side: userSelectedSide,
    duration: newMatch.duration,
    date: newMatch.date,
    pickOrder: 'unknown',
    heroes: [],
    isManual: true,
    isHidden: false,
  };

  team.matches.set(newMatchId, newMatchData);

  // Update participation data for the team
  const allMatchIds = Array.from(team.matches.keys());
  appData.updateTeamMatchParticipation(teamKey, allMatchIds);

  // Single update triggers one re-render
  appData.updateTeam(teamKey, { matches: team.matches });

  return newMatch;
}
