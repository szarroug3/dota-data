import { PageHeader } from '@/components/ui/page-header';
import { PlayerStatsPageContainer } from '@/frontend/players/components/containers/PlayerStatsPageContainer';

export default function PlayerStatsPageRoute() {
  return (
    <>
      <PageHeader
        title="Player Stats"
        description="View detailed player statistics, performance metrics, and individual player analysis across different teams and leagues."
      />
      <PlayerStatsPageContainer />
    </>
  );
} 