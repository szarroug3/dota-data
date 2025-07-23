import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/contexts/team-data-fetching-context';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import type { FetchTeamAndLeagueDataFunction } from '@/types/hooks/use-team-operations';
import {
  cleanupUnusedData,
  determineTeamSideFromMatch,
  editTeamData,
  generateTeamKey,
  updateTeamError
} from '@/utils/team-helpers';

// ============================================================================
// OPERATION TRACKING
// ============================================================================

/**
 * Track ongoing operations per team key
 */
const ongoingOperations = new Map<string, AbortController>();

/**
 * Get or create abort controller for a team operation
 */
function getAbortController(teamKey: string): AbortController {
  // Abort any existing operation for this team
  const existingController = ongoingOperations.get(teamKey);
  if (existingController) {
    existingController.abort();
  }
  
  // Create new abort controller
  const controller = new AbortController();
  ongoingOperations.set(teamKey, controller);
  return controller;
}

/**
 * Clean up abort controller for a team
 */
function cleanupAbortController(teamKey: string): void {
  const controller = ongoingOperations.get(teamKey);
  if (controller) {
    controller.abort();
    ongoingOperations.delete(teamKey);
  }
}

/**
 * Check if a team has ongoing operations
 */
function hasOngoingOperation(teamKey: string): boolean {
  return ongoingOperations.has(teamKey);
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for fetching team and league data
 */
export function useFetchTeamAndLeagueData(teamDataFetching: TeamDataFetchingContextValue) {
  return useCallback(async (
    existingTeamData: TeamData,
    force: boolean
  ): Promise<TeamData> => {
    const teamId = existingTeamData.team.id;
    const leagueId = existingTeamData.league.id;
    
    const [teamData, leagueData] = await Promise.all([
      teamDataFetching.fetchTeamData(teamId, force),
      teamDataFetching.fetchLeagueData(leagueId, force)
    ]);
    
    // Check for errors and create updated team data
    const teamHasError = 'error' in teamData;
    const leagueHasError = 'error' in leagueData;
    
    // Determine top-level error message
    let error: string | undefined;
    if (teamHasError && leagueHasError) {
      error = 'Failed to fetch team and league';
    } else if (teamHasError) {
      error = 'Failed to fetch team';
    } else if (leagueHasError) {
      error = 'Failed to fetch league';
    }
    
    const updatedTeamData: TeamData = {
      ...existingTeamData,
      team: {
        ...existingTeamData.team,
        name: teamHasError ? 'Unknown Team' : teamData.name
      },
      league: {
        id: leagueId,
        name: leagueHasError ? 'Unknown League' : leagueData.name
      },
      error
    };

    return updatedTeamData;
  }, [teamDataFetching]);
}

/**
 * Hook for processing matches and extracting players
 */
export function useProcessMatchAndExtractPlayers() {
  return useCallback(async (matchId: number, teamId: number, matchContext: MatchContextValue, playerContext: PlayerContextValue) => {
    // Add match to context (this will trigger match data fetching)
    const match = await matchContext.addMatch(matchId);
    
    // Determine which side our team was on by comparing team IDs
    let side: 'radiant' | 'dire' | null = null;
    if (match) {
      try {
        side = determineTeamSideFromMatch(match, teamId);
      } catch (error) {
        // If we can't determine the side, skip player extraction
        console.warn(`Failed to determine team side for match ${matchId}:`, error);
      }
    }
    
    // Extract and add players from the match (only from our team's side)
    if (match && side) {
      const teamPlayers = side === 'radiant' ? match.players.radiant : match.players.dire;
      const accountIds = teamPlayers
        .map(p => p.accountId)
        .filter(id => id !== null && id !== undefined);
      
      // Add players to context (this will trigger player data fetching)
      for (const accountId of accountIds) {
        await playerContext.addPlayer(accountId);
      }
    }
    
    // Return match participation data
    return {
      matchId,
      side
    };
  }, []);
}

// Helper function to create initial team data
function createInitialTeamData(teamId: number, leagueId: number): TeamData {
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

// Helper function to add new team to state
function addNewTeamToState(
  teamKey: string,
  newTeamData: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  }
) {
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, newTeamData);
    return newTeams;
  });
}

// Helper function to update team in state
function updateTeamInState(
  teamKey: string,
  updatedTeamData: TeamData,
  state: {
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  }
) {
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, updatedTeamData);
    return newTeams;
  });
}

// ============================================================================
// HELPER FUNCTIONS FOR TEAM OPERATIONS
// ============================================================================

/**
 * Persist team data to localStorage
 */
function persistTeamData(teamKey: string, teamData: TeamData, state: Map<string, TeamData>, configContext: ConfigContextValue): void {
  try {
    const currentTeams = new Map(state);
    currentTeams.set(teamKey, teamData);
    configContext.setTeams(currentTeams);
  } catch (error) {
    console.warn('Failed to persist team data:', error);
    // Continue with the operation even if persistence fails
  }
}

