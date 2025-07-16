import { TeamAnalysisPage } from '@/components/team-analysis/TeamAnalysisPage';
import { PageHeader } from '@/components/ui/page-header';

export default function TeamAnalysisPageRoute() {
  return (
    <>
      <PageHeader
        title="Team Analysis"
        description="Analyze team performance, statistics, and trends to gain insights into their strengths and weaknesses."
      />
      <TeamAnalysisPage />
    </>
  );
} 