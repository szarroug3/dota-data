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
      isActive: false,
      isLoading: true
    },
    league: {
      id: leagueId,
      name: `Loading ${leagueId}`
    },
    timeAdded: new Date().toISOString(),
    matches: [],
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
  if (match.radiantTeamId === teamId) {
    return 'radiant';
  } else if (match.direTeamId === teamId) {
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
  matchesWithCorrectSides: Array<{ matchId: number; side: 'radiant' | 'dire' | null }>,
  originalTeamData: { matches: Array<{ matchId: number; result: string }> }
): TeamData {
  return {
    ...team,
    matches: matchesWithCorrectSides,
    performance: {
      ...team.performance,
      totalMatches: matchesWithCorrectSides.length,
      totalWins: matchesWithCorrectSides.filter(match => {
        // We need to determine win/loss from the original match summary data
        const originalMatch = originalTeamData.matches.find(m => m.matchId === match.matchId);
        return originalMatch?.result === 'won';
      }).length,
      totalLosses: matchesWithCorrectSides.filter(match => {
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
  const newTeamData = createInitialTeamData(newTeamId, newLeagueId);
  
  // If editing an existing team, preserve the timeAdded and remove the old team
  if (existingTeam) {
    newTeamData.timeAdded = existingTeam.timeAdded;
    
    // PERSIST IMMEDIATELY: Remove old team and add new team with loading state
    try {
      const currentTeams = new Map(state.teams);
      currentTeams.delete(currentKey);
      currentTeams.set(newKey, newTeamData);
      configContext.setTeams(currentTeams);
    } catch (error) {
      console.warn('Failed to persist team edit immediately:', error);
      // Continue with the operation even if persistence fails
    }
    
    // Update state immediately (remove old, add new with loading state)
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.delete(currentKey);
      newTeams.set(newKey, newTeamData);
      return newTeams;
    });
  } else {
    // If team doesn't exist, just add it as a new team
    // This shouldn't happen in normal UI flow, but handle gracefully
    
    // PERSIST IMMEDIATELY: Add new team to localStorage right away
    try {
      const currentTeams = new Map(state.teams);
      currentTeams.set(newKey, newTeamData);
      configContext.setTeams(currentTeams);
    } catch (error) {
      console.warn('Failed to persist new team immediately:', error);
      // Continue with the operation even if persistence fails
    }
    
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(newKey, newTeamData);
      return newTeams;
    });
  }
  
  // Fetch team and league data (use existing team data if available, otherwise use new team data)
  const teamDataToFetch = existingTeam || newTeamData;
  const updatedTeamData = await fetchTeamAndLeagueData(teamDataToFetch, false);
  
  // Update state with fetched data
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(newKey, updatedTeamData);
    return newTeams;
  });
  
  // UPDATE PERSISTENCE: Update localStorage with fetched data
  try {
    const currentTeams = new Map(state.teams);
    currentTeams.set(newKey, updatedTeamData);
    configContext.setTeams(currentTeams);
  } catch (error) {
    console.warn('Failed to update team persistence after edit:', error);
    // Continue even if persistence update fails
  }
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
  const matchIdsToCheck = teamToRemove.matches.map(match => match.matchId);
  
  // Get all player IDs from the removed team
  const playerIdsToCheck = teamToRemove.players.map(player => player.accountId);
  
  // Check if any other teams use these matches
  const usedMatchIds = new Set<number>();
  const usedPlayerIds = new Set<number>();
  
  remainingTeams.forEach(team => {
    // Collect match IDs used by other teams
    team.matches.forEach(match => {
      usedMatchIds.add(match.matchId);
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
  const teamKey = generateTeamKey(teamId, leagueId);

  // Add the team to state first
  let updatedTeams: Map<string, TeamData>;
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, processedTeam);
    updatedTeams = newTeams;
    return newTeams;
  });

  // Process each match to get the correct side and update the team data
  const matchesWithCorrectSides: Array<{ matchId: number; side: 'radiant' | 'dire' | null }> = [];

  // Check if team data has matches and is not an error
  if (originalTeamData.matches?.length > 0) {
    for (const matchSummary of originalTeamData.matches) {
      const matchParticipation = await processMatchAndExtractPlayers(matchSummary.matchId, teamId, matchContext, playerContext);
      if (matchParticipation) {
        matchesWithCorrectSides.push(matchParticipation);
      }
    }
  }

  // Update the team with the matches that have correct sides
  updateTeam(teamKey, (team) => updateTeamPerformance(team, matchesWithCorrectSides, originalTeamData));
  
  // Set loading to false after processing is complete
  state.setIsLoading(false);
  
  // Return the updated teams Map
  return updatedTeams!;
} 