"use client";
import { useMatchData } from "@/lib/hooks/useMatchData";
import type { Team } from "@/types/team";
import type { Match } from "./match-utils";

import MatchDetails from "./MatchDetails";
import MatchDetailsSkeleton from "./MatchDetailsSkeleton";

interface ClientAsyncMatchDetailsProps {
  selectedMatchObj: Match | null;
  currentTeam: Team;
  error?: string | null;
  isLoading?: boolean;
  onShowPlayerPopup?: (player: unknown) => void;
}

function NoMatchSelected() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <div className="mb-4">
          <svg className="w-12 h-12 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">No match selected</h3>
        <p className="text-sm">Select a match from the list to view details.</p>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="p-4 text-red-500">{message}</div>;
}

export default function ClientAsyncMatchDetails({
  selectedMatchObj,
  currentTeam,
  error = null,
  isLoading = false,
  onShowPlayerPopup,
}: ClientAsyncMatchDetailsProps) {
  const { data: processedMatch, loading, error: fetchError } = useMatchData(
    selectedMatchObj?.id || null
  );
  const handleShowPlayerPopup = onShowPlayerPopup ?? (() => {});

  if (!selectedMatchObj || !currentTeam) {
    return <NoMatchSelected />;
  }
  if (loading || isLoading) return <MatchDetailsSkeleton />;
  if (fetchError || error) return <ErrorMessage message={fetchError || error || 'Unknown error'} />;
  if (!processedMatch) return <MatchDetailsSkeleton />;

  const matchForDetails = {
    id: processedMatch.id,
    date: processedMatch.date,
    result: processedMatch.result,
    openDota: undefined
  };

  return (
    <MatchDetails
      match={matchForDetails}
      currentTeam={currentTeam}
      isLoading={isLoading}
      error={error}
      onShowPlayerPopup={handleShowPlayerPopup}
    />
  );
} 