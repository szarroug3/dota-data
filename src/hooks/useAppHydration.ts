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

        // Step 2: Load teams from config
        const teams = contextsRef.current.configContext.getTeams();
        if (teams && teams.size > 0) {
          // Delegate to team context to handle loading teams from config
          await contextsRef.current.teamContext.loadTeamsFromConfig(teams);

          // Refresh all team summaries in background
          // This will handle summary data for non-active teams and full data for active team
          contextsRef.current.teamContext.refreshAllTeamSummaries().catch(error => {
            console.warn('Background team refresh failed:', error);
          });
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
    hydrationError
  };
} 