"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/contexts/team-context";
import { useBatchMatchDetails } from '@/lib/hooks/useDataFetching';
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ClientAsyncMatchDetails from './ClientAsyncMatchDetails';
import HeroStatsTables from "./HeroStatsTables";
import MatchHistorySummary from "./MatchHistorySummary";
import MatchList from "./MatchList";
import MatchListSkeleton from "./MatchListSkeleton";

// Utility function to extract league name from Dotabuff league URL
function getLeagueNameFromUrl(url: string): string {
  if (!url) return "";
  // Example: https://www.dotabuff.com/esports/leagues/16435-rd2l-season-33
  const match = url.match(/leagues\/(\d+)-([a-z0-9-]+)/i);
  if (match && match[2]) {
    // Replace dashes with spaces and capitalize
    return match[2].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return url;
}

// Utility to get initial filter/sort state from localStorage
function getInitialHeroStatsFilters() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("heroStatsFilters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
      }
    }
  }
  return {};
}

// Basic hero stats calculation from matches
function calculateHeroStats(matches: any[]) {
  const stats = {
    ourPicks: {} as Record<string, { games: number; wins: number; winRate: number }> ,
    ourBans: {} as Record<string, { games: number; winRate: number }> ,
    opponentPicks: {} as Record<string, { games: number; wins: number; winRate: number }> ,
    opponentBans: {} as Record<string, { games: number; winRate: number }> ,
  };
  for (const match of matches) {
    if (!match.picks_bans) continue;
    for (const pb of match.picks_bans) {
      const heroId = pb.hero_id;
      if (pb.is_pick) {
        if (pb.team === 0) {
          // Our pick
          if (!stats.ourPicks[heroId]) stats.ourPicks[heroId] = { games: 0, wins: 0, winRate: 0 };
          stats.ourPicks[heroId].games += 1;
          if (match.result === 'W') stats.ourPicks[heroId].wins += 1;
        } else {
          // Opponent pick
          if (!stats.opponentPicks[heroId]) stats.opponentPicks[heroId] = { games: 0, wins: 0, winRate: 0 };
          stats.opponentPicks[heroId].games += 1;
          if (match.result === 'L') stats.opponentPicks[heroId].wins += 1;
        }
      } else {
        if (pb.team === 0) {
          // Our ban
          if (!stats.ourBans[heroId]) stats.ourBans[heroId] = { games: 0, winRate: 0 };
          stats.ourBans[heroId].games += 1;
        } else {
          // Opponent ban
          if (!stats.opponentBans[heroId]) stats.opponentBans[heroId] = { games: 0, winRate: 0 };
          stats.opponentBans[heroId].games += 1;
        }
      }
    }
  }
  // Calculate winRate for ourPicks and opponentPicks
  for (const heroId in stats.ourPicks) {
    const h = stats.ourPicks[heroId];
    h.winRate = h.games > 0 ? Math.round((h.wins / h.games) * 100) : 0;
  }
  for (const heroId in stats.opponentPicks) {
    const h = stats.opponentPicks[heroId];
    h.winRate = h.games > 0 ? Math.round((h.wins / h.games) * 100) : 0;
  }
  // Ensure winRate is always defined for bans
  for (const heroId in stats.ourBans) {
    const h = stats.ourBans[heroId];
    h.winRate = 0;
  }
  for (const heroId in stats.opponentBans) {
    const h = stats.opponentBans[heroId];
    h.winRate = 0;
  }
  return stats;
}

