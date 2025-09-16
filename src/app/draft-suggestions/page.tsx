// Temporarily disable Draft Suggestions page import per plan
// import { DraftSuggestionsPage } from '@/components/draft-suggestions/DraftSuggestionsPage';
import { PageHeader } from '@/components/ui/page-header';

export default function DraftSuggestionsPageRoute() {
  return (
    <>
      <PageHeader
        title="Draft Suggestions"
        description="Get AI-powered draft recommendations based on team analysis, hero synergies, and current meta trends."
      />
      {null}
    </>
  );
}
