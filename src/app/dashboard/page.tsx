import { PageHeader } from '@/components/ui/page-header';
import { DashboardPageContainer } from '@/frontend/teams/components/containers/DashboardPageContainer';

export default function DashboardPageRoute() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Monitor your tracked teams, view performance statistics, and manage your Dota 2 data analysis."
      />
      <DashboardPageContainer />
    </>
  );
}
