import { useToast } from "@/components/ui/use-toast";
import { useSidebar } from "@/contexts/sidebar-context";
import { useTeam } from "@/contexts/team-context";
import { getHeroNameSync, getTeamSide } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import AsyncMatchCard from "./AsyncMatchCard";
import PlayerPopup from "./PlayerPopup";

// Helper to check if a match contains a specific hero
function matchContainsHero(match: any, heroName: string): boolean {
  if (!match.openDota?.players || !heroName) return false;
  
  const searchTerm = heroName.toLowerCase();
  
  return match.openDota.players.some((player: any) => {
    const playerHero = getHeroNameSync(player.hero_id);
    return playerHero.toLowerCase().includes(searchTerm);
  });
}

export default function MatchList({
  matches,
  selectedMatch,
  setSelectedMatch,
  selectedMatchObj,
  selectedGameIndex,
  setSelectedGameIndex,
  currentTeam,
  error,
  onAddMatch,
  hiddenMatchIds,
  onHideMatch,
  onUnhideMatch,
  showHidden,
  className,
  showPlayerPopup,
  setShowPlayerPopup,
  selectedPlayer,
  setSelectedPlayer,
  playerData,
  setPlayerData,
  loadingPlayerData,
  prefetchedPlayerData,
  prefetchingPlayers,
  loading = false,
  updateQueueStats,
}: any) {
  const { toast } = useToast();
  const { setCurrentTeam, removeMatch, unhideMatch, hiddenMatchIds: teamHiddenMatchIds } = useTeam();
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
      const matchIndex = currentTeam?.manualMatches?.findIndex((m: any) => m.id === matchId);
      
      if (matchIndex === -1 || matchIndex === undefined) {
        throw new Error("Match not found in team data");
      }

      // Get the match object
      const match = currentTeam.manualMatches[matchIndex];
      
      // Enrich the match with fresh OpenDota data
      const response = await fetch('/api/refresh-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, team: currentTeam }),
      });
      if (!response.ok) throw new Error('Failed to refresh match');
      const enrichedMatch = await response.json();
      
      // Update the match in the team's matches array
      const updatedMatches = [...currentTeam.manualMatches];
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
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh match data",
        variant: "destructive",
      });
    } finally {
      if (typeof updateQueueStats === 'function') {
        updateQueueStats();
      }
    }
  };

  // Get hidden matches for popup
  const hiddenMatches = currentTeam?.manualMatches?.filter((match: any) => 
    teamHiddenMatchIds.includes(match.id)
  ) || [];

  return (
    <div className={`overflow-y-auto ${className || ''}`}>
      {error ? (
        <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
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
          {matches.map((match: any, idx: number) => (
            <div key={match.id ?? idx} className="relative">
              <AsyncMatchCard
                match={match}
                currentTeam={currentTeam}
                preferredSite={preferredSite}
                isSelected={selectedMatch === match.id}
                onSelect={setSelectedMatch}
                onHide={removeMatch}
                teamSide={getTeamSide(match, currentTeam)}
                isRefreshing={false}
                onRefresh={() => {}}
              />
            </div>
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