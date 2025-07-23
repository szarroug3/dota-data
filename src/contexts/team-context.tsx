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
import type { TeamDataFetchingContextValue } from '@/contexts/team-data-fetching-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import { useFetchTeamAndLeagueData, useTeamDataOperations, useTeamStateOperations, useTeamSummaryOperations } from '@/hooks/use-team-operations';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { Match, MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type {
  LoadTeamsFromConfig,
  TeamActions,
  TeamContextProviderProps,
  TeamContextValue,
  TeamCoreActions,
  TeamData,
  TeamPlayer,
  TeamState,
  TeamUpdater,
  UpdateTeamMatches,
  UpdateTeamPlayers
} from '@/types/contexts/team-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';
import { createTeamUpdater, generateTeamKey } from '@/utils/team-helpers';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useTeamState() {
  const [teams, setTeams] = useState<Map<string, TeamData>>(new Map());
  const [selectedTeamId, setSelectedTeamId] = useState<{ teamId: number; leagueId: number } | null>(null);

  return {
    teams,
    setTeams,
    selectedTeamId,
    setSelectedTeamId
  };
}

// Helper function to update team state with a generic updater
function useTeamUpdater(state: TeamState): TeamUpdater {
  return useCallback((
    teamKey: string, 
    updater: (team: TeamData) => TeamData
  ) => {
    const updateTeam = createTeamUpdater(state.setTeams);
    updateTeam(teamKey, updater);
  }, [state.setTeams]);
}

