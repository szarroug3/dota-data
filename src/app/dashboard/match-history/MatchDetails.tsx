import { Badge } from "@/components/ui/badge";
import { getHeroImageUrl, getHeroNameSync, getLeagueNameFromUrl, getMatchResult, getTeamSide } from "@/lib/utils";
import type { Team } from "@/types/team";
import { BarChart, User } from "lucide-react";
import type { Match } from "./match-utils";

interface MatchDetailsProps {
  match: Match;
  currentTeam: Team;
  _isLoading?: boolean;
  onShowPlayerPopup?: (player: unknown) => void;
}

export default function MatchDetails({ 
  match, 
  currentTeam, 
  _isLoading = false,
  onShowPlayerPopup 
}: MatchDetailsProps) {
  // Extract basic match info
  const _league = match.league;
  const _matchId = match.match_id || match.id;
  
  // Get OpenDota data
  const openDotaData = match.openDota;
  
  // Extract player data
  const radiantPlayers = openDotaData?.players?.filter((player: unknown) => 
    (player as { player_slot: number }).player_slot < 128
  ) || [];
  const _direPlayers = openDotaData?.players?.filter((player: unknown) => 
    (player as { player_slot: number }).player_slot >= 128
  ) || [];
  
  // Get team sides
  const radiantSide = getTeamSide(currentTeam, match);
  const _direSide = radiantSide === 'radiant' ? 'dire' : 'radiant';
  
  // Calculate match duration
  const duration = openDotaData?.duration ? Math.floor(openDotaData.duration / 60) : 0;
  const _minutes = Math.floor(duration);
  const _seconds = duration % 60;
  
  // Determine winner
  const radiantWin = openDotaData?.radiant_win;
  const _winner = radiantWin ? 'Radiant' : 'Dire';
  
  // Get hero stats data
  const _heroStats = {
    ourPicks: {},
    ourBans: {},
    opponentPicks: {},
    opponentBans: {}
  };
  
  // Helper function to get highlight style
  const _getHighlightStyle = (_hero: string, _type: string) => {
    // Implementation for highlight styling
    return '';
  };

  if (error) {
    return (
      <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
    );
  }

  if (!match) {
    return (
      <div className="text-center text-muted-foreground">
        <div className="text-lg font-medium mb-2">Select a match</div>
        <div className="text-sm">
          Choose a match from the list to view details
        </div>
      </div>
    );
  }

  // Extract OpenDota data if available
  const od = openDotaData || {};
  const radiantName = od.radiant_name || "Radiant";
  const direName = od.dire_name || "Dire";
  const radiantScore = od.radiant_score ?? "?";
  const direScore = od.dire_score ?? "?";
  const _league = getLeagueNameFromUrl(match.league);
  const result = getMatchResult(match, currentTeam);
  const teamSide = getTeamSide(match, currentTeam);
  const matchDate = match.date || (od.start_time ? new Date(od.start_time * 1000).toISOString() : "");
  const _matchId = od.match_id || match.id || "?";

  // Format date as 12/7/2024 10:17 PM (no comma)
  const formatMatchDate = (dateString: string) => {
    if (!dateString) return "?";
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} ${timeStr}`;
  };

  // Extract picks and bans
  const picksBans = od.picks_bans || [];
  const radiantPicks = picksBans.filter((pb: { is_pick: boolean; team: number }) => pb.is_pick && pb.team === 0).map((pb: { hero_id: number }) => pb.hero_id);
  const radiantBans = picksBans.filter((pb: { is_pick: boolean; team: number }) => !pb.is_pick && pb.team === 0).map((pb: { hero_id: number }) => pb.hero_id);
  const direPicks = picksBans.filter((pb: { is_pick: boolean; team: number }) => pb.is_pick && pb.team === 1).map((pb: { hero_id: number }) => pb.hero_id);
  const direBans = picksBans.filter((pb: { is_pick: boolean; team: number }) => !pb.is_pick && pb.team === 1).map((pb: { hero_id: number }) => pb.hero_id);

  // Helper to get player name
  const getPlayerName = (player: unknown) => {
    const p = player as { name?: string; personaname?: string; account_id?: number };
    return p.name || p.personaname || `Player ${p.account_id}` || 'Unknown';
  };

  // Helper to get hero name
  const getHeroName = (heroId: number) => {
    return getHeroNameSync(heroId);
  };

  // Helper for quick and full stats buttons
  function _PlayerButtons({ player, onShowPlayerPopup }: { player: unknown, onShowPlayerPopup: (player: unknown) => void }) {
    const handleQuickInfo = () => {
      onShowPlayerPopup(player);
    };
    const handleFullInfo = () => {
      const event = new CustomEvent('showPlayerStatsTab', { detail: { player } });
      window.dispatchEvent(event);
    };
    return (
      <span className="flex gap-1 items-center">
        <button
          className="text-xs px-1 py-0.5 rounded bg-muted hover:bg-accent border border-border flex items-center justify-center cursor-pointer"
          title="Quick player info"
          type="button"
          onClick={handleQuickInfo}
        >
          <User className="w-4 h-4 text-blue-500" />
        </button>
        <button
          className="text-xs px-1 py-0.5 rounded bg-muted hover:bg-accent border border-border flex items-center justify-center cursor-pointer"
          title="Full player info"
          type="button"
          onClick={handleFullInfo}
        >
          <BarChart className="w-4 h-4 text-pink-500" />
        </button>
      </span>
    );
  }

  // FP/SP indicator logic
  let fpSpIndicator = null;
  if (picksBans.length > 0) {
    const firstPickTeam = picksBans.find((pb: { is_pick: boolean; team: number }) => pb.is_pick)?.team;
    if (firstPickTeam !== undefined && teamSide !== 'Unknown') {
      const activeTeamIsRadiant = teamSide === 'Radiant';
      const activeTeamHadFirstPick = (firstPickTeam === 0 && activeTeamIsRadiant) || (firstPickTeam === 1 && !activeTeamIsRadiant);
      fpSpIndicator = (
        <Badge variant="static" className={`px-2 py-0.5 text-xs font-bold rounded ${activeTeamHadFirstPick ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>{activeTeamHadFirstPick ? 'FP' : 'SP'}</Badge>
      );
    }
  }

  return (
    <div className={`flex flex-col gap-4 relative`}>
      {/* Summary Section */}
      <div className="flex flex-wrap items-center gap-4 text-sm border-b pb-2 mb-2">
        <span className="text-2xl font-bold">{radiantScore}</span>
        <span className="text-xs text-muted-foreground">-</span>
        <span className="text-2xl font-bold">{direScore}</span>
        <Badge variant="static" className={
          result === "W"
            ? "bg-green-600 text-white px-2 py-0.5 text-xs font-bold rounded"
            : result === "L"
              ? "bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded"
              : "bg-muted px-2 py-0.5 text-xs font-bold rounded"
        }>
          {result}
        </Badge>
        {teamSide && (
          <Badge variant="static" className={`px-2 py-0.5 text-xs font-bold rounded ${teamSide === 'Radiant' ? 'bg-blue-500 text-white' : teamSide === 'Dire' ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground'}`}>{teamSide === 'Radiant' ? 'R' : teamSide === 'Dire' ? 'D' : '?'}</Badge>
        )}
        {fpSpIndicator}
        <span className="text-xs text-muted-foreground">{formatMatchDate(matchDate)}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
      </div>
      {/* Picks and Bans */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col items-center">
          <div className="font-medium mb-2 text-blue-500 text-center">{radiantName}</div>
          <div className="font-medium mb-1 text-blue-500">Picks</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {radiantPicks.map((id: number, i: number) => (
              <img
                key={i}
                src={getHeroImageUrl(getHeroName(id))}
                alt={getHeroName(id)}
                className="w-8 h-8 rounded object-cover bg-gray-200 dark:bg-gray-700"
                title={getHeroName(id)}
              />
            ))}
          </div>
          <div className="font-medium mb-1 text-blue-500">Bans</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {radiantBans.map((id: number, i: number) => (
              <img
                key={i}
                src={getHeroImageUrl(getHeroName(id))}
                alt={getHeroName(id)}
                className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700 opacity-60"
                title={getHeroName(id)}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="font-medium mb-2 text-pink-500 text-center">{direName}</div>
          <div className="font-medium mb-1 text-pink-500">Picks</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {direPicks.map((id: number, i: number) => (
              <img
                key={i}
                src={getHeroImageUrl(getHeroName(id))}
                alt={getHeroName(id)}
                className="w-8 h-8 rounded object-cover bg-gray-200 dark:bg-gray-700"
                title={getHeroName(id)}
              />
            ))}
          </div>
          <div className="font-medium mb-1 text-pink-500">Bans</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {direBans.map((id: number, i: number) => (
              <img
                key={i}
                src={getHeroImageUrl(getHeroName(id))}
                alt={getHeroName(id)}
                className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700 opacity-60"
                title={getHeroName(id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player Stats */}
      {radiantPlayers.length > 0 && (
        <div>
          <div className="font-medium mb-1">Players</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr>
                  <th className="py-1 px-2">Name</th>
                  <th className="py-1 px-2">Hero</th>
                  <th className="py-1 px-2">K</th>
                  <th className="py-1 px-2">D</th>
                  <th className="py-1 px-2">A</th>
                  <th className="py-1 px-2">GPM</th>
                  <th className="py-1 px-2">XPM</th>
                  <th className="py-1 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {radiantPlayers.map((p: unknown, i: number) => {
                  const handleFullInfo = () => {
                    const event = new CustomEvent('showPlayerStatsTab', { detail: { player: p } });
                    window.dispatchEvent(event);
                  };
                  return (
                    <tr key={i} className={`bg-blue-950/10`}>
                      <td className="py-1 px-2">{getPlayerName(p)}</td>
                      <td className="py-1 px-2">
                        <img
                          src={getHeroImageUrl(getHeroName((p as { hero_id: number }).hero_id))}
                          alt={getHeroName((p as { hero_id: number }).hero_id)}
                          className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
                          title={getHeroName((p as { hero_id: number }).hero_id)}
                        />
                      </td>
                      <td className="py-1 px-2">{(p as { kills?: number }).kills || 0}</td>
                      <td className="py-1 px-2">{(p as { deaths?: number }).deaths || 0}</td>
                      <td className="py-1 px-2">{(p as { assists?: number }).assists || 0}</td>
                      <td className="py-1 px-2">{(p as { gold_per_min?: number }).gold_per_min || 0}</td>
                      <td className="py-1 px-2">{(p as { xp_per_min?: number }).xp_per_min || 0}</td>
                      <td className="py-1 px-2">
                        {onShowPlayerPopup && (
                          <button
                            className="text-xs px-1 py-0.5 rounded bg-muted hover:bg-accent border border-border flex items-center justify-center cursor-pointer"
                            title="Quick player info"
                            type="button"
                            onClick={() => onShowPlayerPopup(p)}
                          >
                            <User className="w-4 h-4 text-blue-500" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 