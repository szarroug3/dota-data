import { PlayerStatsPage } from '@/components/player-stats/PlayerStatsPage';
import { PageHeader } from '@/components/ui/page-header';

export default function PlayerStatsPageRoute() {
  return (
    <>
      <PageHeader
        title="Player Stats"
        description="View detailed player statistics, performance metrics, and individual player analysis across different teams and leagues."
      />
      <PlayerStatsPage />
    </>
  );
} 