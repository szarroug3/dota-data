"use client";

/**
 * Team Context
 * 
 * Manages team state and provides actions for team operations.
 * Handles league-specific data filtering and player aggregation.
 * Uses config context for persistence of team list and active team.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useMatchContext } from '@/contexts/match-context';
import { usePlayerContext } from '@/contexts/player-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import { useTeamOperations } from '@/hooks/use-team-operations';
import { useTeamStateOperations } from '@/hooks/use-team-state-operations';
import { useTeamSummaryOperations } from '@/hooks/use-team-summary-operations';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamContextProviderProps, TeamContextValue, TeamData, TeamMatchParticipation, TeamState } from '@/types/contexts/team-context-value';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useTeamState() {
  const [teams, setTeams] = useState<Map<string, TeamData>>(new Map());

  return {
    teams,
    setTeams
  };
}

// Helper function to calculate high-performing heroes
function calculateHighPerformingHeroes(
  matches: Map<number, Match>,
  teamMatches: Record<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>
): Set<string> {
  const heroStats: Record<string, { count: number; wins: number; totalGames: number }> = {};
  
  // Aggregate hero statistics from unhidden matches
  matches.forEach((matchData, matchId) => {
    // Skip manually hidden matches
    if (hiddenMatchIds.has(matchId)) {
      return;
    }
    
    const matchTeamData = teamMatches[matchId];
    if (!matchTeamData?.side) {
      return;
    }
    
    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';
    
    teamPlayers.forEach(player => {
      const heroId = player.hero.id.toString();
      if (!heroStats[heroId]) {
        heroStats[heroId] = { count: 0, wins: 0, totalGames: 0 };
      }
      
      heroStats[heroId].count++;
      heroStats[heroId].totalGames++;
      if (isWin) {
        heroStats[heroId].wins++;
      }
    });
  });
  
  // Identify high-performing heroes (5+ games, 60%+ win rate)
  const highPerformingHeroes = new Set(
    Object.entries(heroStats)
      .filter(([_, stats]) => stats.count >= 5 && (stats.wins / stats.count) >= 0.6)
      .map(([heroId, _]) => heroId)
  );
  
  return highPerformingHeroes;
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
  
  // Track if teams have been loaded to avoid infinite loops
  const teamsLoadedRef = React.useRef(false);
  
  // Load teams from localStorage on initialization (only once)
  React.useEffect(() => {
    if (!teamsLoadedRef.current) {
      const storedTeams = configContext.getTeams();
      if (storedTeams.size > 0) {
        state.setTeams(storedTeams);
      }
      teamsLoadedRef.current = true;
    }
  }, []); // Only run once on mount
  
  // Get state operations including syncTeamsToStorage
  const stateOperations = useTeamStateOperations(
    {
      teams: state.teams,
      setTeams: state.setTeams,
      selectedTeamId: configContext.activeTeam,
      setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => {
        configContext.setActiveTeam(team);
      },
      clearSelectedTeamId: () => {
        configContext.setActiveTeam(null);
      }
    },
    matchContext,
    playerContext,
    configContext,
    async (teamData: TeamData, _force: boolean) => {
      // This would be the actual implementation for fetching team and league data
      // For now, we'll use a placeholder
      return teamData;
    }
  );
  
  // Create a wrapper state that provides the expected TeamState interface
  const teamState: TeamState = {
    teams: state.teams,
    setTeams: stateOperations.persistTeams, // For team data changes (add, remove, edit)
    setTeamsForLoading: state.setTeams, // For loading state changes (non-persisting)
    selectedTeamId: configContext.activeTeam,
    setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => {
      configContext.setActiveTeam(team);
    }
  };
  
  const actions = useTeamOperations(teamState, teamDataFetching, matchContext, playerContext, configContext);

  // Use summary operations with the team operations functions
  const summaryOperations = useTeamSummaryOperations(
    {
      teams: state.teams,
      setTeams: state.setTeams
    },
    configContext,
    actions.addTeam,
    actions.refreshTeam
  );

  // Calculate high-performing heroes based on selected team's matches
  const highPerformingHeroes = useMemo(() => {
    const selectedTeam = actions.getSelectedTeam();
    if (!selectedTeam) {
      return new Set<string>();
    }

    // For now, we'll use an empty set for hidden matches
    // This will be updated when we have access to hidden matches
    const hiddenMatchIds = new Set<number>();
    return calculateHighPerformingHeroes(matchContext.matches, selectedTeam.matches, hiddenMatchIds);
  }, [matchContext.matches, actions.getSelectedTeam]);

  const contextValue: TeamContextValue = {
    // State
    teams: state.teams,
    selectedTeamId: configContext.activeTeam,
    
    // Core operations
    addTeam: actions.addTeam,
    refreshTeam: actions.refreshTeam,
    removeTeam: actions.removeTeam,
    editTeam: actions.editTeam,
    
    // Team-specific operations
    addMatchToTeam: actions.addMatchToTeam,
    addPlayerToTeam: actions.addPlayerToTeam,
    
    // Team list management
    setTeams: actions.setTeams,
    loadTeamsFromConfig: actions.loadTeamsFromConfig,
    
    // Data access
    setSelectedTeamId: (teamId: number, leagueId: number) => {
      configContext.setActiveTeam({ teamId, leagueId });
    },
    clearSelectedTeamId: () => configContext.setActiveTeam(null),
    getTeam: actions.getTeam,
    getSelectedTeam: actions.getSelectedTeam,
    getAllTeams: actions.getAllTeams,
    
    // Summary operations
    refreshTeamSummary: summaryOperations.refreshTeamSummary,
    refreshAllTeamSummaries: summaryOperations.refreshAllTeamSummaries,
    
    // High-performing heroes
    highPerformingHeroes
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