"use client";
import type { Team } from "@/types/team";
import { useEffect, useState } from "react";
import MatchDetails from "./MatchDetails";
import MatchDetailsSkeleton from "./MatchDetailsSkeleton";

interface ClientAsyncMatchDetailsProps {
  selectedMatchObj: any;
  currentTeam: Team;
  error?: string | null;
  isLoading?: boolean;
  onShowPlayerPopup?: (player: any) => void;
}

export default function ClientAsyncMatchDetails({
  selectedMatchObj,
  currentTeam,
  error = null,
  isLoading = false,
  onShowPlayerPopup,
}: ClientAsyncMatchDetailsProps) {
  const [enrichedMatch, setEnrichedMatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMatchObj || !currentTeam) {
      setEnrichedMatch(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    fetch(`/api/matches/${selectedMatchObj.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: currentTeam }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setEnrichedMatch(data);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message || "Failed to load match details");
        setLoading(false);
      });
  }, [selectedMatchObj, currentTeam]);

  const handleShowPlayerPopup = onShowPlayerPopup ?? (() => {});

  if (!selectedMatchObj || !currentTeam) return null;
  if (loading || isLoading) return <MatchDetailsSkeleton />;
  if (fetchError || error) return <div className="p-4 text-red-500">{fetchError || error}</div>;
  if (!enrichedMatch || !enrichedMatch.openDota) return <MatchDetailsSkeleton />;

  return (
    <MatchDetails
      selectedMatchObj={enrichedMatch}
      currentTeam={currentTeam}
      error={error}
      isLoading={isLoading}
      onShowPlayerPopup={handleShowPlayerPopup}
    />
  );
} 