export default function ClientMatchHistoryPage({ selectedMatchId }: { selectedMatchId?: string | null }) {
  const { currentTeam, isLoaded } = useTeam();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Debug logging
  console.log('[MatchHistory] Current team:', currentTeam);
  console.log('[MatchHistory] Team ID:', currentTeam?.id);
  console.log('[MatchHistory] Team matchIdsByLeague:', (currentTeam as any)?.matchIdsByLeague);
  
  // Use the team context's existing matches instead of fetching by player account IDs
  const { matches: teamMatches, allMatches } = useTeam();
  
  console.log('[MatchHistory] Team matches from context:', {
    matchesCount: teamMatches.length,
    allMatchesCount: allMatches.length,
    matches: teamMatches.slice(0, 5) // Show first 5 for debugging
  });
  
  // Determine which matches to use
  let matches: any[] = [];
  let loadingMatches = false;

  const teamWithMatches = currentTeam as any; // Type assertion to access matchIdsByLeague
  let matchIds: string[] = [];
  if (teamMatches.length === 0 && teamWithMatches?.matchIdsByLeague) {
    matchIds = teamWithMatches.matchIdsByLeague[currentTeam?.leagueId || ''] || [];
  }
  // Always call the hook
  const { matches: batchMatches, loading } = useBatchMatchDetails(matchIds);

  if (teamMatches.length === 0 && matchIds.length > 0) {
    matches = batchMatches;
    loadingMatches = loading;
  } else {
    matches = teamMatches;
    loadingMatches = false;
  }
  
  console.log('[MatchHistory] Extracted matches:', {
    matchesCount: matches.length,
    matches: matches.slice(0, 3) // Show first 3 matches for debugging
  });

  // Ensure each match has an 'id' property for the UI
  matches = matches.map(m => ({ ...m, id: m.match_id ?? m.id }));

  // Debug: log the matches array before rendering
  console.log('[MatchHistory] Final matches for rendering:', matches);

  // Hero dropdown state
  const [heroList, setHeroList] = useState<any[]>([]);
  const [heroSearch, setHeroSearch] = useState("");
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]);
  const [showHeroDropdown, setShowHeroDropdown] = useState(false);

  // Other filters
  const [resultFilter, setResultFilter] = useState(''); // 'W' | 'L' | ''
  const [sideFilter, setSideFilter] = useState(''); // 'radiant' | 'dire' | ''
  const [pickFilter, setPickFilter] = useState(''); // 'fp' | 'sp' | ''

  // State for selected match and player popup
  const [selectedMatch, setSelectedMatch] = useState<string | null>(selectedMatchId || null);
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);

  const heroStats: {
    ourPicks: Record<string, { games: number; wins: number; winRate: number } & Record<string, any>>;
    ourBans: Record<string, { games: number; winRate: number } & Record<string, any>>;
    opponentPicks: Record<string, { games: number; wins: number; winRate: number } & Record<string, any>>;
    opponentBans: Record<string, { games: number; winRate: number } & Record<string, any>>;
  } = calculateHeroStats(matches);

  // Real highlight logic for hero stats
  function getHighlightStyle(hero: string, type: string) {
    const heroKey = String(hero);
    let stats: { games: number; winRate: number } | undefined;
    if (type === "pick") stats = heroStats.ourPicks[heroKey];
    else if (type === "ban") stats = heroStats.ourBans[heroKey];
    else if (type === "opponentPick") stats = heroStats.opponentPicks[heroKey];
    else if (type === "opponentBan") stats = heroStats.opponentBans[heroKey];
    if (!stats) return "";
    if ((stats.games >= 8 && stats.winRate >= 70) || (stats.games >= 5 && stats.winRate >= 80)) {
      return "bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-l-yellow-500";
    }
    return "";
  }

  // Fetch hero data from /heroes.json
  useEffect(() => {
    fetch("/heroes.json")
      .then((res) => res.json())
      .then((data) => {
        setHeroList(Object.values(data));
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

  // Filtering logic
  const filteredMatches = matches.filter((m: any) => {
    // Hero filter: check if any selected hero is in picks_bans
    if (selectedHeroes.length > 0) {
      if (!m.picks_bans || !selectedHeroes.some(heroId => m.picks_bans.some((pb: any) => pb.hero_id.toString() === heroId))) return false;
    }
    // Result filter
    if (resultFilter && m.result !== resultFilter) return false;
    // Side filter
    if (sideFilter) {
      if (sideFilter === 'radiant' && !m.openDota?.isRadiant) return false;
      if (sideFilter === 'dire' && m.openDota?.isRadiant) return false;
    }
    // Pick filter
    if (pickFilter) {
      if (pickFilter === 'fp' && m.firstPick !== true) return false;
      if (pickFilter === 'sp' && m.firstPick === true) return false;
    }
    return true;
  });

  // Find the selected match object
  const selectedMatchObj = matches.find((m: any) => m.id === selectedMatch) || null;

  // Placeholder summary and trends (replace with real calculations as needed)
  const summary = {
    totalMatches: matches.length,
    wins: matches.filter((m: any) => m.result === "W").length,
    losses: matches.filter((m: any) => m.result === "L").length,
    winRate: matches.length ? Math.round((matches.filter((m: any) => m.result === "W").length / matches.length) * 100) : 0,
    avgGameLength: "--",
    currentStreak: 0,
  };
  const trends: any[] = [];

  // --- Match List/Details Height with LocalStorage ---
  const DEFAULT_GRID_HEIGHT = 600;
  const [gridHeight, setGridHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('matchHistoryGridHeight');
      if (saved && !isNaN(Number(saved))) return Number(saved);
    }
    return DEFAULT_GRID_HEIGHT;
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const [hasCachedHeight, setHasCachedHeight] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('matchHistoryGridHeight');
    }
    return false;
  });

  // When a match is selected for the first time, cache the grid height
  useEffect(() => {
    if (!hasCachedHeight && selectedMatch && gridRef.current) {
      const measured = gridRef.current.offsetHeight;
      if (measured > 0) {
        setGridHeight(measured);
        localStorage.setItem('matchHistoryGridHeight', String(measured));
        setHasCachedHeight(true);
      }
    }
  }, [selectedMatch, hasCachedHeight]);

  if (!isLoaded) {
    // Show loading skeleton while context is initializing
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!currentTeam) {
    return <div className="p-8 text-center text-muted-foreground">No team selected. Please select or import a team.</div>;
  }

  if (loadingMatches) {
    return <div className="p-8 text-center text-muted-foreground">Loading match details...</div>;
  }

  // --- Step 1: Layout & Filters Bar ---
  return (
    <div className="w-full h-full grid grid-rows-[auto,1fr,auto,auto] min-h-0 flex-1 space-y-6">
      {/* Row 1: Page header and filters */}
      <div className="flex flex-col gap-1 p-0">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Match History</h1>
        </div>
        <div className="text-muted-foreground text-sm mb-4">
          View and analyze your team's match history.
        </div>
        <div className="w-full">
          <div className="p-4 border rounded-lg flex flex-wrap gap-2 items-center relative bg-card">
            {/* Hero multi-select dropdown */}
            <div>
              <button onClick={() => setShowHeroDropdown((v) => !v)} className="border rounded px-2 py-1 bg-muted/30">
                {selectedHeroes.length > 0 ? `${selectedHeroes.length} hero${selectedHeroes.length > 1 ? 'es' : ''} selected` : 'Filter heroes...'}
              </button>
              {showHeroDropdown && (
                <div className="absolute z-10 bg-card border rounded shadow-lg p-2 w-64 max-h-80 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search heroes..."
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    className="w-full mb-2 px-2 py-1 border rounded"
                  />
                  <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                    {heroList
                      .filter((hero) =>
                        hero.localized_name.toLowerCase().includes(heroSearch.toLowerCase())
                      )
                      .map((hero) => (
                        <label key={hero.id} className="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-muted/20 rounded">
                          <input
                            type="checkbox"
                            checked={selectedHeroes.includes(hero.localized_name)}
                            onChange={() => {
                              setSelectedHeroes((prev) =>
                                prev.includes(hero.localized_name)
                                  ? prev.filter((h) => h !== hero.localized_name)
                                  : [...prev, hero.localized_name]
                              );
                            }}
                          />
                          {hero.localized_name}
                        </label>
                      ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setShowHeroDropdown(false)} className="flex-1 border rounded px-2 py-1 bg-primary text-white">Done</button>
                    <button onClick={() => setSelectedHeroes([])} className="flex-1 border rounded px-2 py-1">Clear</button>
                  </div>
                </div>
              )}
            </div>
            {/* Other filters */}
            <select
              className="px-2 py-1 rounded border bg-background text-sm"
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value)}
            >
              <option value="">All Results</option>
              <option value="W">Win</option>
              <option value="L">Loss</option>
            </select>
            <select
              className="px-2 py-1 rounded border bg-background text-sm"
              value={sideFilter}
              onChange={e => setSideFilter(e.target.value)}
            >
              <option value="">All Sides</option>
              <option value="radiant">Radiant</option>
              <option value="dire">Dire</option>
            </select>
            <select
              className="px-2 py-1 rounded border bg-background text-sm"
              value={pickFilter}
              onChange={e => setPickFilter(e.target.value)}
            >
              <option value="">All Picks</option>
              <option value="fp">First Pick</option>
              <option value="sp">Second Pick</option>
            </select>
            <button
              className="ml-auto px-2 py-1 rounded border bg-background text-xs"
              onClick={() => {
                setSelectedHeroes([]);
                setHeroSearch('');
                setResultFilter('');
                setSideFilter('');
                setPickFilter('');
              }}
            >Clear Filters</button>
          </div>
        </div>
      </div>
      {/* Row 2: Main grid (match list, match details) */}
      <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 w-full min-h-0" style={{ height: gridHeight }}>
        {/* Left column: match list, scrollable */}
        <Card className="flex flex-col min-h-0" style={{ height: gridHeight }}>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0 h-full">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <Suspense fallback={<MatchListSkeleton />}>
                <MatchList
                  matches={filteredMatches}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={handleSelectMatch}
                  selectedMatchObj={selectedMatchObj}
                  currentTeam={currentTeam}
                  showPlayerPopup={showPlayerPopup}
                  setShowPlayerPopup={setShowPlayerPopup}
                  selectedPlayer={selectedPlayer}
                  setSelectedPlayer={setSelectedPlayer}
                  playerData={playerData}
                  setPlayerData={setPlayerData}
                  loadingPlayerData={loadingPlayerData}
                />
              </Suspense>
            </div>
          </CardContent>
        </Card>
        {/* Right column: match details, not scrollable, expands to fit content */}
        <Card className="flex flex-col min-h-0" style={{ height: gridHeight }}>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0 h-full">
            <ClientAsyncMatchDetails selectedMatchObj={selectedMatchObj} currentTeam={currentTeam} />
          </CardContent>
        </Card>
      </div>
      {/* Row 3: Summary (auto height) */}
      <div className="max-w-full">
        <Card className="h-fit mb-0">
          <CardContent className="p-6">
            <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading summary...</div>}>
              <MatchHistorySummary summary={summary} trends={trends} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      {/* Row 4: Hero statistics (auto height) */}
      <div className="max-w-full">
        <Card className="h-fit mt-0">
          <CardContent className="p-6 overflow-x-auto">
            <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading hero stats...</div>}>
              <HeroStatsTables heroStats={heroStats} currentTeam={currentTeam} getHighlightStyle={getHighlightStyle} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 