import { enrichMatchWithOpenDota } from '@/lib/match-enrichment';
import { convertTeamMatchToDashboardMatch } from '@/lib/utils/match-type-conversion';
import type { Team } from '@/types/team';
import type { Match } from './match-utils';
import type { OpenDotaFullMatch } from '@/types/opendota';
import MatchDetails from './MatchDetails';

interface AsyncMatchDetailsProps {
  selectedMatchObj: Match;
  currentTeam: Team;
  error: string | null;
  isLoading: boolean;
  onShowPlayerPopup: (player: OpenDotaFullMatch['players'][0]) => void;
}

// Server component for Suspense
export default async function AsyncMatchDetails({
  selectedMatchObj,
  currentTeam,
  error,
  isLoading,
  onShowPlayerPopup
}: AsyncMatchDetailsProps) {
  if (!selectedMatchObj?.id) {
    return <div>No match selected</div>;
  }

  const enrichedTeamMatch = await enrichMatchWithOpenDota(selectedMatchObj.id, currentTeam);
  const enrichedMatch = convertTeamMatchToDashboardMatch(enrichedTeamMatch);
  
  if (isLoading) {
    return <div>Loading match details...</div>;
  }

  return <MatchDetails match={enrichedMatch} currentTeam={currentTeam} error={error} isLoading={isLoading} onShowPlayerPopup={onShowPlayerPopup} />;
} 