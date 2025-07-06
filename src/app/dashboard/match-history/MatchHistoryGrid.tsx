import AddMatch from "@/components/dashboard/AddMatch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpenDotaPlayer } from "@/types/opendota";
import { Team } from "@/types/team";
import React from "react";
import ClientAsyncMatchDetails from './ClientAsyncMatchDetails';
import { MatchHistoryFilters } from "./MatchHistoryFilters";
import MatchList from "./MatchList";
import { Match } from "./match-utils";

interface MatchHistoryGridProps {
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
  playerData: { [key: string]: unknown } | null;
  setPlayerData: (data: { [key: string]: unknown } | null) => void;
  loadingPlayerData: boolean;
  loading: boolean;
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
}

function MatchListSkeleton() {
  return (
    <div className="p-4">
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
  );
}

function MatchDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

const MatchHistoryGrid: React.FC<MatchHistoryGridProps> = ({
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
  loading,
  filters,
  onFilterChange,
  onClearFilters,
  availableHeroes,
  onAddMatch,
  showAddMatch,
  isClosing,
  handleCloseAddMatch,
}) => (
  <div className="space-y-4 w-full">
    {/* Filters row - above the grid */}
    <div className="px-0">
      <MatchHistoryFilters
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        availableHeroes={availableHeroes}
        onAddMatch={onAddMatch}
      />
      <div
        className={`transition-all duration-500 overflow-hidden ${showAddMatch && !isClosing ? 'add-match-slide-open' : 'add-match-slide-closed'}`}
        style={{ maxHeight: showAddMatch && !isClosing ? 400 : 0, opacity: showAddMatch && !isClosing ? 1 : 0, transform: showAddMatch && !isClosing ? 'translateY(0)' : 'translateY(-16px)' }}
      >
        {showAddMatch && (
          <div className="mb-4">
            <AddMatch onClose={handleCloseAddMatch} />
          </div>
        )}
      </div>
    </div>
    
    {/* Main grid */}
    <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 w-full min-h-0" style={{ height: gridHeight }}>
      {/* Left column: match list, scrollable */}
      <Card className="flex flex-col min-h-0" style={{ height: gridHeight }}>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0 h-full">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {!isLoaded || loading ? (
              <MatchListSkeleton />
            ) : !currentTeam ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No team selected</h3>
                <p className="text-sm">Please select or import a team to view match history.</p>
              </div>
            ) : (
              <MatchList
                matches={filteredMatches}
                selectedMatch={selectedMatch}
                setSelectedMatch={handleSelectMatch}
                currentTeam={currentTeam}
                _error={null}
                _onAddMatch={onAddMatch || (() => {})}
                showPlayerPopup={showPlayerPopup}
                setShowPlayerPopup={setShowPlayerPopup}
                selectedPlayer={selectedPlayer}
                playerData={playerData}
                setPlayerData={setPlayerData}
                loadingPlayerData={loadingPlayerData}
                loading={loading}
                _updateQueueStats={() => {}}
              />
            )}
          </div>
        </CardContent>
      </Card>
      {/* Right column: match details, not scrollable, expands to fit content */}
      <Card className="flex flex-col min-h-0" style={{ height: gridHeight }}>
        <CardContent className="flex-1 flex flex-col p-6 min-h-0 h-full">
          {!isLoaded || loading ? (
            <MatchDetailsSkeleton />
          ) : isLoaded && currentTeam ? (
            <ClientAsyncMatchDetails selectedMatchObj={selectedMatchObj} currentTeam={currentTeam} />
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);

export default MatchHistoryGrid; 