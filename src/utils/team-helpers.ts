/**
 * Team helper functions
 * 
 * Utility functions for team data processing and error handling
 */

import type { Match, MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique key for a team
 */
export function generateTeamKey(teamId: number, leagueId: number): string {
  return `${teamId}-${leagueId}`;
}

/**
 * Create initial team data with loading state
 */
export function createInitialTeamData(teamId: number, leagueId: number): TeamData {
  return {
    team: {
      id: teamId,
      name: `Loading ${teamId}`,
    },
    league: {
      id: leagueId,
      name: `Loading ${leagueId}`
    },
    timeAdded: new Date().toISOString(),
    matches: {},
    players: [],
    performance: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      heroUsage: {
        picks: [],
        bans: [],
        picksAgainst: [],
        bansAgainst: [],
        picksByPlayer: {}
      },
      draftStats: {
        firstPickCount: 0,
        secondPickCount: 0,
        firstPickWinRate: 0,
        secondPickWinRate: 0,
        uniqueHeroesPicked: 0,
        uniqueHeroesBanned: 0,
        mostPickedHero: '',
        mostBannedHero: ''
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    },
    isLoading: true
  };
}

// ============================================================================
// TEAM SIDE DETERMINATION
// ============================================================================

/**
 * Determine team side from match data
 */
export function determineTeamSideFromMatch(match: Match, teamId: number): 'radiant' | 'dire' {
  if (match.radiant.id === teamId) {
    return 'radiant';
  } else if (match.dire.id === teamId) {
    return 'dire';
  }
  
  // If we can't determine the side, throw an error
  throw new Error(`Could not determine team side for team ${teamId} in match ${match.id}`);
}

// ============================================================================
// PLAYER EXTRACTION
// ============================================================================

/**
 * Extract player IDs from a specific team side in a match
 */
export function extractPlayersFromMatchSide(
  match: Match,
  teamSide: 'radiant' | 'dire'
): number[] {
  const players = teamSide === 'radiant' ? match.players.radiant : match.players.dire;
  return players.map(player => player.accountId);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that an active team is selected
 */
export function validateActiveTeam(activeTeam: { teamId: number; leagueId: number } | null): { teamId: number; leagueId: number } {
  if (!activeTeam) {
    throw new Error('No active team selected');
  }
  return activeTeam;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Update team error in state
 */
export function updateTeamError(
  teamId: number,
  leagueId: number,
  errorMessage: string,
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
) {
  const teamKey = generateTeamKey(teamId, leagueId);
  const existingTeam = state.teams.get(teamKey);
  
  if (existingTeam) {
    // Update existing team with error
    const updatedTeam: TeamData = {
      ...existingTeam,
      error: errorMessage,
      isLoading: false
    };
    
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(teamKey, updatedTeam);
      return newTeams;
    });
  } else {
    // Create minimal team object with error
    const errorTeam: TeamData = {
      ...createInitialTeamData(teamId, leagueId),
      error: errorMessage,
      isLoading: false
    };
    
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(teamKey, errorTeam);
      return newTeams;
    });
  }
  
  // Persist teams to config context
  configContext.setTeams(state.teams);
}

/**
 * Set team loading state
 */
export function setTeamLoading(
  teamId: number,
  leagueId: number,
  isLoading: boolean,
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  }
) {
  const teamKey = generateTeamKey(teamId, leagueId);
  const existingTeam = state.teams.get(teamKey);
  
  if (existingTeam) {
    // Update existing team with loading state
    const updatedTeam: TeamData = {
      ...existingTeam,
      isLoading
    };
    
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(teamKey, updatedTeam);
      return newTeams;
    });
  }
} 

// ============================================================================
// TEAM PERFORMANCE UPDATES
// ============================================================================

/**
 * Update team performance based on matches
 */