/**
 * Check if operation was aborted and handle silently
 */
function handleAbortCheck(abortController: AbortController, fallbackData: TeamData): TeamData | null {
  if (abortController.signal.aborted) {
    // Silently handle abort - this is expected when operations are replaced
    return fallbackData;
  }
  return null;
}

/**
 * Handle error vs abort distinction
 */
function handleOperationError(
  error: Error | string | object,
  abortController: AbortController,
  teamId: number,
  leagueId: number,
  state: { teams: Map<string, TeamData>; setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> },
  configContext: ConfigContextValue
): TeamData {
  // Only handle actual errors, not aborts
  if (!abortController.signal.aborted) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team data';
    updateTeamError(teamId, leagueId, errorMessage, state, configContext);
    throw error;
  }
  // Return initial data for aborted operations
  return createInitialTeamData(teamId, leagueId);
}

export function useProcessTeamData(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  configContext: ConfigContextValue
) {
  const fetchTeamAndLeagueData = useFetchTeamAndLeagueData(teamDataFetching);

  const processTeamData = useCallback(async (teamId: number, leagueId: number, force = false): Promise<TeamData> => {
    const teamKey = generateTeamKey(teamId, leagueId);
    const existingTeam = state.teams.get(teamKey);

    if (existingTeam && !force) {
      return existingTeam;
    }

    // Check if there's already an ongoing operation for this team
    if (hasOngoingOperation(teamKey)) {
      console.warn(`Operation already in progress for team ${teamKey}`);
      return existingTeam || createInitialTeamData(teamId, leagueId);
    }

    // Get abort controller for this operation
    const abortController = getAbortController(teamKey);

    try {
      // Create initial team data
      const initialTeamData = createInitialTeamData(teamId, leagueId);

      // PERSIST IMMEDIATELY: Add team to localStorage right away
      persistTeamData(teamKey, initialTeamData, state.teams, configContext);

      // Add optimistic team to state immediately
      addNewTeamToState(teamKey, initialTeamData, state);

      // Check if operation was aborted
      const abortResult = handleAbortCheck(abortController, initialTeamData);
      if (abortResult) return abortResult;

      // Fetch and process team data
      const updatedTeamData = await fetchTeamAndLeagueData(initialTeamData, force);

      // Check if operation was aborted during fetch
      const fetchAbortResult = handleAbortCheck(abortController, initialTeamData);
      if (fetchAbortResult) return fetchAbortResult;

      // Update state with fetched data
      updateTeamInState(teamKey, updatedTeamData, state);

      // UPDATE PERSISTENCE: Update localStorage with fetched data
      persistTeamData(teamKey, updatedTeamData, state.teams, configContext);

      return updatedTeamData;
    } catch (error) {
      return handleOperationError(error as Error | string | object, abortController, teamId, leagueId, state, configContext);
    } finally {
      // Clean up abort controller
      cleanupAbortController(teamKey);
    }
  }, [state, fetchTeamAndLeagueData, configContext]);

  return {
    processTeamData
  };
}

export function useRefreshTeamSummary(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  configContext: ConfigContextValue
) {
  const fetchTeamAndLeagueData = useFetchTeamAndLeagueData(teamDataFetching);

  const refreshTeamSummary = useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    const teamKey = generateTeamKey(teamId, leagueId);
    const existingTeam = state.teams.get(teamKey);

    if (!existingTeam) {
      throw new Error(`Team ${teamId} in league ${leagueId} not found`);
    }

    // Check if there's already an ongoing operation for this team
    if (hasOngoingOperation(teamKey)) {
      console.warn(`Refresh operation already in progress for team ${teamKey}`);
      return;
    }

    // Get abort controller for this operation
    const abortController = getAbortController(teamKey);

    try {
      // Update state with loading state (no persistence needed since data doesn't change)
      const loadingTeamData: TeamData = {
        ...existingTeam,
        team: {
          ...existingTeam.team,
          isLoading: true
        },
        isLoading: true
      };

      // Update state with loading state
      updateTeamInState(teamKey, loadingTeamData, state);

      // Check if operation was aborted
      if (abortController.signal.aborted) {
        // Silently handle abort - this is expected when operations are replaced
        return;
      }

      // Fetch fresh team data
      const updatedTeamData = await fetchTeamAndLeagueData(existingTeam, true);

      // Check if operation was aborted during fetch
      if (abortController.signal.aborted) {
        // Silently handle abort - this is expected when operations are replaced
        return;
      }

      // Update state with fresh data
      updateTeamInState(teamKey, updatedTeamData, state);

      // UPDATE PERSISTENCE: Update localStorage with fresh data
      try {
        const currentTeams = new Map(state.teams);
        currentTeams.set(teamKey, updatedTeamData);
        configContext.setTeams(currentTeams);
      } catch (error) {
        console.warn('Failed to update team persistence after refresh:', error);
        // Continue even if persistence update fails
      }
    } catch (error) {
      // Only handle actual errors, not aborts
      if (!abortController.signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh team summary';
        updateTeamError(teamId, leagueId, errorMessage, state, configContext);
        throw error;
      }
      // Silently handle abort - no need to throw or update error state
    } finally {
      // Clean up abort controller
      cleanupAbortController(teamKey);
    }
  }, [state, fetchTeamAndLeagueData, configContext]);

  return {
    refreshTeamSummary
  };
}

