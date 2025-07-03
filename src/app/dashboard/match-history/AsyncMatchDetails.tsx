import { enrichMatchWithOpenDota } from '@/lib/match-enrichment';
import type { Team } from '@/types/team';
import MatchDetails from './MatchDetails';
import MatchDetailsSkeleton from './MatchDetailsSkeleton';

interface AsyncMatchDetailsProps {
  selectedMatchObj: any;
  currentTeam: Team;
  error?: string | null;
  isLoading?: boolean;
  onShowPlayerPopup?: (player: any) => void;
}

// Server component for Suspense
export default async function AsyncMatchDetails({ selectedMatchObj, currentTeam, error = null, isLoading = false, onShowPlayerPopup }: AsyncMatchDetailsProps) {
  if (!selectedMatchObj || !currentTeam) return null;

  // Provide a default no-op function if onShowPlayerPopup is not provided
  const handleShowPlayerPopup = onShowPlayerPopup ?? (() => {});

  // Fetch enriched match data on the server
  const enrichedMatch = await enrichMatchWithOpenDota(selectedMatchObj.id, currentTeam);

  // If data is missing or incomplete, show skeleton
  if (!enrichedMatch || !enrichedMatch.openDota) {
    return <MatchDetailsSkeleton />;
  }

  return <MatchDetails selectedMatchObj={enrichedMatch} currentTeam={currentTeam} error={error} isLoading={isLoading} onShowPlayerPopup={handleShowPlayerPopup} />;
} 