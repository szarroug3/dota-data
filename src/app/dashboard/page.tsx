import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardPageRoute() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Monitor your tracked teams, view performance statistics, and manage your Dota 2 data analysis."
      />
      <DashboardPage />
    </>
  );
} 