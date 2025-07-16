import { MatchHistoryPage } from '@/components/match-history/MatchHistoryPage';
import { PageHeader } from '@/components/ui/page-header';

export default function MatchHistoryPageRoute() {
  return (
    <>
      <PageHeader
        title="Match History"
        description="Browse through match history, results, and detailed game statistics for tracked teams and players."
      />
      <MatchHistoryPage />
    </>
  );
} 