import { useConfigContext } from '@/frontend/contexts/config-context';

export type MatchListViewMode = 'list' | 'card';
export type PreferredMatchlistView = 'list' | 'card';

export default function useViewMode(defaultMode: MatchListViewMode = 'list') {
  const { config, updateConfig } = useConfigContext();
  const viewMode: MatchListViewMode = (config.preferredMatchlistView as MatchListViewMode) || defaultMode;

  function setViewMode(newMode: MatchListViewMode) {
    updateConfig({ preferredMatchlistView: newMode });
  }

  return { viewMode, setViewMode };
}
