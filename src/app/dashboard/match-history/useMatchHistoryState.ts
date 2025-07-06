import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useMatchHistoryState(selectedMatchId?: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for selected match and player popup
  const [selectedMatch, setSelectedMatch] = useState<string | null>(selectedMatchId || null);
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<unknown>(null);
  const [playerData, setPlayerData] = useState<unknown>(null);

  // Sync selectedMatch with prop
  useEffect(() => {
    if (selectedMatchId && selectedMatchId !== selectedMatch) {
      setSelectedMatch(selectedMatchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId]);

  // When selecting a match, update the URL
  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("match", matchId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return {
    selectedMatch,
    showPlayerPopup,
    setShowPlayerPopup,
    selectedPlayer,
    setSelectedPlayer,
    playerData,
    setPlayerData,
    handleSelectMatch
  };
} 