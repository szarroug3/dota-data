import { Badge } from "@/components/ui/badge";
import { getHeroImageUrl, getLeagueNameFromUrl, getMatchResult, getTeamSide } from "@/lib/utils";
import { BarChart, Loader2, User } from "lucide-react";

interface MatchDetailsProps {
  selectedMatchObj: any;
  currentTeam: any;
  error: string | null;
  isLoading?: boolean;
  onShowPlayerPopup: (player: any) => void;
}

export default function MatchDetails({ selectedMatchObj, currentTeam, error, isLoading = false, onShowPlayerPopup }: MatchDetailsProps) {
  if (error) {
    return (
      <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
    );
  }

  if (!selectedMatchObj) {
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
  const od = selectedMatchObj.openDota || {};
  const radiantName = od.radiant_name || "Radiant";
  const direName = od.dire_name || "Dire";
  const radiantScore = od.radiant_score ?? "?";
  const direScore = od.dire_score ?? "?";
  const duration = od.duration ?? selectedMatchObj.duration ?? 0;
  const league = getLeagueNameFromUrl(selectedMatchObj.league);
  const result = getMatchResult(selectedMatchObj, currentTeam);
  const teamSide = getTeamSide(selectedMatchObj, currentTeam);
  const matchDate = selectedMatchObj.date || (od.start_time ? new Date(od.start_time * 1000).toISOString() : "");
  const matchId = od.match_id || selectedMatchObj.id || "?";

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

  // Hero picks and bans
  const picksBans = od.picks_bans || [];
  const radiantPicks = picksBans.filter((pb: any) => pb.is_pick && pb.team === 0).map((pb: any) => pb.hero_id);
  const radiantBans = picksBans.filter((pb: any) => !pb.is_pick && pb.team === 0).map((pb: any) => pb.hero_id);
  const direPicks = picksBans.filter((pb: any) => pb.is_pick && pb.team === 1).map((pb: any) => pb.hero_id);
  const direBans = picksBans.filter((pb: any) => !pb.is_pick && pb.team === 1).map((pb: any) => pb.hero_id);

  // Player stats
  const players = od.players || [];
  // Split players by team
  const radiantPlayers = players.filter((p: any) => p.isRadiant);
  const direPlayers = players.filter((p: any) => !p.isRadiant);

  // Helper to get player name
  function getPlayerName(p: any) {
    return p.name || p.personaname || p.account_id || "?";
  }

  // Helper for quick and full stats buttons
  function PlayerButtons({ player, onShowPlayerPopup }: { player: any, onShowPlayerPopup: (player: any) => void }) {
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
    const firstPickTeam = picksBans.find((pb: any) => pb.is_pick)?.team;
    if (firstPickTeam !== undefined && teamSide !== 'Unknown') {
      const activeTeamIsRadiant = teamSide === 'Radiant';
      const activeTeamHadFirstPick = (firstPickTeam === 0 && activeTeamIsRadiant) || (firstPickTeam === 1 && !activeTeamIsRadiant);
      fpSpIndicator = (
        <Badge variant="static" className={`px-2 py-0.5 text-xs font-bold rounded ${activeTeamHadFirstPick ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>{activeTeamHadFirstPick ? 'FP' : 'SP'}</Badge>
      );
    }
  }

  return (
    <div className={`flex flex-col gap-4 relative ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
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
      {players.length > 0 && (
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
                {players.map((p: any, i: number) => {
                  const handleFullInfo = () => {
                    const event = new CustomEvent('showPlayerStatsTab', { detail: { player: p } });
                    window.dispatchEvent(event);
                  };
                  return (
                    <tr key={i} className={p.isRadiant ? 'bg-blue-950/10' : 'bg-pink-950/10'}>
                      <td className="py-1 px-2">{getPlayerName(p)}</td>
                      <td className="py-1 px-2">
                        <img
                          src={getHeroImageUrl(getHeroName(p.hero_id))}
                          alt={getHeroName(p.hero_id)}
                          className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700 inline-block mr-1"
                          title={getHeroName(p.hero_id)}
                        />
                      </td>
                      <td className="py-1 px-2">{p.kills}</td>
                      <td className="py-1 px-2">{p.deaths}</td>
                      <td className="py-1 px-2">{p.assists}</td>
                      <td className="py-1 px-2">{p.gold_per_min}</td>
                      <td className="py-1 px-2">{p.xp_per_min}</td>
                      <td className="py-1 px-2 w-auto">
                        <span className="flex gap-1 items-center">
                          <button
                            className="text-xs px-1 py-0.5 rounded bg-muted hover:bg-accent border border-border flex items-center justify-center cursor-pointer"
                            title="Quick player info"
                            type="button"
                            onClick={() => onShowPlayerPopup(p)}
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

// Helper to get hero name synchronously
function getHeroName(heroId: number) {
  const { getHeroNameSync } = require("@/lib/utils");
  return getHeroNameSync(heroId);
} 