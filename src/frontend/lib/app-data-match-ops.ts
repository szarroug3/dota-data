/**
 * Match Operations for AppData
 *
 * Handles manual match operations (add, remove, edit) for teams.
 * Extracted to reduce app-data.ts file size.
 */

import type { Match, Team, TeamMatchParticipation } from './app-data-types';

/**
 * Interface for AppData instance methods needed by match operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataMatchOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  updateTeam(teamKey: string, updates: Partial<Team>): void;
  saveToStorage(): void;
  loadMatch(matchId: number): Promise<Match | null>;
  addMatch(match: Match): void;
  updateMatch(matchId: number, updates: Partial<Match>, options?: { skipSave?: boolean }): void;
  getMatch(matchId: number): Match | undefined;
  updateTeamMatchParticipation(teamKey: string, matchIds: number[]): void;
  getTeamMatchesMetadata(teamKey: string): Map<number, TeamMatchParticipation>;
  getMatchesByIds(matchIds: number[]): Match[];
  getTeamHiddenMatchIds(teamKey: string): Set<number>;
  computeAndStoreHeroPerformanceForTeam(
    teamKey: string,
    allMatches: Match[],
    teamMatches: Map<number, TeamMatchParticipation>,
    hiddenMatchIds: Set<number>,
  ): void;
  updateMatchesRef(): void;
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
 * Handle side-only changes (same match ID, different side)
 * This is an optimization to avoid network calls when only the perspective changes
 */
function handleSideOnlyChange(
  appData: AppDataMatchOpsContext,
  matchId: number,
  teamKey: string,
  userSelectedSide: 'radiant' | 'dire',
): Match | null {
  const team = appData._teams.get(teamKey);
  if (!team) {
    return null;
  }

  const existingMatchData = team.matches.get(matchId);
  if (!existingMatchData?.isManual) {
    return null;
  }

  const match = appData.getMatch(matchId);
  if (!match) {
    return null;
  }

  // Update the side and recalculate derived data
  const updatedMatchData = {
    ...existingMatchData,
    side: userSelectedSide,
    // Recalculate opponent name based on new side
    opponentName: userSelectedSide === 'radiant' ? match.dire.name || 'Unknown' : match.radiant.name || 'Unknown',
    // Recalculate result based on new side
    result: (userSelectedSide === match.result ? 'won' : 'lost') as 'won' | 'lost',
  };

  team.matches.set(matchId, updatedMatchData);
  appData.updateTeam(teamKey, { matches: team.matches });

  // Save to storage to persist the side change
  appData.saveToStorage();

  // Return the existing match (no network call needed)
  return match;
}

/**
 * Create optimistic match data for new match loading
 */
function createOptimisticMatch(newMatchId: number): Match {
  return {
    id: newMatchId,
    date: new Date().toISOString(),
    duration: 0,
    radiant: { id: undefined, name: undefined },
    dire: { id: undefined, name: undefined },
    draft: { radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] },
    // Don't include players - this will make loadMatch fetch the real data
    players: { radiant: [], dire: [] },
    statistics: {
      radiantScore: 0,
      direScore: 0,
      goldAdvantage: { times: [], radiantGold: [], direGold: [] },
      experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] },
    },
    events: [],
    result: 'radiant',
    isLoading: true,
    error: undefined,
  };
}

/**
 * Handle the full match replacement flow (different match ID)
 */
