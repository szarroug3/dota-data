"use client";
import PageHeader from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getHeroNameSync } from "@/lib/utils";
import type { OpenDotaMatchPlayer, OpenDotaPlayer } from "@/types/opendota";
import type { Team } from "@/types/team";
import React, { Suspense, useMemo } from "react";
import HeroStatsTables from "./HeroStatsTables";
import { useMatchHistoryFilters } from "./MatchHistoryFilters";
import MatchHistoryGrid from "./MatchHistoryGrid";
import MatchHistorySummary from "./MatchHistorySummary";
import { calculateHeroStats, getHighlightStyle, getMatchSummary, getMatchTrends, useFilteredMatches, type HeroStatsData, type Match } from "./match-utils";
import { useGridHeight } from "./useGridHeight";
import { useMatchData } from "./useMatchData";
import { useMatchHistoryState } from "./useMatchHistoryState";

// Define the return types from utility functions
interface MatchSummary {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgGameLength: string;
  currentStreak: number;
}

interface MatchTrend {
  type: string;
  value: number;
  change: number;
  direction: "up" | "down";
  metric: string;
  trend: string;
}

// Extracted component for summary section
function MatchSummarySection({ 
  summary, 
  trends, 
  loadingMatches 
}: { 
  summary: MatchSummary; 
  trends: MatchTrend[]; 
  loadingMatches: boolean; 
}) {
  return (
    <div className="max-w-full">
      <Card className="h-fit mb-0">
        <CardContent className="p-6">
          <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading summary...</div>}>
            <MatchHistorySummary summary={summary} trends={trends} loading={loadingMatches} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Extracted component for hero stats section
function HeroStatsSection({ 
  currentTeam, 
  heroStats, 
  emptyHeroStats, 
  loadingMatches 
}: { 
  currentTeam: Team | null; 
  heroStats: HeroStatsData | null; 
  emptyHeroStats: HeroStatsData; 
  loadingMatches: boolean; 
}) {
  return (
    <div className="max-w-full">
      <Card className="h-fit mt-0">
        <CardContent className="p-6">
          <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading hero stats...</div>}>
            {currentTeam && (
              <HeroStatsTables 
                heroStats={heroStats || emptyHeroStats} 
                getHighlightStyle={(hero: string, type: string) => getHighlightStyle(hero, type, heroStats || emptyHeroStats)}
                loading={loadingMatches} 
              />
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Extracted component for add match functionality
function useAddMatchState() {
  const [showAddMatch, setShowAddMatch] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleAddMatch = () => {
    setShowAddMatch(true);
    setIsClosing(false);
  };

  const handleCloseAddMatch = () => {
    setIsClosing(true);
    // Allow animation to complete before hiding
    setTimeout(() => {
      setShowAddMatch(false);
      setIsClosing(false);
    }, 500);
  };

  return {
    showAddMatch,
    isClosing,
    handleAddMatch,
    handleCloseAddMatch
  };
}

// Extracted component for hero stats calculation
function useHeroStatsCalculation(matches: Match[], loadingMatches: boolean) {
  return useMemo(() => {
    if (loadingMatches || matches.length === 0) {
      return null;
    }
    return calculateHeroStats(matches);
  }, [matches, loadingMatches]);
}

// Extracted component for available heroes calculation
function useAvailableHeroes(matches: Match[]) {
  return useMemo(() => {
    const heroes = new Set<string>();
    matches.forEach((match: Match) => {
      if (match.openDota?.players) {
        match.openDota.players.forEach((player: OpenDotaMatchPlayer) => {
          const heroName = getHeroNameSync(player.hero_id);
          if (heroName) heroes.add(heroName);
        });
      }
    });
    return Array.from(heroes).sort();
  }, [matches]);
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
  playerData, 
  setPlayerData, 
  loadingPlayerData, 
  loadingMatches,
  heroStats,
  summary,
  trends,
  emptyHeroStats,
  filters,
  onFilterChange,
  onClearFilters,
  availableHeroes,
  onAddMatch,
  showAddMatch,
  isClosing,
  handleCloseAddMatch
}: {
  gridHeight: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  currentTeam: Team | null;
  filteredMatches: Match[];
  selectedMatch: string | null;
  handleSelectMatch: (matchId: string) => void;
  selectedMatchObj: Match | null;
  showPlayerPopup: boolean;
  setShowPlayerPopup: (show: boolean) => void;
  selectedPlayer: OpenDotaPlayer | null;
  playerData: Record<string, unknown> | null;
  setPlayerData: (data: Record<string, unknown> | null) => void;
  loadingPlayerData: boolean;
  loadingMatches: boolean;
  heroStats: HeroStatsData | null;
  summary: MatchSummary;
  trends: MatchTrend[];
  emptyHeroStats: HeroStatsData;
  filters: {
    opponentFilter: string;
    heroFilter: string[];
    resultFilter: string;
    sideFilter: string;
    pickFilter: string;
  };
  onFilterChange: (filters: Partial<{
    opponentFilter: string;
    heroFilter: string[];
    resultFilter: string;
    sideFilter: string;
    pickFilter: string;
  }>) => void;
  onClearFilters: () => void;
  availableHeroes: string[];
  onAddMatch?: () => void;
  showAddMatch: boolean;
  isClosing: boolean;
  handleCloseAddMatch: () => void;
}) {
  return (
    <div className="space-y-6">
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
          selectedPlayer={selectedPlayer as OpenDotaPlayer | null}
          playerData={playerData as { [key: string]: unknown } | null}
          setPlayerData={setPlayerData as (data: { [key: string]: unknown } | null) => void}
          loadingPlayerData={loadingPlayerData} 
          loading={loadingMatches}
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          availableHeroes={availableHeroes}
          onAddMatch={onAddMatch}
          showAddMatch={showAddMatch}
          isClosing={isClosing}
          handleCloseAddMatch={handleCloseAddMatch}
        />
        {/* Row 3: Summary (auto height) */}
        <MatchSummarySection 
          summary={summary} 
          trends={trends} 
          loadingMatches={loadingMatches} 
        />
        {/* Row 4: Hero statistics (auto height) */}
        <HeroStatsSection 
          currentTeam={currentTeam}
          heroStats={heroStats}
          emptyHeroStats={emptyHeroStats}
          loadingMatches={loadingMatches}
        />
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
    playerData,
    setPlayerData,
    handleSelectMatch
  } = useMatchHistoryState(selectedMatchId);

  // Use the new filter hook
  const { filters, updateFilters, clearFilters } = useMatchHistoryFilters();

  // Add match functionality
  const { showAddMatch, isClosing, handleAddMatch, handleCloseAddMatch } = useAddMatchState();

  // Memoize hero stats calculation to prevent unnecessary recalculations
  const heroStats = useHeroStatsCalculation(matches, loadingMatches);

  // Get available heroes for filter dropdown
  const availableHeroes = useAvailableHeroes(matches);

  // Filtering logic with new filters
  const filteredMatches = useFilteredMatches(matches, filters, currentTeam);

  // Find the selected match object
  const selectedMatchObj = matches.find((m: Match) => m.id === selectedMatch) || null;

  // Summary calculation (can be fast, so not deferred)
  const summary = getMatchSummary(matches);
  const trends = getMatchTrends(matches) as MatchTrend[];

  const [gridHeight, gridRef] = useGridHeight(selectedMatch);

  // Default empty hero stats
  const emptyHeroStats: HeroStatsData = {
    ourPicks: {},
    ourBans: {},
    opponentPicks: {},
    opponentBans: {},
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match History"
        description="View detailed match history, analyze performance, and track your team's progress"
      />
      {/* Main content below header */}
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
        selectedPlayer={selectedPlayer as OpenDotaPlayer | null}
        playerData={playerData as { [key: string]: unknown } | null}
        setPlayerData={setPlayerData as (data: { [key: string]: unknown } | null) => void}
        loadingPlayerData={false}
        loadingMatches={loadingMatches}
        heroStats={heroStats}
        summary={summary}
        trends={trends}
        emptyHeroStats={emptyHeroStats}
        filters={filters}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
        availableHeroes={availableHeroes}
        onAddMatch={handleAddMatch}
        showAddMatch={showAddMatch}
        isClosing={isClosing}
        handleCloseAddMatch={handleCloseAddMatch}
      />
      <style>{`
        .add-match-slide-open {
          max-height: 400px !important;
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .add-match-slide-closed {
          max-height: 0 !important;
          opacity: 0 !important;
          transform: translateY(-16px) !important;
        }
      `}</style>
    </div>
  );
} 