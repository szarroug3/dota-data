"use client";
import AddMatch from "@/components/dashboard/AddMatch";
import ErrorCard from "@/components/dashboard/ErrorCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useDataFetching } from "@/contexts/data-fetching-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTeam } from "@/contexts/team-context";
import { getQueueStatsFromAPI } from "@/lib/api";
import { useMatchHistory } from "@/lib/hooks/useDataFetching";
import { getHeroNameSync, getMatchResult, logWithTimestamp } from "@/lib/utils";
import { Eye, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import HeroStatsTables from "./HeroStatsTables";
import HiddenMatchesPopup from "./HiddenMatchesPopup";
import MatchDetails from "./MatchDetails";
import MatchHistorySummary from "./MatchHistorySummary";
import MatchList from "./MatchList";
import MatchHistoryLoading from "./loading";

// Utility function to extract league name from Dotabuff league URL
function getLeagueNameFromUrl(url: string): string {
  if (!url) return "";
  // Example: https://www.dotabuff.com/esports/leagues/16435-rd2l-season-33
  const match = url.match(/leagues\/\d+-([a-z0-9-]+)/i);
  if (match && match[1]) {
    // Replace dashes with spaces and capitalize
    return match[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

export default function MatchHistoryPage() {
  logWithTimestamp('log', '[MatchHistory] Component rendering');
  
  const { currentTeam, refreshingTeamId, refreshProgress, cancelRefresh, clearMatches, matches, allMatches, hiddenMatchIds, unhideMatch, removeMatch, isLoaded, refreshingMatches, setRefreshingMatches } =
    useTeam();
  const { isFetching } = useDataFetching();
  const { preferredSite } = useSidebar();
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [filterResult, setFilterResult] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [sideFilter, setSideFilter] = useState<'all' | 'radiant' | 'dire'>('all');
  const [pickOrderFilter, setPickOrderFilter] = useState<'all' | 'fp' | 'sp'>('all');
  const [queueStats, setQueueStats] = useState<Record<string, { length: number; processing: boolean }>>({});
  const [matchDetailsHeight, setMatchDetailsHeight] = useState<number | null>(null);
  const [lastNonEmptyMatchDetailsHeight, setLastNonEmptyMatchDetailsHeight] = useState<number | null>(null);
  const matchDetailsRef = useRef<HTMLDivElement>(null);

  // Add player popup state and logic
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  const [prefetchedPlayerData, setPrefetchedPlayerData] = useState<Map<number, any>>(new Map());
  const [prefetchingPlayers, setPrefetchingPlayers] = useState<Set<number>>(new Set());

  const accountIds =
    currentTeam?.players?.map((player) => player.id).filter(Boolean) || null;
  const { data: matchHistory, loading, error } = useMatchHistory(accountIds);

  // Calculate hero statistics across all matches
  const selectedMatchObj = allMatches.find(
    (match) => match.id === selectedMatch,
  );

  // Add comprehensive logging for debugging
  logWithTimestamp('log', "[MATCH HISTORY] ===== MATCH HISTORY PAGE RENDER =====");
  logWithTimestamp('log', "[MATCH HISTORY] Current team:", currentTeam);
  logWithTimestamp('log', "[MATCH HISTORY] Current team name:", currentTeam?.name);
  logWithTimestamp('log', "[MATCH HISTORY] Current team ID:", currentTeam?.id);
  logWithTimestamp('log', "[MATCH HISTORY] Current team manualMatches:", currentTeam?.manualMatches);
  logWithTimestamp('log', "[MATCH HISTORY] Current team manualMatches length:", currentTeam?.manualMatches?.length);
  logWithTimestamp('log', "[MATCH HISTORY] Context matches:", matches);
  logWithTimestamp('log', "[MATCH HISTORY] Context matches length:", matches.length);
  logWithTimestamp('log', "[MATCH HISTORY] All matches (sorted):", allMatches);
  logWithTimestamp('log', "[MATCH HISTORY] All matches length:", allMatches.length);
  logWithTimestamp('log', "[MATCH HISTORY] Is loaded:", isLoaded);
  logWithTimestamp('log', "[MATCH HISTORY] Is fetching:", isFetching);
  logWithTimestamp('log', "[MATCH HISTORY] Loading:", loading);
  logWithTimestamp('log', "[MATCH HISTORY] Error:", error);
  logWithTimestamp('log', "[MATCH HISTORY] Match history data:", matchHistory);
  logWithTimestamp('log', "[MATCH HISTORY] Account IDs:", accountIds);

  useEffect(() => {
  }, [selectedMatch, selectedMatchObj]);

  // Add a ref to allow children to trigger queue stats update
  const queueStatsRef = useRef<() => void>(() => {});

  // Update queue stats periodically
  useEffect(() => {
    logWithTimestamp('log', '[MatchHistory] Queue stats useEffect started');
    const updateQueueStats = async () => {
      try {
        logWithTimestamp('log', '[MatchHistory] Fetching queue stats...');
        const stats = await getQueueStatsFromAPI();
        setQueueStats(stats.queueStats || {});
      } catch (error) {
        logWithTimestamp('error', '[MatchHistory] Error updating queue stats:', error);
      }
    };
    queueStatsRef.current = updateQueueStats;
    updateQueueStats();
    const interval = setInterval(updateQueueStats, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleShowPlayerPopup(e: Event) {
      const customEvent = e as CustomEvent;
      const { player } = customEvent.detail;
      setSelectedPlayer(player);
      setShowPlayerPopup(true);
      fetchPlayerData(player.account_id);
    }
    function handleShowPlayerStatsTab(e: Event) {
      const customEvent = e as CustomEvent;
      const { player } = customEvent.detail;
      window.location.href = `/dashboard/player-stats?player=${player.account_id}`;
    }
    window.addEventListener("showPlayerPopup", handleShowPlayerPopup);
    window.addEventListener("showPlayerStatsTab", handleShowPlayerStatsTab);
    return () => {
      window.removeEventListener("showPlayerPopup", handleShowPlayerPopup);
      window.removeEventListener("showPlayerStatsTab", handleShowPlayerStatsTab);
    };
  }, []);

  // Measure match details card height and update match list card height
  useEffect(() => {
    const updateMatchDetailsHeight = () => {
      if (matchDetailsRef.current) {
        const height = matchDetailsRef.current.offsetHeight;
        setMatchDetailsHeight(height);
        if (selectedMatch && height > 0) {
          setLastNonEmptyMatchDetailsHeight(height);
        }
      }
    };

    // Update height immediately
    updateMatchDetailsHeight();

    // Update height on window resize
    window.addEventListener('resize', updateMatchDetailsHeight);
    
    // Update height after a short delay to ensure content is rendered
    const timeoutId = setTimeout(updateMatchDetailsHeight, 100);

    return () => {
      window.removeEventListener('resize', updateMatchDetailsHeight);
      clearTimeout(timeoutId);
    };
  }, [selectedMatch, selectedMatchObj]); // Re-run when selected match changes

  // Show loading state while team context or match history is initializing
  if (!isLoaded || loading) {
    return <MatchHistoryLoading />;
  }

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Match History"
          description="No team selected. Please add a team in Team Management."
        />
        <div className="text-center text-muted-foreground">
          Select a team to view match history
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Match History"
          description="Error loading match history"
        />
        <ErrorCard title="Match History" error={error} />
      </div>
    );
  }

  if (
    !matchHistory &&
    (!currentTeam?.manualMatches || currentTeam.manualMatches.length === 0)
  ) {
    // Don't return early - let the page render with empty components
  }

  // Wrapper function to log when matches are selected
  const handleMatchSelect = (matchId: string | null) => {
    setSelectedMatch(matchId);
  };

  // Split matches into visible and hidden
  const visibleMatches = allMatches.filter((m) => !hiddenMatchIds.includes(m.id));
  const hiddenMatches = allMatches.filter((m) => hiddenMatchIds.includes(m.id));

  // Calculate hero statistics across all matches
  const heroStats = {
    ourPicks: {} as Record<
      string,
      {
        games: number;
        wins: number;
        winRate: number;
        players: Set<string> | string[];
      }
    >,
    ourBans: {} as Record<
      string,
      {
        games: number;
        bans: number;
        banRate: number;
        players: Set<string> | string[];
      }
    >,
    opponentPicks: {} as Record<
      string,
      {
        games: number;
        wins: number;
        winRate: number;
        players: Set<string> | string[];
      }
    >,
    opponentBans: {} as Record<
      string,
      {
        games: number;
        bans: number;
        banRate: number;
        wins: number;
        winRate: number;
        players: Set<string> | string[];
      }
    >,
  };

  // Process all matches for hero statistics
  allMatches.forEach((match) => {
    // Get our team's players from OpenDota data
    const ourPlayers = new Set<string>();
    const matchData = match as any;

    if (matchData.openDota && Array.isArray(matchData.openDota.players)) {
      const teamSide = getTeamSide(matchData, currentTeam);
      const isRadiant = teamSide === "Radiant";

      matchData.openDota.players.forEach((player: any) => {
        if (player.isRadiant === isRadiant) {
          ourPlayers.add(player.name);
        }
      });
    }

    // Process our picks
    if (matchData.openDota && matchData.openDota.picks_bans) {
      const teamSide = getTeamSide(matchData, currentTeam);
      const isRadiant = teamSide === "Radiant";
      // Our picks
      matchData.openDota.picks_bans.forEach((pickBan: any) => {
        if (pickBan.is_pick && pickBan.team === (isRadiant ? 0 : 1)) {
          const heroName = getHeroName(pickBan.hero_id);
          if (!heroStats.ourPicks[heroName]) {
            heroStats.ourPicks[heroName] = {
              games: 0,
              wins: 0,
              winRate: 0,
              players: new Set(),
            };
          }
          heroStats.ourPicks[heroName].games++;
          if (matchData.result === "W") {
            heroStats.ourPicks[heroName].wins++;
          }
          ourPlayers.forEach((player) =>
            (heroStats.ourPicks[heroName].players as Set<string>).add(player),
          );
        }
      });
      // Opponent picks
      matchData.openDota.picks_bans.forEach((pickBan: any) => {
        if (pickBan.is_pick && pickBan.team === (isRadiant ? 1 : 0)) {
          const heroName = getHeroName(pickBan.hero_id);
          if (!heroStats.opponentPicks[heroName]) {
            heroStats.opponentPicks[heroName] = {
              games: 0,
              wins: 0,
              winRate: 0,
              players: new Set(),
            };
          }
          heroStats.opponentPicks[heroName].games++;
          if (matchData.result === "W") {
            heroStats.opponentPicks[heroName].wins++;
          }
          // Add opponent player names if available
          if (matchData.openDota && Array.isArray(matchData.openDota.players)) {
            matchData.openDota.players.forEach((player: any) => {
              if (player.isRadiant !== isRadiant) {
                (heroStats.opponentPicks[heroName].players as Set<string>).add(
                  player.name,
                );
              }
            });
          }
        }
      });
    }

    // Process our bans
    if (matchData.openDota && matchData.openDota.picks_bans) {
      const teamSide = getTeamSide(matchData, currentTeam);
      const isRadiant = teamSide === "Radiant";
      // Our bans
      matchData.openDota.picks_bans.forEach((pickBan: any) => {
        if (!pickBan.is_pick && pickBan.team === (isRadiant ? 0 : 1)) {
          const heroName = getHeroName(pickBan.hero_id);
          if (!heroStats.ourBans[heroName]) {
            heroStats.ourBans[heroName] = {
              games: 0,
              bans: 0,
              banRate: 0,
              players: new Set(),
            };
          }
          heroStats.ourBans[heroName].games++;
          heroStats.ourBans[heroName].bans++;
          ourPlayers.forEach((player) =>
            (heroStats.ourBans[heroName].players as Set<string>).add(player),
          );
        }
      });
      // Opponent bans
      matchData.openDota.picks_bans.forEach((pickBan: any) => {
        if (!pickBan.is_pick && pickBan.team === (isRadiant ? 1 : 0)) {
          const heroName = getHeroName(pickBan.hero_id);
          if (!heroStats.opponentBans[heroName]) {
            heroStats.opponentBans[heroName] = {
              games: 0,
              bans: 0,
              banRate: 0,
              wins: 0,
              winRate: 0,
              players: new Set(),
            };
          }
          heroStats.opponentBans[heroName].games++;
          heroStats.opponentBans[heroName].bans++;
          if (matchData.result === "W") {
            heroStats.opponentBans[heroName].wins =
              (heroStats.opponentBans[heroName].wins || 0) + 1;
          }
          // Add opponent player names if available
          if (matchData.openDota && Array.isArray(matchData.openDota.players)) {
            matchData.openDota.players.forEach((player: any) => {
              if (player.isRadiant !== isRadiant) {
                (heroStats.opponentBans[heroName].players as Set<string>).add(
                  player.name,
                );
              }
            });
          }
        }
      });
    }
  });

  // Calculate win rates and ban rates
  Object.values(heroStats.ourPicks).forEach((hero) => {
    hero.winRate = hero.games > 0 ? (hero.wins / hero.games) * 100 : 0;
  });

  Object.values(heroStats.opponentPicks).forEach((hero) => {
    hero.winRate = hero.games > 0 ? (hero.wins / hero.games) * 100 : 0;
  });

  Object.values(heroStats.ourBans).forEach((hero) => {
    hero.banRate = hero.games > 0 ? (hero.bans / hero.games) * 100 : 0;
  });

  Object.values(heroStats.opponentBans).forEach((hero) => {
    hero.banRate = hero.games > 0 ? (hero.bans / hero.games) * 100 : 0;
    hero.winRate = hero.games > 0 ? (hero.wins / hero.games) * 100 : 0;
  });

  // Convert Set to Array for players in heroStats
  Object.values(heroStats.ourPicks).forEach((hero) => {
    if (hero.players instanceof Set) hero.players = Array.from(hero.players);
  });
  Object.values(heroStats.ourBans).forEach((hero) => {
    if (hero.players instanceof Set) hero.players = Array.from(hero.players);
  });
  Object.values(heroStats.opponentPicks).forEach((hero) => {
    if (hero.players instanceof Set) hero.players = Array.from(hero.players);
  });
  Object.values(heroStats.opponentBans).forEach((hero) => {
    if (hero.players instanceof Set) hero.players = Array.from(hero.players);
  });

  // Helper functions for hero statistics
  const getHighlightStyle = (hero: string, type: "pick" | "ban") => {
    if (type === "pick") {
      const stats = heroStats.ourPicks[hero];
      if (!stats) return "";
      // 8+ games with 70%+ win rate
      if (stats.games >= 8 && stats.winRate >= 70)
        return "bg-blue-50 dark:bg-blue-900/30";
      // 5+ games with 80%+ win rate
      if (stats.games >= 5 && stats.winRate >= 80)
        return "bg-blue-50 dark:bg-blue-900/30";
    }
    // No highlight for bans or opponent tables
    return "";
  };

  const ourPickPad = Object.entries(heroStats.ourPicks)
    .sort(([, a], [, b]) => b.games - a.games)
    .slice(0, 10);

  const ourBanPad = Object.entries(heroStats.ourBans)
    .sort(([, a], [, b]) => b.bans - a.bans)
    .slice(0, 10);

  const opponentPickPad = Object.entries(heroStats.opponentPicks)
    .sort(([, a], [, b]) => b.games - a.games)
    .slice(0, 10);

  const opponentBanPad = Object.entries(heroStats.opponentBans)
    .sort(([, a], [, b]) => b.bans - a.bans)
    .slice(0, 10);

  function clearFilters() {
    // This function is no longer needed in parent component
  }

  // Helper to get opponent name from OpenDota data
  function getOpponentName(match: any, currentTeam: any) {
    // Check if existing opponent is valid (not BO3, BO5, BO7, etc.)
    const invalidOpponents = [
      "bo3",
      "bo5",
      "bo7",
      "bo1",
      "bo2",
      "bo4",
      "bo6",
      "bo8",
      "bo9",
    ];
    const existingOpponent = match.opponent?.toLowerCase();
    const isValidOpponent =
      existingOpponent &&
      !invalidOpponents.includes(existingOpponent) &&
      existingOpponent !== "unknown opponent";

    if (isValidOpponent) {
      return match.opponent;
    }

    if (match.openDota) {
      const radiantName = match.openDota.radiant_name?.toLowerCase();
      const direName = match.openDota.dire_name?.toLowerCase();
      const teamName = currentTeam?.name?.toLowerCase();

      if (teamName) {
        // Use exact match only
        if (radiantName === teamName) {
          return match.openDota.dire_name;
        }
        if (direName === teamName) {
          return match.openDota.radiant_name;
        }
      }

      // Fallback: try matching player names
      const teamPlayers = (currentTeam?.players || [])
        .map((p: any) => p.name?.toLowerCase())
        .filter(Boolean);

      if (Array.isArray(match.openDota.players)) {
        const radiantPlayers = match.openDota.players
          .filter((p: any) => p.isRadiant)
          .map((p: any) => p.name?.toLowerCase());
        const direPlayers = match.openDota.players
          .filter((p: any) => !p.isRadiant)
          .map((p: any) => p.name?.toLowerCase());

        const radiantOverlap = radiantPlayers.filter((n: any) =>
          teamPlayers.includes(n),
        ).length;
        const direOverlap = direPlayers.filter((n: any) =>
          teamPlayers.includes(n),
        ).length;

        if (radiantOverlap > direOverlap) {
          return match.openDota.dire_name;
        }
        if (direOverlap > radiantOverlap) {
          return match.openDota.radiant_name;
        }
      }
    }

    return "Unknown Opponent";
  }

  // Helper to determine which side the team played on
  function getTeamSide(match: any, currentTeam: any) {
    if (!match.openDota) return "Unknown";

    const radiantName = match.openDota.radiant_name?.toLowerCase();
    const direName = match.openDota.dire_name?.toLowerCase();
    const teamName = currentTeam?.name?.toLowerCase();

    if (teamName) {
      // Use exact match only
      if (radiantName === teamName) return "Radiant";
      if (direName === teamName) return "Dire";
    }

    // Fallback to player matching
    const teamPlayers = (currentTeam?.players || [])
      .map((p: any) => p.name?.toLowerCase())
      .filter(Boolean);
    if (Array.isArray(match.openDota.players)) {
      const radiantPlayers = match.openDota.players
        .filter((p: any) => p.isRadiant)
        .map((p: any) => p.name?.toLowerCase());
      const direPlayers = match.openDota.players
        .filter((p: any) => !p.isRadiant)
        .map((p: any) => p.name?.toLowerCase());

      const radiantOverlap = radiantPlayers.filter((n: any) =>
        teamPlayers.includes(n),
      ).length;
      const direOverlap = direPlayers.filter((n: any) =>
        teamPlayers.includes(n),
      ).length;

      if (radiantOverlap > direOverlap) return "Radiant";
      if (direOverlap > radiantOverlap) return "Dire";
    }

    return "Unknown";
  }

  // Helper to get hero name from hero ID
  function getHeroName(heroId: number) {
    return getHeroNameSync(heroId);
  }

  // Filtering logic moved from MatchList
  const filteredMatches = matches.filter((match: any) => {
    // Filter by result
    const matchResult = getMatchResult(match, currentTeam);
    const resultMatches = filterResult === "all" || matchResult === filterResult;

    // Filter by search term (opponent, league, or hero)
    const searchMatches = !searchTerm || 
      (match.opponent && match.opponent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (match.league && match.league.toLowerCase().includes(searchTerm.toLowerCase())) ||
      matchContainsHero(match, searchTerm);

    // Filter by side
    const teamSide = getTeamSide(match, currentTeam).toLowerCase();
    const sideMatches = sideFilter === 'all' || teamSide === sideFilter;

    // Filter by pick order
    let pickOrderMatches = true;
    if (pickOrderFilter !== 'all' && match.openDota?.picks_bans) {
      // Find the first pick in picks_bans
      const firstPick = match.openDota.picks_bans.find((pb: any) => pb.is_pick);
      if (firstPick) {
        const teamSide = getTeamSide(match, currentTeam);
        const isRadiant = teamSide === 'Radiant';
        const ourTeam = isRadiant ? 0 : 1;
        if (pickOrderFilter === 'fp') {
          pickOrderMatches = firstPick.team === ourTeam;
        } else if (pickOrderFilter === 'sp') {
          pickOrderMatches = firstPick.team !== ourTeam;
        }
      }
    }

    return resultMatches && searchMatches && sideMatches && pickOrderMatches;
  });

  // Helper to check if a match contains a specific hero
  function matchContainsHero(match: any, heroName: string): boolean {
    if (!match.openDota?.players || !heroName) return false;
    
    const searchTerm = heroName.toLowerCase();
    
    return match.openDota.players.some((player: any) => {
      const playerHero = getHeroNameSync(player.hero_id);
      return playerHero.toLowerCase().includes(searchTerm);
    });
  }

  // Helper to determine if the selected match is loading
  const isSelectedMatchLoading = !!selectedMatch && (
    refreshingMatches.has(selectedMatch) || 
    (refreshingTeamId === currentTeam?.id && !!selectedMatchObj)
  );

  // Determine if matches should show loading state during team refresh
  const isTeamRefreshing = refreshingTeamId === currentTeam?.id;

  const fetchPlayerData = async (accountId: number) => {
    if (prefetchedPlayerData.has(accountId)) {
      setPlayerData(prefetchedPlayerData.get(accountId));
      return;
    }
    setLoadingPlayerData(true);
    try {
      const response = await fetch(`/api/players/${accountId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setPlayerData(data);
        setPrefetchedPlayerData(prev => new Map(prev).set(accountId, data));
      } else {
        throw new Error("Failed to fetch player data");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load player data",
        variant: "destructive",
      });
    } finally {
      setLoadingPlayerData(false);
    }
  };

  const prefetchPlayerData = async (accountId: number) => {
    if (prefetchedPlayerData.has(accountId) || prefetchingPlayers.has(accountId)) {
      return;
    }
    setPrefetchingPlayers(prev => new Set(prev).add(accountId));
    try {
      const response = await fetch(`/api/players/${accountId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setPrefetchedPlayerData(prev => new Map(prev).set(accountId, data));
      }
    } catch (error) {
      // Silently fail for prefetching
    } finally {
      setPrefetchingPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const onShowPlayerPopup = (player: any) => {
    setSelectedPlayer(player);
    setShowPlayerPopup(true);
    fetchPlayerData(player.account_id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Match History</h1>
        {currentTeam && (
          <div className="text-sm text-muted-foreground">
            {currentTeam.name} • {currentTeam.league ? getLeagueNameFromUrl(currentTeam.league) : ""} • {currentTeam.manualMatches?.length || 0} matches
          </div>
        )}
      </div>

      {/* Refresh Progress Indicator */}
      {refreshingTeamId === currentTeam?.id && refreshProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Refreshing team data...</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">
                {refreshProgress.completed}/{refreshProgress.total}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelRefresh}
                className="h-6 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(refreshProgress.completed / refreshProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Queue Status Display */}
      {(() => {
        // Only show if any service has length > 0 or processing is true
        const hasActiveRequests = Object.values(queueStats).some(stats => (stats.length ?? 0) > 0 || stats.processing);
        return hasActiveRequests;
      })() && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Request Queue Status</h3>
          </div>
          <div className="flex gap-4 text-xs">
            {Object.entries(queueStats).map(([service, stats]) => (
              <div key={service} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${(stats.processing ?? false) ? 'bg-green-500' : (stats.length ?? 0) > 0 ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                <span className="font-medium capitalize">{service}:</span>
                <span>{stats.length ?? 0} queued</span>
                {(stats.processing ?? false) && <span className="text-green-600">• processing</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddMatch && <AddMatch onClose={() => setShowAddMatch(false)} />}

      {matchHistory && matchHistory.summary && matchHistory.trends ? (
        <MatchHistorySummary
          summary={matchHistory.summary}
          trends={matchHistory.trends}
        />
      ) : null}
      
      {/* Filter/search controls above the cards */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search opponent or hero..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
        />
        <div className="flex gap-1 items-center">
          <Button
            variant={filterResult === "W" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterResult(filterResult === "W" ? "all" : "W")}
            className={filterResult === "W" ? '!text-white hover:!text-white bg-green-600 border-green-600' : 'text-green-600 border-green-600 border-2 hover:bg-accent hover:!text-green-600'}
          >
            Wins
          </Button>
          <Button
            variant={filterResult === "L" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterResult(filterResult === "L" ? "all" : "L")}
            className={filterResult === "L" ? '!text-white hover:!text-white bg-red-600 border-red-600' : 'text-red-600 border-red-600 border-2 hover:bg-accent hover:!text-red-600'}
          >
            Losses
          </Button>
          <Button
            variant={sideFilter === 'radiant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSideFilter(sideFilter === 'radiant' ? 'all' : 'radiant')}
            className={sideFilter === 'radiant' ? '!text-white hover:!text-white bg-blue-500 border-blue-500' : 'text-blue-500 border-blue-500 border-2 hover:bg-accent hover:!text-blue-500'}
          >
            Radiant
          </Button>
          <Button
            variant={sideFilter === 'dire' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSideFilter(sideFilter === 'dire' ? 'all' : 'dire')}
            className={sideFilter === 'dire' ? '!text-white hover:!text-white bg-pink-500 border-pink-500' : 'text-pink-500 border-pink-500 border-2 hover:bg-accent hover:!text-pink-500'}
          >
            Dire
          </Button>
          <Button
            variant={pickOrderFilter === 'fp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPickOrderFilter(pickOrderFilter === 'fp' ? 'all' : 'fp')}
            className={pickOrderFilter === 'fp' ? '!text-white hover:!text-white bg-yellow-500 border-yellow-500' : 'text-yellow-500 border-yellow-500 border-2 hover:bg-accent hover:!text-yellow-500'}
          >
            First Pick
          </Button>
          <Button
            variant={pickOrderFilter === 'sp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPickOrderFilter(pickOrderFilter === 'sp' ? 'all' : 'sp')}
            className={pickOrderFilter === 'sp' ? '!text-white hover:!text-white bg-gray-500 border-gray-500' : 'text-gray-500 border-gray-500 border-2 hover:bg-accent hover:!text-gray-500'}
          >
            Second Pick
          </Button>
          {hiddenMatchIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHidden(true)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {hiddenMatchIds.length}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddMatch(true)}
            className="flex items-center gap-2 ml-2"
          >
            <Plus className="w-4 h-4" />
            Add Match
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-[420px_1fr] gap-6 items-start w-full">
        {/* Match List Card */}
        <Card 
          className="h-full flex flex-col overflow-hidden" 
          style={{ 
            minWidth: '320px', 
            maxWidth: '420px',
            maxHeight: matchDetailsHeight && selectedMatch ? `${matchDetailsHeight}px` : lastNonEmptyMatchDetailsHeight ? `${lastNonEmptyMatchDetailsHeight}px` : '600px',
            minHeight: matchDetailsHeight && selectedMatch ? 'auto' : lastNonEmptyMatchDetailsHeight ? `${lastNonEmptyMatchDetailsHeight}px` : '600px'
          }}
        >
          <CardContent className="p-0 h-full overflow-y-auto">
            <MatchList
              matches={filteredMatches}
              hiddenMatchIds={hiddenMatchIds}
              onHideMatch={removeMatch}
              onUnhideMatch={unhideMatch}
              showHidden={showHidden}
              selectedMatch={selectedMatch}
              setSelectedMatch={(id: string) => {
                handleMatchSelect(id);
                setSelectedGameIndex(0);
              }}
              selectedMatchObj={selectedMatchObj}
              selectedGameIndex={selectedGameIndex}
              setSelectedGameIndex={setSelectedGameIndex}
              currentTeam={currentTeam}
              error={error}
              onAddMatch={() => setShowAddMatch(true)}
              loading={loading}
              showPlayerPopup={showPlayerPopup}
              setShowPlayerPopup={setShowPlayerPopup}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
              playerData={playerData}
              setPlayerData={setPlayerData}
              loadingPlayerData={loadingPlayerData}
              fetchPlayerData={fetchPlayerData}
              prefetchPlayerData={prefetchPlayerData}
              prefetchedPlayerData={prefetchedPlayerData}
              prefetchingPlayers={prefetchingPlayers}
              updateQueueStats={queueStatsRef.current}
            />
          </CardContent>
        </Card>
        {/* Match Details Card */}
        <Card 
          ref={matchDetailsRef}
          className="min-w-0 flex flex-col w-full" 
          style={{ minWidth: '320px' }}
        >
          <CardContent className="px-6">
            <MatchDetails
              selectedMatchObj={selectedMatchObj}
              currentTeam={currentTeam}
              error={error}
              isLoading={!!selectedMatch && refreshingMatches.has(selectedMatch)}
              onShowPlayerPopup={onShowPlayerPopup}
            />
          </CardContent>
        </Card>
      </div>
      <HeroStatsTables
        heroStats={heroStats}
        currentTeam={currentTeam}
        getHighlightStyle={getHighlightStyle}
        error={error}
      />
      {showHidden && hiddenMatchIds.length > 0 && (
        <HiddenMatchesPopup
          isOpen={showHidden}
          onClose={() => setShowHidden(false)}
          hiddenMatches={hiddenMatches}
          currentTeam={currentTeam}
          preferredSite={preferredSite}
          onUnhideMatch={unhideMatch}
        />
      )}
    </div>
  );
}