async function handleMatchReplacement(
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

  // Create optimistic match data immediately
  const optimisticMatch = createOptimisticMatch(newMatchId);
  appData.addMatch(optimisticMatch);

  // Atomically swap: remove old, add new
  const oldMatchData = team.matches.get(oldMatchId);
  if (oldMatchData?.isManual) {
    team.matches.delete(oldMatchId);
  }

  // Add new manual match data
  const newMatchData = {
    matchId: newMatchId,
    result: 'won' as 'won' | 'lost',
    opponentName: 'Unknown',
    side: userSelectedSide,
    duration: 0,
    date: optimisticMatch.date,
    pickOrder: 'unknown',
    heroes: [],
    isManual: true,
    isHidden: false,
  };

  team.matches.set(newMatchId, newMatchData);

  // Update participation data for the team
  const allMatchIds = Array.from(team.matches.keys());
  appData.updateTeamMatchParticipation(teamKey, allMatchIds);

  // Recompute hero performance after match replacement
  const teamMatches = appData.getTeamMatchesMetadata(teamKey);
  const matches = appData.getMatchesByIds(allMatchIds);
  const hiddenMatchIds = appData.getTeamHiddenMatchIds(teamKey);
  appData.computeAndStoreHeroPerformanceForTeam(teamKey, matches, teamMatches, hiddenMatchIds);

  // Single update triggers one re-render
  appData.updateTeam(teamKey, { matches: team.matches });

  // Now try to load the actual match data
  try {
    const actualMatch = await appData.loadMatch(newMatchId);

    if (actualMatch) {
      // Update the match data with the actual loaded data
      const updatedMatchData = {
        ...newMatchData,
        duration: actualMatch.duration,
        date: actualMatch.date,
      };

      team.matches.set(newMatchId, updatedMatchData);
      appData.updateTeam(teamKey, { matches: team.matches });

      return actualMatch;
    } else {
      // Match loading failed - update the optimistic match with error
      appData.updateMatch(newMatchId, {
        isLoading: false,
        error: `Failed to load match ${newMatchId}`,
      });

      return appData.getMatch(newMatchId) || optimisticMatch;
    }
  } catch (error) {
    // Match loading failed - update the optimistic match with error
    appData.updateMatch(newMatchId, {
      isLoading: false,
      error: error instanceof Error ? error.message : `Failed to load match ${newMatchId}`,
    });

    return appData.getMatch(newMatchId) || optimisticMatch;
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
  // Optimization: If only the side changed (same match ID), just update the side and recalculate
  if (oldMatchId === newMatchId) {
    const result = handleSideOnlyChange(appData, oldMatchId, teamKey, userSelectedSide);
    if (result) {
      return result;
    }
  }

  // Handle full match replacement (different match ID)
  return handleMatchReplacement(appData, oldMatchId, newMatchId, teamKey, userSelectedSide);
}

function ensureMatchMetadata(appData: AppDataMatchOpsContext, team: Team, teamKey: string, matchId: number): void {
  if (team.matches.has(matchId)) {
    return;
  }

  appData.updateTeamMatchParticipation(teamKey, [matchId]);
}

function setMatchHiddenForTeam(
  appData: AppDataMatchOpsContext,
  matchId: number,
  teamKey: string,
  hidden: boolean,
): void {
  const team = appData._teams.get(teamKey);
  if (!team) {
    throw new Error(`Team ${teamKey} not found`);
  }

  ensureMatchMetadata(appData, team, teamKey, matchId);

  const metadata = team.matches.get(matchId);
  if (!metadata || metadata.isHidden === hidden) {
    return;
  }

  team.matches.set(matchId, { ...metadata, isHidden: hidden });
  appData.updateTeam(teamKey, { matches: team.matches });

  const matchIds = Array.from(team.matches.keys());
  appData.updateTeamMatchParticipation(teamKey, matchIds);

  // Recompute hero performance after hiding/unhiding matches
  const teamMatches = appData.getTeamMatchesMetadata(teamKey);
  const matches = appData.getMatchesByIds(matchIds);
  const hiddenMatchIds = appData.getTeamHiddenMatchIds(teamKey);
  appData.computeAndStoreHeroPerformanceForTeam(teamKey, matches, teamMatches, hiddenMatchIds);
}

export function hideMatchOnTeam(appData: AppDataMatchOpsContext, matchId: number, teamKey: string): void {
  setMatchHiddenForTeam(appData, matchId, teamKey, true);
}

export function unhideMatchOnTeam(appData: AppDataMatchOpsContext, matchId: number, teamKey: string): void {
  setMatchHiddenForTeam(appData, matchId, teamKey, false);
}
