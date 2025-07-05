"use client";
import React, { Suspense, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import type { Team } from "@/types/team";
import PageHeader from "@/components/dashboard/PageHeader";
import HeroStatsTables from "./HeroStatsTables";
import MatchHistoryGrid from "./MatchHistoryGrid";
import MatchHistorySummary from "./MatchHistorySummary";
import { calculateHeroStats, getHighlightStyle, getMatchSummary, useFilteredMatches, type HeroStatsData, type Match } from "./match-utils";
import { useGridHeight } from "./useGridHeight";
import { useMatchData } from "./useMatchData";
import { useMatchHistoryState } from "./useMatchHistoryState";

function MatchHistorySkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Match History"
        description="View detailed match history, analyze performance, and track your team's progress"
      />
      
      <div className="dashboard-content">
        {/* Main grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 w-full min-h-0" style={{ height: 600 }}>
          {/* Left column skeleton */}
          <Card className="flex flex-col min-h-0" style={{ height: 600 }}>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0 h-full">
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Right column skeleton */}
          <Card className="flex flex-col min-h-0" style={{ height: 600 }}>
            <CardContent className="flex-1 flex flex-col p-6 min-h-0 h-full">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Summary skeleton */}
        <div className="max-w-full">
          <Card className="h-fit mb-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Hero stats skeleton */}
        <div className="max-w-full">
          <Card className="h-fit mt-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MatchHistoryContent({ 
  gridHeight, 
  gridRef, 
  isLoaded, 
  currentTeam, 
  filteredMatches, 
  selectedMatch, 
  handleSelectMatch, 
  selectedMatchObj, 
  showPlayerPopup, 
  setShowPlayerPopup, 
  selectedPlayer, 
  setSelectedPlayer, 
  playerData, 
  setPlayerData, 
  loadingPlayerData, 
  loadingMatches,
  heroStats,
  isPending,
  summary,
  trends,
  emptyHeroStats
}: {
  gridHeight: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  currentTeam: Team | null;
  filteredMatches: unknown[];
  selectedMatch: string | null;
  handleSelectMatch: (matchId: string) => void;
  selectedMatchObj: unknown;
  showPlayerPopup: boolean;
  setShowPlayerPopup: (show: boolean) => void;
  selectedPlayer: unknown;
  setSelectedPlayer: (player: unknown) => void;
  playerData: unknown;
  setPlayerData: (data: unknown) => void;
  loadingPlayerData: boolean;
  loadingMatches: boolean;
  heroStats: HeroStatsData | null;
  isPending: boolean;
  summary: unknown;
  trends: unknown[];
  emptyHeroStats: HeroStatsData;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Match History"
        description="View detailed match history, analyze performance, and track the team's progress"
      />
      
      <div className="dashboard-content">
        {/* Main grid and content */}
        <MatchHistoryGrid 
          gridHeight={gridHeight} 
          gridRef={gridRef} 
          isLoaded={isLoaded} 
          currentTeam={currentTeam} 
          filteredMatches={filteredMatches} 
          selectedMatch={selectedMatch} 
          handleSelectMatch={handleSelectMatch} 
          selectedMatchObj={selectedMatchObj} 
          showPlayerPopup={showPlayerPopup} 
          setShowPlayerPopup={setShowPlayerPopup} 
          selectedPlayer={selectedPlayer} 
          setSelectedPlayer={setSelectedPlayer} 
          playerData={playerData} 
          setPlayerData={setPlayerData} 
          loadingPlayerData={loadingPlayerData} 
          loading={loadingMatches} 
        />
        {/* Row 3: Summary (auto height) */}
        <div className="max-w-full">
          <Card className="h-fit mb-0">
            <CardContent className="p-6">
              <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading summary...</div>}>
                <MatchHistorySummary summary={summary} trends={trends} loading={loadingMatches} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
        {/* Row 4: Hero statistics (auto height) */}
        <div className="max-w-full">
          <Card className="h-fit mt-0">
            <CardContent className="p-6 overflow-x-auto">
              <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading hero stats...</div>}>
                <HeroStatsTables 
                  heroStats={heroStats ?? emptyHeroStats}
                  currentTeam={currentTeam}
                  getHighlightStyle={(hero: string, type: string) => getHighlightStyle(hero, type, heroStats ?? emptyHeroStats)}
                  loading={loadingMatches || isPending || !heroStats}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ClientMatchHistoryPage({ selectedMatchId }: { selectedMatchId?: string | null }) {
  const { matches, loadingMatches, isLoaded, currentTeam } = useMatchData();
  const {
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
  } = useMatchHistoryState(selectedMatchId);

  // Memoize hero stats calculation to prevent unnecessary recalculations
  const heroStats = useMemo(() => {
    if (loadingMatches || matches.length === 0) {
      return null;
    }
    return calculateHeroStats(matches);
  }, [matches, loadingMatches]);

  // Filtering logic
  const filteredMatches = useFilteredMatches(matches, _selectedHeroes, _resultFilter, _sideFilter, _pickFilter);

  // Find the selected match object
  const selectedMatchObj = matches.find((m: Match) => m.id === selectedMatch) || null;

  // Summary calculation (can be fast, so not deferred)
  const summary = getMatchSummary(matches);
  const trends: unknown[] = [];

  const [gridHeight, gridRef] = useGridHeight(selectedMatch);

  // Default empty hero stats
  const emptyHeroStats: HeroStatsData = {
    ourPicks: {},
    ourBans: {},
    opponentPicks: {},
    opponentBans: {},
  };

  // Show skeleton while loading initial data
  if (!isLoaded || loadingMatches) {
    return <MatchHistorySkeleton />;
  }

  return (
    <MatchHistoryContent
      gridHeight={gridHeight}
      gridRef={gridRef}
      isLoaded={isLoaded}
      currentTeam={currentTeam}
      filteredMatches={filteredMatches}
      selectedMatch={selectedMatch}
      handleSelectMatch={handleSelectMatch}
      selectedMatchObj={selectedMatchObj}
      showPlayerPopup={showPlayerPopup}
      setShowPlayerPopup={setShowPlayerPopup}
      selectedPlayer={selectedPlayer}
      setSelectedPlayer={setSelectedPlayer}
      playerData={playerData}
      setPlayerData={setPlayerData}
      loadingPlayerData={_loadingPlayerData}
      loadingMatches={loadingMatches}
      heroStats={heroStats}
      isPending={false}
      summary={summary}
      trends={trends}
      emptyHeroStats={emptyHeroStats}
    />
  );
} 