export function useTeamDataOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  configContext: ConfigContextValue
) {
  const { processTeamData } = useProcessTeamData({
    teams: state.teams,
    setTeams: state.setTeams
  }, teamDataFetching, configContext);

  const addTeam = useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    try {
      await processTeamData(teamId, leagueId, false);
    } catch (error) {
      console.error('Failed to add team:', error);
      throw error;
    }
  }, [processTeamData]);

  const refreshTeam = useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    try {
      await processTeamData(teamId, leagueId, true);
    } catch (error) {
      console.error('Failed to refresh team:', error);
      throw error;
    }
  }, [processTeamData]);

  return {
    addTeam,
    refreshTeam
  };
}

export function useTeamSummaryOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  configContext: ConfigContextValue
) {
  const { refreshTeamSummary } = useRefreshTeamSummary({
    teams: state.teams,
    setTeams: state.setTeams
  }, teamDataFetching, configContext);

  const refreshTeamSummaryOp = useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    try {
      await refreshTeamSummary(teamId, leagueId);
    } catch (error) {
      console.error('Failed to refresh team summary:', error);
      throw error;
    }
  }, [refreshTeamSummary]);

  const refreshAllTeamSummaries = useCallback(async (): Promise<void> => {
    const teamKeys = Array.from(state.teams.keys());
    
    for (const teamKey of teamKeys) {
      const [teamId, leagueId] = teamKey.split('-').map(Number);
      if (!isNaN(teamId) && !isNaN(leagueId)) {
        try {
          await refreshTeamSummary(teamId, leagueId);
        } catch (error) {
          console.error(`Failed to refresh team ${teamId} in league ${leagueId}:`, error);
          // Continue with other teams even if one fails
        }
      }
    }
  }, [refreshTeamSummary, state.teams]);

  return {
    refreshTeamSummary: refreshTeamSummaryOp,
    refreshAllTeamSummaries
  };
}

export function useTeamStateOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
    selectedTeamId: { teamId: number; leagueId: number } | null;
    setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => void;
    clearSelectedTeamId: () => void;
  },
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue,
  fetchTeamAndLeagueData: FetchTeamAndLeagueDataFunction
) {
  // Remove team
  const removeTeam = useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    const key = generateTeamKey(teamId, leagueId);
    const teamToRemove = state.teams.get(key);
    
    // ABORT ONGOING OPERATIONS: Abort any ongoing operations for this team
    cleanupAbortController(key);
    
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.delete(key);
      return newTeams;
    });
    
    // PERSIST: Persist the updated state (team already removed)
    try {
      configContext.setTeams(state.teams);
    } catch (error) {
      console.warn('Failed to persist team removal:', error);
      // Continue with the operation even if persistence fails
    }
    
    // Clear selected team if it was the removed team
    if (state.selectedTeamId && state.selectedTeamId.teamId === teamId && state.selectedTeamId.leagueId === leagueId) {
      state.clearSelectedTeamId();
      configContext.setActiveTeam(null);
    }
    
    // Perform cleanup of matches and players if the team had data
    if (teamToRemove) {
      const remainingTeams = Array.from(state.teams.values());
      cleanupUnusedData(teamToRemove, remainingTeams, matchContext, playerContext);
    }
  }, [state, matchContext, playerContext, configContext]);

  // Edit team (update team ID and league ID)
  const editTeam = useCallback(async (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number): Promise<void> => {
    const currentKey = generateTeamKey(currentTeamId, currentLeagueId);
    const existingTeam = state.teams.get(currentKey);
    
    // ABORT ONGOING OPERATIONS: Abort any ongoing operations for the old team
    cleanupAbortController(currentKey);
    
    try {
      await editTeamData(
        currentTeamId,
        currentLeagueId,
        newTeamId,
        newLeagueId,
        existingTeam,
        fetchTeamAndLeagueData,
        state,
        configContext
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit team';
      updateTeamError(newTeamId, newLeagueId, errorMessage, state, configContext);
    }
  }, [state, configContext, fetchTeamAndLeagueData]);

  return { removeTeam, editTeam };
} 