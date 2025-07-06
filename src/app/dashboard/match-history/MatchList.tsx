import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTeam } from "@/contexts/team-context";
import { getTeamSide } from "@/lib/utils";
import type { Team } from "@/types/team";
import { Loader2, Plus, Users } from "lucide-react";
import { Suspense } from 'react';
import AsyncMatchCard from "./AsyncMatchCard";
import type { Match } from "./match-utils";
import MatchCardSkeleton from './MatchCardSkeleton';
import PlayerPopup from "./PlayerPopup";

interface PlayerData {
  [key: string]: unknown;
}

// Extract empty state components to reduce complexity
function NoTeamSelected() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <div className="mb-4">
        <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium mb-2">No team selected</h3>
      <p className="text-sm mb-4">Please select or import a team to view match history.</p>
      <Button
        variant="outline"
        onClick={() => window.open('/dashboard/team-management', '_blank')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Import Team
      </Button>
    </div>
  );
}

function NoMatchesFound({ onAddMatch }: { onAddMatch?: () => void }) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No matches found</h3>
      <p className="text-sm mb-4">Add matches to start tracking the team&apos;s performance.</p>
      <Button
        variant="outline"
        onClick={onAddMatch}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Match
      </Button>
    </div>
  );
}

function MatchListError({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="text-red-500 text-sm font-semibold p-4">{error as string}</p>;
}

function MatchListLoading() {
  return (
    <div className="flex items-center justify-center h-full py-8">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function MatchListContent({
  matches,
  selectedMatch,
  setSelectedMatch,
  currentTeam,
  handleRemoveMatch,
  loading,
  preferredSite
}: {
  matches: Match[];
  selectedMatch: string | null;
  setSelectedMatch: (matchId: string) => void;
  currentTeam: Team;
  handleRemoveMatch: (matchId: string) => void;
  loading: boolean;
  preferredSite: string;
  }) {
  return (
    <div className="h-full overflow-y-auto">
      {matches.map((match, index) => (
        <Suspense key={match.id || index} fallback={<MatchCardSkeleton />}>
          <AsyncMatchCard
            match={match}
            currentTeam={currentTeam}
            preferredSite={preferredSite}
            isSelected={selectedMatch === (match.id || "")}
            onSelect={setSelectedMatch}
            onHide={handleRemoveMatch}
            teamSide={getTeamSide(match, currentTeam)}
            loading={loading}
          />
        </Suspense>
      ))}
    </div>
  );
}

export default function MatchList({
  matches,
  selectedMatch,
  setSelectedMatch,
  currentTeam,
  _error,
  _onAddMatch,
  className,
  showPlayerPopup,
  setShowPlayerPopup,
  selectedPlayer,
  playerData,
  setPlayerData,
  loadingPlayerData,
  loading = false,
  _updateQueueStats,
}: {
  matches: Match[];
  selectedMatch: string | null;
  setSelectedMatch: (matchId: string) => void;
  currentTeam: Team;
  _error: unknown;
  _onAddMatch?: () => void;
  className?: string;
  showPlayerPopup: boolean;
  setShowPlayerPopup: (show: boolean) => void;
  selectedPlayer: unknown;
  playerData: PlayerData | null;
  setPlayerData: (data: PlayerData | null) => void;
  loadingPlayerData: boolean;
  loading?: boolean;
  _updateQueueStats: () => void;
}) {
  const { toast } = useToast();
  const { removeMatch, hiddenMatchIds: _teamHiddenMatchIds } = useTeam();
  const { preferredSite } = useSidebar();

  const handleRemoveMatch = (matchId: string) => {
    removeMatch(matchId);
    toast({
      title: "Match Removed",
      description: "Match has been removed from the team's history.",
    });
  };

  if (!currentTeam) {
    return <NoTeamSelected />;
  }

  if (matches.length === 0 && !loading) {
    return <NoMatchesFound onAddMatch={_onAddMatch} />;
  }

  return (
    <div className={`overflow-y-auto ${className || ''}`}>
      <MatchListError error={_error} />
      {loading ? (
        <MatchListLoading />
      ) : (
        <MatchListContent
          matches={matches}
          selectedMatch={selectedMatch}
          setSelectedMatch={setSelectedMatch}
          currentTeam={currentTeam}
          handleRemoveMatch={handleRemoveMatch}
          loading={loading}
          preferredSite={preferredSite}
        />
      )}
      {showPlayerPopup && selectedPlayer !== null && selectedPlayer !== undefined && (
        <PlayerPopup
          player={selectedPlayer as PlayerData}
          isOpen={showPlayerPopup}
          onClose={() => {
            setShowPlayerPopup(false);
            setPlayerData(null);
          }}
          playerData={playerData}
          loadingPlayerData={loadingPlayerData}
          onNavigateToPlayer={(player) => window.open(`/dashboard/player-stats?player=${player.account_id}`, '_blank')}
        />
      )}
    </div>
  );
}