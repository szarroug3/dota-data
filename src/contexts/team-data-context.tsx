import { fetchTeamData, startBackgroundDataFetching } from '@/lib/fetch-data';
import * as React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { TeamDataContextType } from '../types/contexts';
import { Team } from '../types/team';

// ============================================================================
// CONTEXT
// ============================================================================

const TeamDataContext = createContext<TeamDataContextType | null>(null);

export function TeamDataProvider({ children }: { children: React.ReactNode }) {
  const [teamDataByTeam, setTeamDataByTeam] = useState<Record<string, Team>>({});
  const [loadingByTeam, setLoadingByTeam] = useState<Record<string, boolean>>({});
  const [errorByTeam, setErrorByTeam] = useState<Record<string, string | null>>({});
  const [leagueDataByLeague, setLeagueDataByLeague] = useState<Record<string, any>>({});
  const [activeTeamPlayerIds, setActiveTeamPlayerIds] = useState<Set<string>>(new Set());

  const fetchTeamDataWithLeague = useCallback(async (teamId: string, leagueId: string): Promise<void> => {
    // Don't fetch if already loading
    if (loadingByTeam[teamId]) {
      return;
    }

    // Set loading state
    setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: true }));
    setErrorByTeam((prev: Record<string, string | null>) => ({ ...prev, [teamId]: null }));

    try {
      const { teamData, leagueData } = await fetchTeamData(teamId, leagueId);
      
      // Store team and league data
      setTeamDataByTeam((prev: Record<string, Team>) => ({ ...prev, [teamId]: teamData }));
      setLeagueDataByLeague((prev: Record<string, any>) => ({ ...prev, [leagueId]: leagueData }));
      setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: false }));

      // Extract active team player IDs from team data
      const playerIds = new Set<string>();
      if (teamData.players) {
        teamData.players.forEach((player: any) => {
          if (player.account_id) {
            playerIds.add(player.account_id.toString());
          }
        });
      }
      setActiveTeamPlayerIds(playerIds);

      // Start background data fetching for matches and players
      startBackgroundDataFetching(teamData, leagueId, playerIds);

    } catch (err) {
      console.error(`[TeamDataContext] Error fetching team data for team ${teamId}:`, err);
      setErrorByTeam((prev: Record<string, string | null>) => ({ 
        ...prev, 
        [teamId]: err instanceof Error ? err.message : 'Failed to fetch team data' 
      }));
      setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: false }));
    }
  }, [loadingByTeam]);

  const getTeamData = useCallback((teamId: string): Team | null => {
    // Return cached data if available
    if (teamDataByTeam[teamId]) {
      return teamDataByTeam[teamId];
    }

    return null;
  }, [teamDataByTeam]);

  const getLeagueData = useCallback((leagueId: string): any => {
    return leagueDataByLeague[leagueId] || null;
  }, [leagueDataByLeague]);

  const isTeamLoading = useCallback((teamId: string): boolean => {
    return loadingByTeam[teamId] || false;
  }, [loadingByTeam]);

  const getTeamError = useCallback((teamId: string): string | null => {
    return errorByTeam[teamId] || null;
  }, [errorByTeam]);

  const getActiveTeamPlayerIds = useCallback((): Set<string> => {
    return activeTeamPlayerIds;
  }, [activeTeamPlayerIds]);

  const updateTeamData = useCallback((teamId: string, teamData: Team): void => {
    setTeamDataByTeam((prev: Record<string, Team>) => ({ ...prev, [teamId]: teamData }));
  }, []);

  const removeTeamData = useCallback((teamId: string): void => {
    setTeamDataByTeam((prev: Record<string, Team>) => {
      const newData = { ...prev };
      delete newData[teamId];
      return newData;
    });
    setLoadingByTeam((prev: Record<string, boolean>) => {
      const newLoading = { ...prev };
      delete newLoading[teamId];
      return newLoading;
    });
    setErrorByTeam((prev: Record<string, string | null>) => {
      const newError = { ...prev };
      delete newError[teamId];
      return newError;
    });
  }, []);

  const value: TeamDataContextType = {
    teamDataByTeam,
    loadingByTeam,
    errorByTeam,
    leagueDataByLeague,
    activeTeamPlayerIds,
    fetchTeamData: fetchTeamDataWithLeague,
    getTeamData,
    getLeagueData,
    isTeamLoading,
    getTeamError,
    getActiveTeamPlayerIds,
    updateTeamData,
    removeTeamData,
  };

  return (
    <TeamDataContext.Provider value={value}>
      {children}
    </TeamDataContext.Provider>
  );
}

export function useTeamData() {
  const context = useContext(TeamDataContext);
  if (!context) {
    throw new Error('useTeamData must be used within a TeamDataProvider');
  }
  return context;
} 