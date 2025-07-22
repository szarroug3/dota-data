"use client";

/**
 * Team Context
 * 
 * Manages team state and provides actions for team operations.
 * Handles league-specific data filtering and player aggregation.
 * Uses config context for persistence of team list and active team.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useMatchContext } from '@/contexts/match-context';
import { usePlayerContext } from '@/contexts/player-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { PlayerMatchData } from '@/types/contexts/match-context-value';
import type { TeamContextProviderProps, TeamContextValue, TeamData, TeamMatchParticipation, TeamPlayer } from '@/types/contexts/team-context-value';
import type { DotabuffMatchSummary, OpenDotaPlayerComprehensive } from '@/types/external-apis';
import {
  createBasicTeamData,
  determineTeamSideFromMatch,
  extractPlayersFromMatchSide,
  generateTeamKey,
  updateTeamPerformance,
  validateActiveTeam
} from '@/utils/team-helpers';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to persist teams to config
function persistTeamsToConfig(
  teams: Map<string, TeamData>,
  configContext: ReturnType<typeof useConfigContext>
) {
  const currentTeams = Array.from(teams.values());
  configContext.setTeamList(currentTeams);
}

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useTeamState() {
  const [teams, setTeams] = useState<Map<string, TeamData>>(new Map());
  const [activeTeam, setActiveTeam] = useState<{ teamId: string; leagueId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    teams, setTeams,
    activeTeam, setActiveTeam,
    isLoading, setIsLoading,
    error, setError
  };
}

// Helper function to update team state with a generic updater
function useTeamUpdater(state: ReturnType<typeof useTeamState>) {
  return useCallback((
    teamKey: string, 
    updater: (team: TeamData) => TeamData
  ) => {
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      const existingTeam = newTeams.get(teamKey);
      
      if (existingTeam) {
        const updatedTeam = updater(existingTeam);
        newTeams.set(teamKey, updatedTeam);
      }
      
      return newTeams;
    });
  }, [state]);
}

// Helper function to update team's matches list
function useUpdateTeamMatches(
  state: ReturnType<typeof useTeamState>,
  matchContext: ReturnType<typeof useMatchContext>
) {
  const updateTeam = useTeamUpdater(state);
  
  return useCallback((key: string, matchId: string, teamSide: 'radiant' | 'dire', match: ReturnType<typeof matchContext.getMatch>) => {
    updateTeam(key, (existingTeam) => {
      // Check if match already exists in team's matches
      const matchExists = existingTeam.matches.some(m => m.matchId === matchId);
      
      if (!matchExists && match) {
        // Add new match to team's matches list
        const newMatchParticipation: TeamMatchParticipation = {
          matchId,
          side: teamSide,
          opponentTeamName: teamSide === 'radiant' ? match.players.dire[0]?.playerName || 'Unknown' : match.players.radiant[0]?.playerName || 'Unknown'
        };
        
        return {
          ...existingTeam,
          matches: [...existingTeam.matches, newMatchParticipation]
        };
      }
      
      return existingTeam;
    });
  }, [updateTeam, matchContext]);
}

// Helper function to update team's players list
function useUpdateTeamPlayers(
  state: ReturnType<typeof useTeamState>
) {
  const updateTeam = useTeamUpdater(state);
  
  return useCallback((key: string, player: OpenDotaPlayerComprehensive) => {
    updateTeam(key, (existingTeam) => {
      // Check if player already exists in team's players
      const playerExists = existingTeam.players.some(p => p.accountId === player.profile.profile.account_id);
      
      if (!playerExists && player) {
        // Add new player to team's players list
        const newTeamPlayer: TeamPlayer = {
          accountId: player.profile.profile.account_id,
          playerName: player.profile.profile.personaname || 'Unknown Player',
          roles: [], // Will be populated based on match data
          totalMatches: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          averageKDA: 0,
          averageGPM: 0,
          averageXPM: 0,
          averageLastHits: 0,
          averageDenies: 0
        };
        
        return {
          ...existingTeam,
          players: [...existingTeam.players, newTeamPlayer]
        };
      }
      
      return existingTeam;
    });
  }, [updateTeam]);
}

// Helper function to fetch and process team data
function useFetchAndProcessTeamData(
  teamDataFetching: ReturnType<typeof useTeamDataFetching>
) {
  return useCallback(async (teamId: string, leagueId: string, force: boolean) => {
    // Fetch team and league data with force parameter
    const teamData = await teamDataFetching.fetchTeamData(teamId, force);
    const leagueData = await teamDataFetching.fetchLeagueData(leagueId, force);
    
    if ('error' in teamData) {
      throw new Error(teamData.error);
    }
    
    if ('error' in leagueData) {
      throw new Error(leagueData.error);
    }
    
    // Return the raw data - processing will be done in useProcessTeamData
    return {
      team: teamData,
      league: leagueData,
      matches: teamData.matches
    };
  }, [teamDataFetching]);
}

// Helper function to process a single match and extract players
async function processMatchAndExtractPlayers(
  matchSummary: DotabuffMatchSummary,
  teamId: string,
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>
): Promise<TeamMatchParticipation | null> {
  try {
    // Fetch the detailed match data
    const match = await matchContext.addMatch(matchSummary.matchId);
    if (!match) {
      throw new Error(`Failed to retrieve match data for ${matchSummary.matchId}`);
    }

    // Determine the correct team side
    const teamSide = determineTeamSideFromMatch(match, teamId);
    
    // Create match participation with correct side
    const matchParticipation: TeamMatchParticipation = {
      matchId: matchSummary.matchId,
      side: teamSide,
      opponentTeamName: matchSummary.opponentName
    };

    // Extract and add players from the correct side
    const players = teamSide === 'radiant' ? match.players.radiant : match.players.dire;
    const playerIds = players.map((player: PlayerMatchData) => player.playerId);
    
    for (const playerId of playerIds) {
      await playerContext.addPlayer(playerId);
    }

    return matchParticipation;
  } catch (err) {
    // If we can't determine the side, skip this match
    console.warn(`Skipping match ${matchSummary.matchId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return null;
  }
}

function useProcessTeamData(
  state: ReturnType<typeof useTeamState>,
  fetchAndProcessTeamData: ReturnType<typeof useFetchAndProcessTeamData>,
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>,
  teamDataFetching: ReturnType<typeof useTeamDataFetching>
) {
  const updateTeam = useTeamUpdater(state);
  
  return useCallback(async (teamId: string, leagueId: string, force: boolean) => {
    try {
      state.setIsLoading(true);
      state.setError(null);

      // Fetch team and league data
      const processedTeam = await fetchAndProcessTeamData(teamId, leagueId, force);
      
      // Also fetch the original team data to get match results
      const originalTeamData = await teamDataFetching.fetchTeamData(teamId, force);
      if ('error' in originalTeamData) {
        throw new Error(originalTeamData.error);
      }
      
      // Create the team data with basic info (without matches for now)
      const teamKey = generateTeamKey(teamId, leagueId);
      const basicTeamData: TeamData = createBasicTeamData(processedTeam);

      // Add the team to state first
      state.setTeams(prev => {
        const newTeams = new Map(prev);
        newTeams.set(teamKey, basicTeamData);
        return newTeams;
      });

      // Now process each match to get the correct side and update the team data
      const matchesWithCorrectSides: TeamMatchParticipation[] = [];
      
      for (const matchSummary of processedTeam.matches) {
        const matchParticipation = await processMatchAndExtractPlayers(matchSummary, teamId, matchContext, playerContext);
        if (matchParticipation) {
          matchesWithCorrectSides.push(matchParticipation);
        }
      }

      // Update the team with the matches that have correct sides
      updateTeam(teamKey, (team) => updateTeamPerformance(team, matchesWithCorrectSides, originalTeamData));
      
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to process team');
    } finally {
      state.setIsLoading(false);
    }
  }, [state, fetchAndProcessTeamData, matchContext, playerContext, teamDataFetching, updateTeam]);
}

function useTeamCoreActions(
  state: ReturnType<typeof useTeamState>,
  teamDataFetching: ReturnType<typeof useTeamDataFetching>,
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>,
  configContext: ReturnType<typeof useConfigContext>
) {
  const updateTeamMatches = useUpdateTeamMatches(state, matchContext);
  const updateTeamPlayers = useUpdateTeamPlayers(state);
  const fetchAndProcessTeamData = useFetchAndProcessTeamData(teamDataFetching);
  const processTeamData = useProcessTeamData(state, fetchAndProcessTeamData, matchContext, playerContext, teamDataFetching);

  // Add team (force = false)
  const addTeam = useCallback(async (teamId: string, leagueId: string) => {
    try {
      await processTeamData(teamId, leagueId, false);
      
      // Persist teams to config context
      persistTeamsToConfig(state.teams, configContext);
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to add team');
    }
  }, [processTeamData, state, configContext]);

  // Refresh team (force = true)
  const refreshTeam = useCallback(async (teamId: string, leagueId: string) => {
    try {
      await processTeamData(teamId, leagueId, true);
      
      // Persist teams to config context
      persistTeamsToConfig(state.teams, configContext);
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to refresh team');
    }
  }, [processTeamData, state, configContext]);

  // Remove team
  const removeTeam = useCallback((teamId: string, leagueId: string) => {
    const key = generateTeamKey(teamId, leagueId);
    state.setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.delete(key);
      return newTeams;
    });
    
    // Clear active team if it was the removed team
    if (state.activeTeam && state.activeTeam.teamId === teamId && state.activeTeam.leagueId === leagueId) {
      state.setActiveTeam(null);
      configContext.setActiveTeam(null);
    }
    
    // Persist teams to config context
    persistTeamsToConfig(state.teams, configContext);
  }, [state, configContext]);

  // Set active team
  const setActiveTeam = useCallback(async (teamId: string | null, leagueId?: string) => {
    if (teamId === null) {
      state.setActiveTeam(null);
      configContext.setActiveTeam(null);
      return;
    }
    
    if (!leagueId) {
      throw new Error('League ID is required when setting active team');
    }
    
    state.setActiveTeam({ teamId, leagueId });
    configContext.setActiveTeam({ teamId, leagueId });
  }, [state, configContext]);

  // Add match to team
  const addMatchToTeam = useCallback(async (matchId: string, teamSide: 'radiant' | 'dire') => {
    const activeTeam = validateActiveTeam(state.activeTeam);
    const key = generateTeamKey(activeTeam.teamId, activeTeam.leagueId);

    // Add the match and get the processed match data directly
    const match = await matchContext.addMatch(matchId);
    if (!match) {
      throw new Error('Failed to retrieve match data');
    }
    
    // Extract player IDs from the appropriate side
    const playerIds = extractPlayersFromMatchSide(match, teamSide);
    
    // Add each player to the player context
    for (const playerId of playerIds) {
      await playerContext.addPlayer(playerId);
    }

    // Update team's matches list
    updateTeamMatches(key, matchId, teamSide, match);
  }, [state, matchContext, playerContext, updateTeamMatches]);

  // Add player to team
  const addPlayerToTeam = useCallback(async (playerId: string) => {
    const activeTeam = validateActiveTeam(state.activeTeam);
    const key = generateTeamKey(activeTeam.teamId, activeTeam.leagueId);

    // Add the player and get the processed player data directly
    const player = await playerContext.addPlayer(playerId);
    if (!player) {
      throw new Error('Failed to retrieve player data');
    }

    // Update team's players list
    updateTeamPlayers(key, player);
  }, [state, playerContext, updateTeamPlayers]);

  return {
    addTeam,
    refreshTeam,
    removeTeam,
    setActiveTeam,
    addMatchToTeam,
    addPlayerToTeam
  };
}

function useTeamVisibilityActions(
  state: ReturnType<typeof useTeamState>
) {
  const updateTeam = useTeamUpdater(state);
  
  // Generic function to toggle visibility of matches or players
  const toggleVisibility = useCallback((
    teamId: string, 
    leagueId: string, 
    itemId: string, 
    itemType: 'match' | 'player',
    hidden: boolean
  ) => {
    const key = generateTeamKey(teamId, leagueId);
    
    updateTeam(key, (team) => {
      if (itemType === 'match') {
        return {
          ...team,
          matches: team.matches.map(match => 
            match.matchId === itemId 
              ? { ...match, hidden }
              : match
          )
        };
      } else {
        return {
          ...team,
          players: team.players.map(player => 
            player.accountId.toString() === itemId 
              ? { ...player, hidden }
              : player
          )
        };
      }
    });
  }, [updateTeam]);

  // Hide match for a specific team
  const hideMatch = useCallback((teamId: string, leagueId: string, matchId: string) => {
    toggleVisibility(teamId, leagueId, matchId, 'match', true);
  }, [toggleVisibility]);

  // Show match for a specific team
  const showMatch = useCallback((teamId: string, leagueId: string, matchId: string) => {
    toggleVisibility(teamId, leagueId, matchId, 'match', false);
  }, [toggleVisibility]);

  // Hide player for a specific team
  const hidePlayer = useCallback((teamId: string, leagueId: string, playerId: string) => {
    toggleVisibility(teamId, leagueId, playerId, 'player', true);
  }, [toggleVisibility]);

  // Show player for a specific team
  const showPlayer = useCallback((teamId: string, leagueId: string, playerId: string) => {
    toggleVisibility(teamId, leagueId, playerId, 'player', false);
  }, [toggleVisibility]);

  return {
    hideMatch,
    showMatch,
    hidePlayer,
    showPlayer
  };
}

function useTeamUtilityActions(
  state: ReturnType<typeof useTeamState>
) {
  // Set teams (for hydration)
  const setTeams = useCallback((teams: Map<string, TeamData>) => {
    state.setTeams(teams);
  }, [state]);

  return {
    setTeams
  };
}

// Load teams from config context
function useLoadTeamsFromConfig(
  state: ReturnType<typeof useTeamState>,
) {
  return useCallback(async (teamList: TeamData[]) => {
    state.setIsLoading(true);
    state.setError(null);

    try {
      // Convert TeamData[] to Map<string, TeamData> format
      const teamMap = new Map<string, TeamData>();
      teamList.forEach(team => {
        const key = generateTeamKey(team.team.id, team.league.id);
        teamMap.set(key, team);
      });
      
      // Set the teams in the team context state
      state.setTeams(teamMap);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : 'Failed to load teams from config');
    } finally {
      state.setIsLoading(false);
    }
  }, [state]);
}

function useTeamActions(
  state: ReturnType<typeof useTeamState>,
  teamDataFetching: ReturnType<typeof useTeamDataFetching>,
  matchContext: ReturnType<typeof useMatchContext>,
  playerContext: ReturnType<typeof usePlayerContext>,
  configContext: ReturnType<typeof useConfigContext>
) {
  const coreActions = useTeamCoreActions(state, teamDataFetching, matchContext, playerContext, configContext);
  const visibilityActions = useTeamVisibilityActions(state);
  const utilityActions = useTeamUtilityActions(state);
  const loadTeamsFromConfig = useLoadTeamsFromConfig(state);

  return {
    ...coreActions,
    ...visibilityActions,
    ...utilityActions,
    loadTeamsFromConfig
  };
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const TeamProvider: React.FC<TeamContextProviderProps> = ({ children }) => {
  const state = useTeamState();
  const teamDataFetching = useTeamDataFetching();
  const matchContext = useMatchContext();
  const playerContext = usePlayerContext();
  const configContext = useConfigContext();
  
  const actions = useTeamActions(state, teamDataFetching, matchContext, playerContext, configContext);

  const contextValue: TeamContextValue = {
    // State
    teams: state.teams,
    activeTeam: state.activeTeam,
    isLoading: state.isLoading,
    error: state.error,
    
    // Core operations
    addTeam: actions.addTeam,
    refreshTeam: actions.refreshTeam,
    removeTeam: actions.removeTeam,
    setActiveTeam: actions.setActiveTeam,
    
    // Team-specific operations
    addMatchToTeam: actions.addMatchToTeam,
    addPlayerToTeam: actions.addPlayerToTeam,
    
    // Team list management
    setTeams: actions.setTeams,
    loadTeamsFromConfig: actions.loadTeamsFromConfig,
    
    // Data access
    getTeam: (teamId: string) => {
      for (const [key, value] of state.teams.entries()) {
        if (key.startsWith(`${teamId}-`)) {
          return value;
        }
      }
      return undefined;
    },
    getActiveTeam: () => {
      if (!state.activeTeam) return undefined;
      const key = generateTeamKey(state.activeTeam.teamId, state.activeTeam.leagueId);
      return state.teams.get(key);
    },
    getAllTeams: () => Array.from(state.teams.values()),
    
    // Visibility controls
    hideMatch: actions.hideMatch,
    showMatch: actions.showMatch,
    hidePlayer: actions.hidePlayer,
    showPlayer: actions.showPlayer
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTeamContext = (): TeamContextValue => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
};