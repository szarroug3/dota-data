import { TeamManagementPage } from '@/components/team-management/TeamManagementPage';
import { PageHeader } from '@/components/ui/page-header';

export default function TeamManagementPageRoute() {
  return (
    <>
      <PageHeader
        title="Team Management"
        description="Manage your tracked teams and add new ones to monitor their performance and statistics."
      />
      <TeamManagementPage />
    </>
  );
} 