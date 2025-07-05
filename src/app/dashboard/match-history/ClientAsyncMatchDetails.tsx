"use client";
import { useMatchData } from "@/lib/hooks/useMatchData";
import type { Team } from "@/types/team";
import type { Match } from "./match-utils";
import MatchDetails from "./MatchDetails";
import MatchDetailsSkeleton from "./MatchDetailsSkeleton";

interface ClientAsyncMatchDetailsProps {
  selectedMatchObj: Match;
  currentTeam: Team;
  error?: string | null;
  isLoading?: boolean;
  onShowPlayerPopup?: (player: unknown) => void;
}

export default function ClientAsyncMatchDetails({
  selectedMatchObj,
  currentTeam,
  error = null,
  isLoading = false,
  onShowPlayerPopup,
}: ClientAsyncMatchDetailsProps) {
  // Use the new processed match data hook
  const { data: processedMatch, loading, error: fetchError } = useMatchData(
    selectedMatchObj?.id || null
  );

  const handleShowPlayerPopup = onShowPlayerPopup ?? (() => {});

  if (!selectedMatchObj || !currentTeam) return null;
  if (loading || isLoading) return <MatchDetailsSkeleton />;
  if (fetchError || error) return <div className="p-4 text-red-500">{fetchError || error}</div>;
  if (!processedMatch || !processedMatch.openDota) return <MatchDetailsSkeleton />;

  return (
    <MatchDetails
      selectedMatchObj={processedMatch}
      currentTeam={currentTeam}
      error={error}
      isLoading={isLoading}
      onShowPlayerPopup={handleShowPlayerPopup}
    />
  );
} 