// Helper function to update team's matches list
function useUpdateTeamMatches(
  state: TeamState
): UpdateTeamMatches {
  const updateTeam = useTeamUpdater(state);
  
  return useCallback((key: string, matchId: number, teamSide: 'radiant' | 'dire', match: Match | undefined) => {
    updateTeam(key, (existingTeam) => {
      // Check if match already exists in team's matches
      const matchExists = existingTeam.matches.some(m => m.matchId === matchId);
      
      if (!matchExists && match) {
        // Add new match to team's matches list
        const newMatchParticipation = {
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
  }, [updateTeam]);
}

// Helper function to update team's players list
function useUpdateTeamPlayers(
  state: TeamState
): UpdateTeamPlayers {
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

function useTeamCoreActions(
  state: TeamState,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue
): TeamCoreActions {
  const updateTeamMatches = useUpdateTeamMatches(state);
  const updateTeamPlayers = useUpdateTeamPlayers(state);

  // Set selected team
  const setSelectedTeamId = useCallback((teamId: number, leagueId: number) => {
    state.setSelectedTeamId({ teamId, leagueId });
    configContext.setActiveTeam({ teamId, leagueId });
  }, [state, configContext]);

  // Clear selected team
  const clearSelectedTeamId = useCallback(() => {
    state.setSelectedTeamId(null);
    configContext.setActiveTeam(null);
  }, [state, configContext]);

  // Get team by ID
  const getTeam = useCallback((teamId: number, leagueId: number) => {
    const key = generateTeamKey(teamId, leagueId);
    return state.teams.get(key);
  }, [state.teams]);

  // Get selected team data
  const getSelectedTeam = useCallback(() => {
    if (!state.selectedTeamId) return undefined;
    return getTeam(state.selectedTeamId.teamId, state.selectedTeamId.leagueId);
  }, [state.selectedTeamId, getTeam]);

  // Get all teams as array
  const getAllTeams = useCallback(() => {
    return Array.from(state.teams.values()).sort((a, b) => new Date(b.timeAdded).getTime() - new Date(a.timeAdded).getTime());
  }, [state.teams]);

  // Add match to team
  const addMatchToTeam = useCallback(async (matchId: number, teamSide: 'radiant' | 'dire') => {
    if (!state.selectedTeamId) {
      throw new Error('No active team selected');
    }
    
    const key = generateTeamKey(state.selectedTeamId.teamId, state.selectedTeamId.leagueId);
    const match = matchContext.getMatch(matchId);
    
    if (match) {
      updateTeamMatches(key, matchId, teamSide, match);
    }
  }, [state.selectedTeamId, matchContext, updateTeamMatches]);

  // Add player to team
  const addPlayerToTeam = useCallback(async (playerId: number) => {
    if (!state.selectedTeamId) {
      throw new Error('No active team selected');
    }
    
    const key = generateTeamKey(state.selectedTeamId.teamId, state.selectedTeamId.leagueId);
    const player = await playerContext.addPlayer(playerId);
    
    if (player) {
      updateTeamPlayers(key, player);
    }
  }, [state.selectedTeamId, playerContext, updateTeamPlayers]);

  return {
    setSelectedTeamId,
    clearSelectedTeamId,
    getTeam,
    getSelectedTeam,
    getAllTeams,
    addMatchToTeam,
    addPlayerToTeam
  };
}

function useLoadTeamsFromConfig(
  state: TeamState,
): LoadTeamsFromConfig {
  return useCallback(async (teams: Map<string, TeamData>) => {
    state.setTeams(teams);
  }, [state]);
}

function useTeamActions(
  state: TeamState,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue
): TeamActions {
  const fetchTeamAndLeagueData = useFetchTeamAndLeagueData(teamDataFetching);
  
  const dataOps = useTeamDataOperations({
    teams: state.teams,
    setTeams: state.setTeams
  }, teamDataFetching, configContext);

  const summaryOps = useTeamSummaryOperations({
    teams: state.teams,
    setTeams: state.setTeams,
  }, teamDataFetching, configContext);

  const coreOps = useTeamCoreActions(state, teamDataFetching, matchContext, playerContext, configContext);

  const stateOps = useTeamStateOperations({
    teams: state.teams,
    setTeams: state.setTeams,
    selectedTeamId: state.selectedTeamId,
    setSelectedTeamId: state.setSelectedTeamId,
    clearSelectedTeamId: coreOps.clearSelectedTeamId,
  }, matchContext, playerContext, configContext, fetchTeamAndLeagueData);

  const loadOps = useLoadTeamsFromConfig(state);

  return {
    // State
    teams: state.teams,
    selectedTeamId: state.selectedTeamId,
    
    // Core operations
    addTeam: dataOps.addTeam,
    refreshTeam: dataOps.refreshTeam,
    refreshTeamSummary: summaryOps.refreshTeamSummary,
    refreshAllTeamSummaries: summaryOps.refreshAllTeamSummaries,
    removeTeam: stateOps.removeTeam,
    editTeam: stateOps.editTeam,
    
    // Team-specific operations
    addMatchToTeam: coreOps.addMatchToTeam,
    addPlayerToTeam: coreOps.addPlayerToTeam,
    
    // Team list management
    setTeams: state.setTeams,
    loadTeamsFromConfig: loadOps,
    
    // Data access
    setSelectedTeamId: coreOps.setSelectedTeamId,
    clearSelectedTeamId: coreOps.clearSelectedTeamId,
    getTeam: coreOps.getTeam,
    getSelectedTeam: coreOps.getSelectedTeam,
    getAllTeams: coreOps.getAllTeams
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
    selectedTeamId: state.selectedTeamId,
    
    // Core operations
    addTeam: actions.addTeam,
    refreshTeam: actions.refreshTeam,
    refreshTeamSummary: actions.refreshTeamSummary,
    refreshAllTeamSummaries: actions.refreshAllTeamSummaries,
    removeTeam: actions.removeTeam,
    editTeam: actions.editTeam,
    
    // Team-specific operations
    addMatchToTeam: actions.addMatchToTeam,
    addPlayerToTeam: actions.addPlayerToTeam,
    
    // Team list management
    setTeams: actions.setTeams,
    loadTeamsFromConfig: actions.loadTeamsFromConfig,
    
    // Data access
    setSelectedTeamId: actions.setSelectedTeamId,
    clearSelectedTeamId: actions.clearSelectedTeamId,
    getTeam: actions.getTeam,
    getSelectedTeam: actions.getSelectedTeam,
    getAllTeams: actions.getAllTeams
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