export function updateTeamPerformance(
  team: TeamData,
  matchesWithCorrectSides: Record<number, TeamMatchParticipation>,
  originalTeamData: { matches: Array<{ matchId: number; result: string }> }
): TeamData {
  return {
    ...team,
    matches: matchesWithCorrectSides,
    performance: {
      ...team.performance,
      totalMatches: Object.keys(matchesWithCorrectSides).length,
      totalWins: Object.values(matchesWithCorrectSides).filter(match => {
        // We need to determine win/loss from the original match summary data
        const originalMatch = originalTeamData.matches.find(m => m.matchId === match.matchId);
        return originalMatch?.result === 'won';
      }).length,
      totalLosses: Object.values(matchesWithCorrectSides).filter(match => {
        const originalMatch = originalTeamData.matches.find(m => m.matchId === match.matchId);
        return originalMatch?.result === 'lost';
      }).length
    }
  };
} 

// ============================================================================
// TEAM CONTEXT UTILITIES
// ============================================================================

/**
 * Helper function to create a team updater function
 */
export function createTeamUpdater(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
) {
  return (teamKey: string, updater: (team: TeamData) => TeamData) => {
    setTeams(prev => {
      const newTeams = new Map(prev);
      const existingTeam = newTeams.get(teamKey);
      
      if (existingTeam) {
        const updatedTeam = updater(existingTeam);
        newTeams.set(teamKey, updatedTeam);
      }
      
      return newTeams;
    });
  };
}

/**
 * Create new team data for editing operation
 */
function createNewTeamDataForEdit(
  newTeamId: number,
  newLeagueId: number,
  existingTeam: TeamData | undefined
): TeamData {
  const newTeamData = createInitialTeamData(newTeamId, newLeagueId);
  
  // If editing an existing team, preserve the timeAdded
  if (existingTeam) {
    newTeamData.timeAdded = existingTeam.timeAdded;
  }
  
  return newTeamData;
}

/**
 * Persist team edit changes immediately
 */
function persistTeamEditImmediately(
  currentKey: string,
  newKey: string,
  newTeamData: TeamData,
  state: {
    teams: Map<string, TeamData>;
  },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
): void {
  try {
    const currentTeams = new Map(state.teams);
    currentTeams.delete(currentKey);
    currentTeams.set(newKey, newTeamData);
    configContext.setTeams(currentTeams);
  } catch (error) {
    console.warn('Failed to persist team edit immediately:', error);
  }
}

/**
 * Update state with team edit changes
 */
function updateStateWithTeamEdit(
  currentKey: string,
  newKey: string,
  newTeamData: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  }
): void {
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.delete(currentKey);
    newTeams.set(newKey, newTeamData);
    return newTeams;
  });
}

/**
 * Persist updated team data after fetching
 */
function persistUpdatedTeamData(
  newKey: string,
  updatedTeamData: TeamData,
  state: {
    teams: Map<string, TeamData>;
  },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
): void {
  try {
    const currentTeams = new Map(state.teams);
    currentTeams.set(newKey, updatedTeamData);
    configContext.setTeams(currentTeams);
  } catch (error) {
    console.warn('Failed to update team persistence after edit:', error);
  }
}

/**
 * Helper function to edit team data (change team ID and league ID)
 */
export async function editTeamData(
  currentTeamId: number,
  currentLeagueId: number,
  newTeamId: number,
  newLeagueId: number,
  existingTeam: TeamData | undefined,
  fetchTeamAndLeagueData: (teamData: TeamData, force: boolean) => Promise<TeamData>,
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
): Promise<void> {
  const currentKey = generateTeamKey(currentTeamId, currentLeagueId);
  const newKey = generateTeamKey(newTeamId, newLeagueId);
  
  // Create new team data
  const newTeamData = createNewTeamDataForEdit(newTeamId, newLeagueId, existingTeam);
  
  // Persist and update state immediately
  persistTeamEditImmediately(currentKey, newKey, newTeamData, state, configContext);
  updateStateWithTeamEdit(currentKey, newKey, newTeamData, state);
  
  // Fetch team and league data
  const teamDataToFetch = existingTeam || newTeamData;
  const updatedTeamData = await fetchTeamAndLeagueData(teamDataToFetch, false);
  
  // Update state with fetched data
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(newKey, updatedTeamData);
    return newTeams;
  });
  
  // Persist updated data
  persistUpdatedTeamData(newKey, updatedTeamData, state, configContext);
}

/**
 * Helper function to cleanup unused matches and players
 */
