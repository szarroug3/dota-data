import { useCallback, useState } from 'react';

import { MatchListViewMode } from '@/components/match-history/list/MatchListView';
import { useConfigContext } from '@/contexts/config-context';

const useViewMode = () => {
  const { config, updateConfig } = useConfigContext();
  const [viewMode, setViewMode] = useState<MatchListViewMode>(config.preferredMatchlistView);

  const handleViewModeChange = useCallback((mode: MatchListViewMode) => {
    setViewMode(mode);
    updateConfig({
      preferredMatchlistView: mode
    }).catch(error => {
      console.error('Failed to save view mode preference:', error);
    });
  }, [updateConfig]);

  return {
    viewMode,
    setViewMode: handleViewModeChange
  };
};

export default useViewMode; 