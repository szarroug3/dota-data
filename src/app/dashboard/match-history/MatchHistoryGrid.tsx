import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Team } from "@/types/team";
import React from "react";
import ClientAsyncMatchDetails from './ClientAsyncMatchDetails';
import MatchList from "./MatchList";

interface MatchHistoryGridProps {
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
  loading: boolean;
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
  setSelectedPlayer,
  playerData,
  setPlayerData,
  loadingPlayerData,
  loading,
}) => (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
              selectedMatchObj={selectedMatchObj}
              currentTeam={currentTeam}
              showPlayerPopup={showPlayerPopup}
              setShowPlayerPopup={setShowPlayerPopup}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
              playerData={playerData}
              setPlayerData={setPlayerData}
              loadingPlayerData={loadingPlayerData}
              loading={loading}
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
);

export default MatchHistoryGrid; 