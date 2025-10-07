/**
 * UI Operations for AppData
 *
 * Handles UI state management and React state updates.
 * Extracted to reduce app-data.ts file size.
 */

import type React from 'react';

import type { Match, Player, Team } from './app-data-types';

/**
 * Interface for AppData instance methods needed by UI operations
 * This avoids circular dependencies while maintaining type safety
 */
export interface AppDataUIOpsContext {
  _teams: Map<string, Team>;
  _teamsRef: Map<string, Team>;
  _matches: Map<number, Match>;
  _matchesRef: Map<number, Match>;
  _players: Map<number, Player>;
  _playersRef: Map<number, Player>;
  state: {
    selectedTeamId: string;
    selectedTeamIdParsed: { teamId: number; leagueId: number };
    selectedMatchId: number | null;
    selectedPlayerId: number | null;
    isLoading: boolean;
    error: string | null;
  };
  setTeamsState?: React.Dispatch<React.SetStateAction<Map<string, Team>>>;
  setMatchesState?: React.Dispatch<React.SetStateAction<Map<number, Match>>>;
  setPlayersState?: React.Dispatch<React.SetStateAction<Map<number, Player>>>;
  updateTeamsRef(): void;
  updateMatchesRef(): void;
  updatePlayersRef(): void;
  saveToStorage(): void;
}

/**
 * Register setState for teams (called by AppDataProvider)
 */
export function setTeamsStateFn(
  appData: AppDataUIOpsContext,
  fn: React.Dispatch<React.SetStateAction<Map<string, Team>>>,
): void {
  appData.setTeamsState = fn;
}

/**
 * Register setState for matches (called by AppDataProvider)
 */
export function setMatchesStateFn(
  appData: AppDataUIOpsContext,
  fn: React.Dispatch<React.SetStateAction<Map<number, Match>>>,
): void {
  appData.setMatchesState = fn;
}

/**
 * Register setState for players (called by AppDataProvider)
 */
export function setPlayersStateFn(
  appData: AppDataUIOpsContext,
  fn: React.Dispatch<React.SetStateAction<Map<number, Player>>>,
): void {
  appData.setPlayersState = fn;
}

/**
 * Update the teams reference to trigger React re-renders
 * Creates a new Map reference so React detects the change
 */
export function updateTeamsRef(appData: AppDataUIOpsContext): void {
  appData._teamsRef = new Map(appData._teams);
  appData.setTeamsState?.(appData._teamsRef);
}

/**
 * Update the matches reference to trigger React re-renders
 * Creates a new Map reference so React detects the change
 */
export function updateMatchesRef(appData: AppDataUIOpsContext): void {
  appData._matchesRef = new Map(appData._matches);
  appData.setMatchesState?.(appData._matchesRef);
}

/**
 * Update the players reference to trigger React re-renders
 * Creates a new Map reference so React detects the change
 */
export function updatePlayersRef(appData: AppDataUIOpsContext): void {
  appData._playersRef = new Map(appData._players);
  appData.setPlayersState?.(appData._playersRef);
}

/**
 * Set the selected team
 * Throws error if team doesn't exist - should never happen as we always have at least global team
 */
export function setSelectedTeam(appData: AppDataUIOpsContext, teamId: string): void {
  const team = appData._teams.get(teamId);
  if (!team) {
    throw new Error(`Cannot select team ${teamId}: team does not exist`);
  }

  appData.state.selectedTeamId = teamId;
  appData.state.selectedTeamIdParsed = { teamId: team.teamId, leagueId: team.leagueId };
  updateTeamsRef(appData);

  // Save to localStorage to persist the selected team
  appData.saveToStorage();
}

/**
 * Set the selected match
 */
export function setSelectedMatch(appData: AppDataUIOpsContext, matchId: number | null): void {
  appData.state.selectedMatchId = matchId;
}

/**
 * Set the selected player
 */
export function setSelectedPlayer(appData: AppDataUIOpsContext, accountId: number | null): void {
  appData.state.selectedPlayerId = accountId;
}
