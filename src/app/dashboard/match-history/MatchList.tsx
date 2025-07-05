import { useToast } from "@/components/ui/use-toast";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTeam } from "@/contexts/team-context";
import { getTeamSide } from "@/lib/utils";
import type { Team, Match as TeamMatch } from "@/types/team";
import { Loader2 } from "lucide-react";
import { Suspense } from 'react';
import AsyncMatchCard from "./AsyncMatchCard";
import MatchCardSkeleton from './MatchCardSkeleton';
import PlayerPopup from "./PlayerPopup";

export default function MatchList({
  matches,
  selectedMatch,
  setSelectedMatch,
  _selectedMatchObj,
  _selectedGameIndex,
  _setSelectedGameIndex,
  currentTeam,
  _error,
  _onAddMatch,
  _hiddenMatchIds,
  _onHideMatch,
  _onUnhideMatch,
  _showHidden,
  className,
  showPlayerPopup,
  setShowPlayerPopup,
  selectedPlayer,
  _setSelectedPlayer,
  playerData,
  setPlayerData,
  loadingPlayerData,
  _prefetchedPlayerData,
  _prefetchingPlayers,
  loading = false,
  _updateQueueStats,
}: {
  matches: TeamMatch[];
  selectedMatch: string | null;
  setSelectedMatch: (matchId: string) => void;
  _selectedMatchObj: unknown;
  _selectedGameIndex: number;
  _setSelectedGameIndex: (index: number) => void;
  currentTeam: Team;
  _error: string | null;
  _onAddMatch: () => void;
  _hiddenMatchIds: string[];
  _onHideMatch: (matchId: string) => void;
  _onUnhideMatch: (matchId: string) => void;
  _showHidden: boolean;
  className?: string;
  showPlayerPopup: boolean;
  setShowPlayerPopup: (show: boolean) => void;
  selectedPlayer: unknown;
  _setSelectedPlayer: (player: unknown) => void;
  playerData: unknown;
  setPlayerData: (data: unknown) => void;
  loadingPlayerData: boolean;
  _prefetchedPlayerData: unknown;
  _prefetchingPlayers: boolean;
  loading?: boolean;
  _updateQueueStats: () => void;
}) {
  const { toast } = useToast();
  const { setCurrentTeam, removeMatch, hiddenMatchIds: teamHiddenMatchIds } = useTeam();
  const { preferredSite } = useSidebar();

  const handleRefreshMatch = async (matchId: string) => {
    if (!matchId) {
      toast({
        title: "Error",
        description: "No match ID provided for refresh",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the match in the current team's matches
      const matchIndex = currentTeam?.manualMatches?.findIndex((m: TeamMatch) => m.id === matchId);
      
      if (matchIndex === -1 || matchIndex === undefined) {
        throw new Error("Match not found in team data");
      }

      // Get the match object
      const match = currentTeam.manualMatches![matchIndex];
      
      // Enrich the match with fresh OpenDota data
      const response = await fetch('/api/refresh-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, team: currentTeam }),
      });
      if (!response.ok) throw new Error('Failed to refresh match');
      const enrichedMatch = await response.json();
      
      // Update the match in the team's matches array
      const updatedMatches = [...(currentTeam.manualMatches || [])];
      updatedMatches[matchIndex] = enrichedMatch;
      
      // Update the team with the new matches
      const updatedTeam = {
        ...currentTeam,
        manualMatches: updatedMatches,
      };
      
      setCurrentTeam(updatedTeam);
      
      toast({
        title: "Success",
        description: "Match data refreshed successfully",
      });
      
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to refresh match data",
        variant: "destructive",
      });
    } finally {
      if (typeof _updateQueueStats === 'function') {
        _updateQueueStats();
      }
    }
  };

  // Get hidden matches for popup
  const _hiddenMatches = currentTeam?.manualMatches?.filter((match: TeamMatch) => 
    teamHiddenMatchIds.includes(match.id!)
  ) || [];

  return (
    <div className={`overflow-y-auto ${className || ''}`}>
      {_error ? (
        <p className="text-red-500 text-sm font-semibold p-4">{_error}</p>
      ) : loading ? (
        <div className="flex items-center justify-center h-full py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : matches.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No matches found
        </div>
      ) : (
        <div className="h-full overflow-y-auto">
          {matches.map((match: TeamMatch, index: number) => (
            <Suspense key={match.id || index} fallback={<MatchCardSkeleton />}>
              <AsyncMatchCard
                match={match}
                currentTeam={currentTeam}
                preferredSite={preferredSite}
                isSelected={selectedMatch === match.id}
                onSelect={setSelectedMatch}
                onHide={removeMatch}
                teamSide={getTeamSide(match, currentTeam)}
                isRefreshing={false}
                onRefresh={() => handleRefreshMatch(match.id!)}
              />
            </Suspense>
          ))}
        </div>
      )}
      <PlayerPopup
        isOpen={showPlayerPopup}
        onClose={() => {
          setShowPlayerPopup(false);
          setPlayerData(null);
        }}
        selectedPlayer={selectedPlayer}
        playerData={playerData}
        loadingPlayerData={loadingPlayerData}
        onNavigateToPlayer={(player) => window.open(`/dashboard/player-stats?player=${player.account_id}`, '_blank')}
      />
    </div>
  );
}