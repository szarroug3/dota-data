import { useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useConstantsContext } from '@/frontend/contexts/constants-context';
import { useMatchContext } from '@/frontend/matches/contexts/state/match-context';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';

/**
 * Hook for app-wide data hydration
 */
export function useAppHydration() {
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasHydratedRef = useRef(false);

  const configContext = useConfigContext();
  const constantsContext = useConstantsContext();
  const teamContext = useTeamContext();
  const matchContext = useMatchContext();

  // Store context references in refs to avoid recreation
  const contextsRef = useRef({ configContext, constantsContext, teamContext, matchContext });
  contextsRef.current = { configContext, constantsContext, teamContext, matchContext };

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
          contextsRef.current.constantsContext.fetchItems(),
        ]);

        // Step 2: Wait for constants to be available in context state
        // React state updates are asynchronous, so we need to wait for the context to reflect the fetched data
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        while (
          attempts < maxAttempts &&
          (Object.keys(contextsRef.current.constantsContext.heroes).length === 0 ||
            Object.keys(contextsRef.current.constantsContext.items).length === 0)
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.warn('Constants not available after waiting, proceeding anyway');
        }

        // Step 3: Load teams from config
        const teams = contextsRef.current.configContext.getTeams();
        if (teams && teams.size > 0) {
          // Delegate to team context to handle loading teams from config
          await contextsRef.current.teamContext.loadTeamsFromConfig(teams);

          // Step 4: Load manual matches and players after normal team loading
          await contextsRef.current.teamContext.loadManualMatches();
          await contextsRef.current.teamContext.loadManualPlayers();

          // Refresh all team summaries in background
          // This will handle summary data for non-active teams and full data for active team
          contextsRef.current.teamContext.refreshAllTeamSummaries().catch((error) => {
            console.warn('Background team refresh failed:', error);
          });
        }

        hasHydratedRef.current = true;
        setHasHydrated(true);
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
    hydrationError,
    hasHydrated,
  };
}
