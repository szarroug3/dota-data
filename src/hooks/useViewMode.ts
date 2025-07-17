import { useCallback, useState } from 'react';

import { MatchListViewMode } from '@/components/match-history/list/MatchListView';
import { useConfigContext } from '@/contexts/config-context';

const useViewMode = () => {
  const { preferences, updatePreferences } = useConfigContext();
  const [viewMode, setViewMode] = useState<MatchListViewMode>(preferences.matchHistory.defaultView);

  const handleViewModeChange = useCallback((mode: MatchListViewMode) => {
    setViewMode(mode);
    updatePreferences({
      matchHistory: {
        ...preferences.matchHistory,
        defaultView: mode
      }
    }).catch(error => {
      console.error('Failed to save view mode preference:', error);
    });
  }, [preferences.matchHistory, updatePreferences]);

  return {
    viewMode,
    setViewMode: handleViewModeChange
  };
};

export default useViewMode; 