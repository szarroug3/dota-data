import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useMatchHistoryState(selectedMatchId?: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Hero dropdown state (unused for now)
  const [_heroList, _setHeroList] = useState<unknown[]>([]);
  const [_heroSearch, _setHeroSearch] = useState("");
  const [_selectedHeroes, _setSelectedHeroes] = useState<string[]>([]);
  const [_showHeroDropdown, _setShowHeroDropdown] = useState(false);

  // Other filters (unused for now)
  const [_resultFilter, _setResultFilter] = useState(''); // 'W' | 'L' | ''
  const [_sideFilter, _setSideFilter] = useState(''); // 'radiant' | 'dire' | ''
  const [_pickFilter, _setPickFilter] = useState(''); // 'fp' | 'sp' | ''

  // State for selected match and player popup
  const [selectedMatch, setSelectedMatch] = useState<string | null>(selectedMatchId || null);
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<unknown>(null);
  const [playerData, setPlayerData] = useState<unknown>(null);
  const [_loadingPlayerData, _setLoadingPlayerData] = useState(false);

  // Fetch hero data from /heroes.json
  useEffect(() => {
    fetch("/heroes.json")
      .then((res) => res.json())
      .then((data) => {
        _setHeroList(Object.values(data));
      });
  }, []);

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
    router.replace(`?${params.toString()}`);
  };

  return {
    selectedMatch,
    showPlayerPopup,
    setShowPlayerPopup,
    selectedPlayer,
    setSelectedPlayer,
    playerData,
    setPlayerData,
    _loadingPlayerData,
    _selectedHeroes,
    _resultFilter,
    _sideFilter,
    _pickFilter,
    handleSelectMatch
  };
} 