import { useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useConstantsContext } from '@/contexts/constants-context';
import { useTeamContext } from '@/contexts/team-context';

/**
 * Hook for app-wide data hydration
 */
export function useAppHydration() {
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [teamsListHydrated, setTeamsListHydrated] = useState(false);
  const [constantsHydrated, setConstantsHydrated] = useState(false);
  const [activeTeamHydrated, setActiveTeamHydrated] = useState(false);
  const hasHydratedRef = useRef(false);

  const configContext = useConfigContext();
  const constantsContext = useConstantsContext();
  const teamContext = useTeamContext();

  // Store context references in refs to avoid recreation
  const contextsRef = useRef({ configContext, constantsContext, teamContext });
  contextsRef.current = { configContext, constantsContext, teamContext };

  // Track component lifecycle
  const mountCountRef = useRef(0);
  const renderCountRef = useRef(0);

  // Increment render count
  renderCountRef.current += 1;

  // Run hydration on mount
  useEffect(() => {
    mountCountRef.current += 1;
    
    // Create the hydrate function inside useEffect to avoid recreation issues
    const hydrate = async () => {
      // Prevent multiple runs
      if (hasHydratedRef.current) {
        return;
      }

      try {
        setIsHydrating(true);
        setHydrationError(null);

        // Step 1: Fetch constants
        await Promise.all([
          contextsRef.current.constantsContext.fetchHeroes(),
          contextsRef.current.constantsContext.fetchItems()
        ]);
        setConstantsHydrated(true);

        // Step 2: Load teams from config
        const teams = contextsRef.current.configContext.getTeams();
        if (teams && teams.size > 0) {
          // Delegate to team context to handle loading teams from config
          await contextsRef.current.teamContext.loadTeamsFromConfig(teams);
          setTeamsListHydrated(true);

          // Get active team info before refreshing summaries
          const { activeTeam } = contextsRef.current.configContext;
          const activeTeamKey = activeTeam ? `${activeTeam.teamId}-${activeTeam.leagueId}` : null;

          // Refresh all team summaries in the background, but skip the active team
          // since it will be handled separately to avoid duplicate calls
          const allTeams = Array.from(teams.values());
          const teamsToRefresh = allTeams.filter(team => {
            const teamKey = `${team.team.id}-${team.league.id}`;
            return teamKey !== activeTeamKey;
          });

          // Refresh non-active teams in background
          if (teamsToRefresh.length > 0) {
            const refreshPromises = teamsToRefresh.map(team =>
              contextsRef.current.teamContext.refreshTeamSummary(team.team.id, team.league.id)
            );
            Promise.all(refreshPromises).catch(error => {
              console.warn('Background team summary refresh failed:', error);
            });
          }
        } else {
          setTeamsListHydrated(true);
        }

        // Step 3: Handle active team separately to avoid duplicate calls
        const { activeTeam } = contextsRef.current.configContext;
        if (activeTeam) {
          const teamKey = `${activeTeam.teamId}-${activeTeam.leagueId}`;
          const existingTeam = contextsRef.current.teamContext.teams.get(teamKey);

          if (!existingTeam) {
            // Add the team with full data processing (includes matches and players)
            await contextsRef.current.teamContext.addTeam(activeTeam.teamId, activeTeam.leagueId);
          } else {
            await contextsRef.current.teamContext.refreshTeam(activeTeam.teamId, activeTeam.leagueId);
          }
          setActiveTeamHydrated(true);
        } else {
          setActiveTeamHydrated(true);
        }

        hasHydratedRef.current = true;
        setIsHydrating(false);
      } catch (error) {
        console.error('Hydration: failed:', error);
        setIsHydrating(false);
        setHydrationError(error instanceof Error ? error.message : 'Hydration failed');
      }
    };

    hydrate();
  }, []); // Empty dependency array to run only once

  return {
    isHydrating,
    teamsListHydrated,
    constantsHydrated,
    activeTeamHydrated,
    hydrationError
  };
} 