export function cleanupUnusedData(
  teamToRemove: TeamData,
  remainingTeams: TeamData[],
  matchContext: { removeMatch: (matchId: number) => void },
  playerContext: { removePlayer: (playerId: number) => void }
) {
  // Get all match IDs from the removed team
  const matchIdsToCheck = Object.keys(teamToRemove.matches).map(Number);
  
  // Get all player IDs from the removed team
  const playerIdsToCheck = teamToRemove.players.map(player => player.accountId);
  
  // Check if any other teams use these matches
  const usedMatchIds = new Set<number>();
  const usedPlayerIds = new Set<number>();
  
  remainingTeams.forEach(team => {
    // Collect match IDs used by other teams
    Object.keys(team.matches).forEach(matchId => {
      usedMatchIds.add(Number(matchId));
    });
    
    // Collect player IDs used by other teams
    team.players.forEach(player => {
      usedPlayerIds.add(player.accountId);
    });
  });
  
  // Remove matches that are no longer used by any team
  matchIdsToCheck.forEach(matchId => {
    if (!usedMatchIds.has(matchId)) {
      matchContext.removeMatch(matchId);
    }
  });
  
  // Remove players that are no longer used by any team
  playerIdsToCheck.forEach(playerId => {
    if (!usedPlayerIds.has(playerId)) {
      playerContext.removePlayer(playerId);
    }
  });
} 

/**
 * Add team to state and return updated teams map
 */
function addTeamToState(
  teamId: number,
  leagueId: number,
  processedTeam: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  }
): Map<string, TeamData> {
  const teamKey = generateTeamKey(teamId, leagueId);
  let updatedTeams: Map<string, TeamData>;
  
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, processedTeam);
    updatedTeams = newTeams;
    return newTeams;
  });
  
  return updatedTeams!;
}

/**
 * Process matches to get correct sides
 */
async function processMatchesForTeam(
  originalTeamData: { matches: Array<{ matchId: number; result: string }> },
  teamId: number,
  processMatchAndExtractPlayers: (matchId: number, teamId: number, matchContext: MatchContextValue, playerContext: PlayerContextValue) => Promise<TeamMatchParticipation | null>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue
): Promise<Record<number, TeamMatchParticipation>> {
  const matchesWithCorrectSides: Record<number, TeamMatchParticipation> = {};

  // Check if team data has matches and is not an error
  if (originalTeamData.matches?.length > 0) {
    for (const matchSummary of originalTeamData.matches) {
      const matchParticipation = await processMatchAndExtractPlayers(matchSummary.matchId, teamId, matchContext, playerContext);
      if (matchParticipation) {
        matchesWithCorrectSides[matchSummary.matchId] = matchParticipation;
      }
    }
  }

  return matchesWithCorrectSides;
}

/**
 * Helper function to process team data and update state
 */
export async function processTeamDataWithState(
  teamId: number,
  leagueId: number,
  processedTeam: TeamData,
  originalTeamData: { matches: Array<{ matchId: number; result: string }> },
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
    setIsLoading: (loading: boolean) => void;
  },
  updateTeam: (teamKey: string, updater: (team: TeamData) => TeamData) => void,
  processMatchAndExtractPlayers: (matchId: number, teamId: number, matchContext: MatchContextValue, playerContext: PlayerContextValue) => Promise<TeamMatchParticipation | null>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue
): Promise<Map<string, TeamData>> {
  // Add the team to state first
  const updatedTeams = addTeamToState(teamId, leagueId, processedTeam, state);

  // Process each match to get the correct side and update the team data
  const matchesWithCorrectSides = await processMatchesForTeam(
    originalTeamData,
    teamId,
    processMatchAndExtractPlayers,
    matchContext,
    playerContext
  );

  // Update the team with the matches that have correct sides
  const teamKey = generateTeamKey(teamId, leagueId);
  updateTeam(teamKey, (team) => updateTeamPerformance(team, matchesWithCorrectSides, originalTeamData));
  
  // Set loading to false after processing is complete
  state.setIsLoading(false);
  
  // Return the updated teams Map
  return updatedTeams;
} 