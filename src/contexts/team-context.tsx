"use client";
import { fetchTeamData } from '@/lib/fetch-data';
import { Trophy, Users } from 'lucide-react';
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { logWithTimestamp } from '../lib/utils';
import { TeamContextType } from '../types/contexts';
import { Match, Player, Team } from '../types/team';

// ============================================================================
// CONSTANTS
// ============================================================================

const TEAMS_STORAGE_KEY = "dotaDashboardTeams";
const ACTIVE_TEAM_KEY = "activeTeamId";

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================

function saveTeamsToLocalStorage(teams: Team[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  }
}

function loadTeamsFromLocalStorage(): Team[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Team[];
      } catch (error) {
        logWithTimestamp('error', "[TeamContext] Error parsing teams from localStorage:", error);
      }
    }
  }
  return [];
}

function saveActiveTeamToLocalStorage(teamId: string | null): void {
  if (typeof window !== "undefined") {
    if (teamId) {
      localStorage.setItem(ACTIVE_TEAM_KEY, teamId);
    } else {
      localStorage.removeItem(ACTIVE_TEAM_KEY);
    }
  }
}

function loadActiveTeamFromLocalStorage(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACTIVE_TEAM_KEY);
  }
  return null;
}

// ============================================================================
// API HELPERS
// ============================================================================

// Note: fetchTeamData is now imported from @/lib/fetch-data

// ============================================================================
// CONTEXT
// ============================================================================

const TeamContext = createContext<TeamContextType | undefined>(undefined);

function useTeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load teams and active team from localStorage on mount
  useEffect(() => {
    const loadTeams = (): void => {
      const storedTeams = loadTeamsFromLocalStorage();
      const activeTeamId = loadActiveTeamFromLocalStorage();
      
      setTeams(storedTeams);
      
      if (activeTeamId && storedTeams.length > 0) {
        const foundTeam = storedTeams.find(team => team.id === activeTeamId);
        if (foundTeam) {
          setActiveTeamState(foundTeam);
        } else {
          // Active team not found, set first team as active
          setActiveTeamState(storedTeams[0]);
          saveActiveTeamToLocalStorage(storedTeams[0].id);
        }
      } else if (storedTeams.length > 0) {
        // No active team saved, set first team as active
        setActiveTeamState(storedTeams[0]);
        saveActiveTeamToLocalStorage(storedTeams[0].id);
      }
      
      setIsLoaded(true);
    };

    // Delay loading to ensure we're on client side
    setTimeout(loadTeams, 0);
  }, []);

  // Save teams to localStorage whenever teams change
  useEffect(() => {
    if (isLoaded) {
      saveTeamsToLocalStorage(teams);
    }
  }, [teams, isLoaded]);

  // Helper function to update teams state
  const updateTeams = (updater: (teams: Team[]) => Team[]): void => {
    setTeams((prevTeams: Team[]) => {
      const newTeams = updater(prevTeams);
      return newTeams;
    });
  };

  // Helper function to find team by ID
  const getTeamById = (teamId: string): Team | null => {
    return teams.find((team: Team) => team.id === teamId) || null;
  };

  return {
    teams,
    activeTeam,
    isLoaded,
    setActiveTeamState,
    updateTeams,
    getTeamById
  };
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const {
    teams,
    activeTeam,
    isLoaded,
    setActiveTeamState,
    updateTeams,
    getTeamById
  } = useTeamManagement();

  // Add a new team
  const addTeam = async (teamId: string, leagueId: string): Promise<void> => {
    const uniqueId = `${teamId}-${leagueId}`;
    
    // Check if team already exists
    if (teams.some((team: Team) => team.id === uniqueId)) {
      logWithTimestamp('warn', `[TeamContext] Team ${uniqueId} already exists`);
      return;
    }

    // Create optimistic team entry
    const optimisticTeam: Team = {
      id: uniqueId,
      teamId,
      teamName: `Team ${teamId}`, // Show ID until name is available
      leagueId,
      leagueName: `League ${leagueId}`, // Show ID until name is available
      players: [],
      matchIds: [],
      manualMatches: [],
      manualPlayers: [],
      hiddenMatches: [],
      hiddenPlayers: [],
      loading: true // Mark as loading
    };

    // Add optimistically to the list
    updateTeams(prevTeams => [...prevTeams, optimisticTeam]);
    
    // Set as active team
    setActiveTeamState(optimisticTeam);
    saveActiveTeamToLocalStorage(uniqueId);

    try {
      // Use the new standardized API to fetch team and league data
      const { teamData, leagueData } = await fetchTeamData(teamId, leagueId);
      
      const teamName = teamData.teamName || `Team ${teamId}`;
      const leagueName = leagueData.leagueName || `League ${leagueId}`;
      
      // Extract match IDs from the new structure
      const matchIds = teamData.matchIdsByLeague?.[leagueId] || [];

      // Update the team with real data
      updateTeams(prevTeams =>
        prevTeams.map(team =>
          team.id === uniqueId
            ? {
                ...team,
                teamName,
                leagueName,
                matchIds,
                loading: false
              }
            : team
        )
      );

      logWithTimestamp('log', `[TeamContext] Added team ${uniqueId} with name "${teamName}" and league "${leagueName}"`);
    } catch (error) {
      logWithTimestamp('error', `[TeamContext] Error adding team ${uniqueId}:`, error);
      
      // Remove the optimistic entry on error
      updateTeams(prevTeams => prevTeams.filter(team => team.id !== uniqueId));
      
      // If this was the only team, clear active team
      if (teams.length === 0) {
        setActiveTeamState(null);
        saveActiveTeamToLocalStorage(null);
      }
      
      throw error;
    }
  };

  // Remove a team
  const removeTeam = (teamId: string): void => {
    updateTeams((prevTeams: Team[]) => prevTeams.filter((team: Team) => team.id !== teamId));
    
    // If removing active team, set first remaining team as active
    if (activeTeam?.id === teamId) {
      const remainingTeams = teams.filter((team: Team) => team.id !== teamId);
      if (remainingTeams.length > 0) {
        setActiveTeamState(remainingTeams[0]);
        saveActiveTeamToLocalStorage(remainingTeams[0].id);
      } else {
        setActiveTeamState(null);
        saveActiveTeamToLocalStorage(null);
      }
    }
  };

  // Set active team
  const setActiveTeam = (teamId: string | null): void => {
    if (teamId) {
      const team: Team | null = getTeamById(teamId);
      if (team) {
        setActiveTeamState(team);
        saveActiveTeamToLocalStorage(teamId);
      }
    } else {
      setActiveTeamState(null);
      saveActiveTeamToLocalStorage(null);
    }
  };

  // Update team name
  const updateTeamName = (teamId: string, teamName: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, teamName } : team
      )
    );
  };

  // Update match IDs from API
  const updateMatchIds = (teamId: string, matchIds: string[]): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, matchIds } : team
      )
    );
  };

  // Update team data from API
  const updateTeamData = (teamId: string, updates: Partial<Team>): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId ? { ...team, ...updates } : team
      )
    );
  };

  // Add manual player
  const addManualPlayer = (teamId: string, player: Omit<Player, "addedDate">): void => {
    const newPlayer: Player = {
      ...player,
      addedDate: new Date().toISOString()
    };

    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, manualPlayers: [...team.manualPlayers, newPlayer] }
          : team
      )
    );
  };

  // Remove manual player
  const removeManualPlayer = (teamId: string, playerId: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, manualPlayers: team.manualPlayers.filter(p => p.id !== playerId) }
          : team
      )
    );
  };

  // Hide player
  const hidePlayer = (teamId: string, playerId: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, hiddenPlayers: [...team.hiddenPlayers, playerId] }
          : team
      )
    );
  };

  // Unhide player
  const unhidePlayer = (teamId: string, playerId: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, hiddenPlayers: team.hiddenPlayers.filter(id => id !== playerId) }
          : team
      )
    );
  };

  // Add manual match
  const addManualMatch = (teamId: string, match: Omit<Match, "id">): void => {
    const newMatch: Match = {
      ...match,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, manualMatches: [...team.manualMatches, newMatch] }
          : team
      )
    );
  };

  // Remove manual match
  const removeManualMatch = (teamId: string, matchId: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, manualMatches: team.manualMatches.filter(m => m.id !== matchId) }
          : team
      )
    );
  };

  // Hide match
  const hideMatch = (teamId: string, matchId: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, hiddenMatches: [...team.hiddenMatches, matchId] }
          : team
      )
    );
  };

  // Unhide match
  const unhideMatch = (teamId: string, matchId: string): void => {
    updateTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, hiddenMatches: team.hiddenMatches.filter(id => id !== matchId) }
          : team
      )
    );
  };

  // Get visible matches (API matches + manual matches, excluding hidden)
  const getVisibleMatches = (teamId: string): Match[] => {
    const team = getTeamById(teamId);
    if (!team) return [];

    const allMatches = [
      ...team.manualMatches,
      // Note: API matches would need to be fetched separately since we only store IDs
    ];

    return allMatches.filter(match => !team.hiddenMatches.includes(match.id));
  };

  // Get visible players (API players + manual players, excluding hidden)
  const getVisiblePlayers = (teamId: string): Player[] => {
    const team = getTeamById(teamId);
    if (!team) return [];

    const allPlayers = [
      ...team.players,
      ...team.manualPlayers
    ];

    return allPlayers.filter(player => !team.hiddenPlayers.includes(player.id));
  };

  // Legacy compatibility functions
  const addMatch = async (match: Omit<Match, "id">): Promise<void> => {
    if (!activeTeam) return;
    addManualMatch(activeTeam.id, match);
  };

  const removeMatch = (matchId: string): void => {
    if (!activeTeam) return;
    removeManualMatch(activeTeam.id, matchId);
  };

  const setCurrentTeam = async (team: Team | string | null): Promise<void> => {
    if (typeof team === 'string') {
      setActiveTeam(team);
    } else if (team) {
      setActiveTeam(team.id);
    } else {
      setActiveTeam(null);
    }
  };

  const addStandinPlayer = (player: Omit<Player, "isStandin" | "addedDate">, standinForId?: string): void => {
    if (!activeTeam) return;
    const newPlayer: Player = {
      ...player,
      isStandin: true,
      standinFor: standinForId,
      addedDate: new Date().toISOString()
    };
    addManualPlayer(activeTeam.id, newPlayer);
  };

  const removeStandinPlayer = (playerId: string): void => {
    if (!activeTeam) return;
    removeManualPlayer(activeTeam.id, playerId);
  };

  const getExternalLinks = (): Array<{ href: string; label: string; icon: React.ReactElement }> => {
    if (!activeTeam) return [];
    
    const links = [];
    
    // Add team's Dotabuff page
    links.push({
      href: `https://www.dotabuff.com/esports/teams/${activeTeam.teamId}`,
      label: `${activeTeam.teamName} on Dotabuff`,
      icon: <Users className="w-5 h-5 text-blue-500" />
    });
    
    // Add league's Dotabuff page if leagueId exists
    if (activeTeam.leagueId) {
      links.push({
        href: `https://www.dotabuff.com/esports/leagues/${activeTeam.leagueId}`,
        label: `${activeTeam.leagueName || 'League'} on Dotabuff`,
        icon: <Trophy className="w-5 h-5 text-yellow-500" />
      });
    }
    
    return links;
  };

  const value: TeamContextType = {
    teams,
    activeTeam,
    isLoaded,
    addTeam,
    removeTeam,
    setActiveTeam,
    updateTeamName,
    updateMatchIds,
    updateTeamData,
    addManualPlayer,
    removeManualPlayer,
    hidePlayer,
    unhidePlayer,
    addManualMatch,
    removeManualMatch,
    hideMatch,
    unhideMatch,
    getTeamById,
    getVisibleMatches,
    getVisiblePlayers,
    currentTeam: activeTeam,
    matches: getVisibleMatches(activeTeam?.id || ''),
    addMatch,
    removeMatch,
    hiddenMatchIds: activeTeam?.hiddenMatches || [],
    setCurrentTeam,
    addStandinPlayer,
    removeStandinPlayer,
    getExternalLinks
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
