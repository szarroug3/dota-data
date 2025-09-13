import { PageHeader } from '@/components/ui/page-header';
import { MatchHistoryPageContainer } from '@/frontend/matches/components/containers/MatchHistoryPageContainer';

export default function MatchHistoryPageRoute() {
  return (
    <>
      <PageHeader
        title="Match History"
        description="Browse through match history, results, and detailed game statistics for tracked teams and players."
      />
      <MatchHistoryPageContainer />
    </>
  );
} 