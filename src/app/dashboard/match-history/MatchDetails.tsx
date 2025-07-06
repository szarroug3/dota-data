import { Badge } from "@/components/ui/badge";
import { getDashboardMatchResult, getHeroImageUrl, getHeroNameSync, getTeamSide } from "@/lib/utils";
import type { OpenDotaFullMatch, OpenDotaPlayer } from "@/types/opendota";
import type { Team } from "@/types/team";
import { BarChart, User } from "lucide-react";
import type { Match } from "./match-utils";

interface MatchDetailsProps {
  match: Match;
  currentTeam: Team;
  error?: string | null;
  isLoading?: boolean;
  onShowPlayerPopup?: (player: OpenDotaFullMatch['players'][0]) => void;
}

// Extracted component for no match selected state
function NoMatchSelected() {
  return (
    <div className="text-center text-muted-foreground">
      <div className="text-lg font-medium mb-2">Select a match</div>
      <div className="text-sm">
        Choose a match from the list to view details
      </div>
    </div>
  );
}

// Extracted component for error state
function MatchError({ error }: { error: string }) {
  return (
    <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
  );
}

// Extracted component for date formatting
function formatMatchDate(dateString: string) {
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
}

// Extracted component for match summary
function MatchSummary({ 
  radiantScore, 
  direScore, 
  result, 
  teamSide, 
  fpSpIndicator, 
  matchDate, 
  duration 
}: { 
  radiantScore: string; 
  direScore: string; 
  result: string; 
  teamSide: string | null; 
  fpSpIndicator: React.ReactNode; 
  matchDate: string; 
  duration: number; 
}) {
  return (
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
  );
}

// Extracted component for hero display
function HeroDisplay({ 
  heroIds, 
  size = "w-8 h-8", 
  opacity = "" 
}: { 
  heroIds: number[]; 
  size?: string; 
  opacity?: string; 
}) {
  const getHeroName = (heroId: number) => getHeroNameSync(heroId);
  
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {heroIds.map((id: number, i: number) => (
        <img
          key={i}
          src={getHeroImageUrl(getHeroName(id))}
          alt={getHeroName(id)}
          className={`${size} rounded object-cover bg-gray-200 dark:bg-gray-700 ${opacity}`}
          title={getHeroName(id)}
        />
      ))}
    </div>
  );
}

// Extracted component for team picks and bans
function TeamPicksBans({ 
  teamName, 
  picks, 
  bans, 
  teamColor 
}: { 
  teamName: string; 
  picks: number[]; 
  bans: number[]; 
  teamColor: string; 
}) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className={`font-medium mb-2 ${teamColor} text-center`}>{teamName}</div>
      <div className={`font-medium mb-1 ${teamColor}`}>Picks</div>
      <HeroDisplay heroIds={picks} />
      <div className={`font-medium mb-1 ${teamColor}`}>Bans</div>
      <HeroDisplay heroIds={bans} size="w-6 h-6" opacity="opacity-60" />
    </div>
  );
}

// Extracted component for player buttons
function PlayerButtons({ 
  player, 
  onShowPlayerPopup 
}: { 
  player: OpenDotaFullMatch['players'][0]; 
  onShowPlayerPopup: (player: OpenDotaFullMatch['players'][0]) => void; 
}) {
  const handleQuickInfo = () => {
    onShowPlayerPopup(player);
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
        onClick={() => {
          const event = new CustomEvent('showPlayerStatsTab', { detail: { player } });
          window.dispatchEvent(event);
        }}
      >
        <BarChart className="w-4 h-4 text-pink-500" />
      </button>
    </span>
  );
}

// Extracted component for player row
function PlayerRow({ 
  player, 
  onShowPlayerPopup 
}: { 
  player: OpenDotaFullMatch['players'][0]; 
  onShowPlayerPopup?: (player: OpenDotaFullMatch['players'][0]) => void; 
}) {
  const getPlayerName = (player: OpenDotaFullMatch['players'][0]) => {
    return player.name || player.personaname || `Player ${player.account_id}` || 'Unknown';
  };

  const getHeroName = (heroId: number) => getHeroNameSync(heroId);

  const typedPlayer = player as unknown as OpenDotaPlayer & { 
    player_slot: number; 
    isRadiant?: boolean;
    hero_id: number;
    kills: number;
    deaths: number;
    assists: number;
    gold_per_min?: number;
    xp_per_min?: number;
  };

  return (
    <tr className="bg-blue-950/10">
      <td className="py-1 px-2">{getPlayerName(player)}</td>
      <td className="py-1 px-2">
        <img
          src={getHeroImageUrl(getHeroName(typedPlayer.hero_id))}
          alt={getHeroName(typedPlayer.hero_id)}
          className="w-6 h-6 rounded object-cover bg-gray-200 dark:bg-gray-700"
          title={getHeroName(typedPlayer.hero_id)}
        />
      </td>
      <td className="py-1 px-2">{typedPlayer.kills || 0}</td>
      <td className="py-1 px-2">{typedPlayer.deaths || 0}</td>
      <td className="py-1 px-2">{typedPlayer.assists || 0}</td>
      <td className="py-1 px-2">{typedPlayer.gold_per_min || 0}</td>
      <td className="py-1 px-2">{typedPlayer.xp_per_min || 0}</td>
      <td className="py-1 px-2">
        {onShowPlayerPopup && (
          <PlayerButtons player={player} onShowPlayerPopup={onShowPlayerPopup} />
        )}
      </td>
    </tr>
  );
}

// Extracted component for player stats table
function PlayerStatsTable({ 
  radiantPlayers, 
  onShowPlayerPopup 
}: { 
  radiantPlayers: OpenDotaFullMatch['players'][0][]; 
  onShowPlayerPopup?: (player: OpenDotaFullMatch['players'][0]) => void; 
}) {
  if (radiantPlayers.length === 0) return null;

  return (
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
            {radiantPlayers.map((p: OpenDotaFullMatch['players'][0], i: number) => (
              <PlayerRow key={i} player={p} onShowPlayerPopup={onShowPlayerPopup} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Extracted component for picks and bans section
function PicksBansSection({ 
  radiantName, 
  direName, 
  radiantPicks, 
  radiantBans, 
  direPicks, 
  direBans 
}: { 
  radiantName: string; 
  direName: string; 
  radiantPicks: number[]; 
  radiantBans: number[]; 
  direPicks: number[]; 
  direBans: number[]; 
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <TeamPicksBans 
        teamName={radiantName} 
        picks={radiantPicks} 
        bans={radiantBans} 
        teamColor="text-blue-500" 
      />
      <TeamPicksBans 
        teamName={direName} 
        picks={direPicks} 
        bans={direBans} 
        teamColor="text-pink-500" 
      />
    </div>
  );
}

export default function MatchDetails({ 
  match, 
  currentTeam, 
  error = null,
  onShowPlayerPopup 
}: MatchDetailsProps) {
  // Early return if match is undefined or null
  if (!match) {
    return <NoMatchSelected />;
  }

  if (error) {
    return <MatchError error={error} />;
  }

  // Extract basic match info
  const openDotaData = match.openDota;
  
  // Extract player data
  const radiantPlayers = openDotaData?.players?.filter((player: OpenDotaFullMatch['players'][0]) => 
    player.player_slot < 128
  ) || [];
  
  // Calculate match duration
  const duration = openDotaData?.duration ? Math.floor(openDotaData.duration / 60) : 0;

  // Extract OpenDota data if available
  const od = openDotaData as OpenDotaFullMatch | undefined;
  const radiantName = od?.radiant_name || "Radiant";
  const direName = od?.dire_name || "Dire";
  const radiantScore = String(od?.radiant_score ?? "?");
  const direScore = String(od?.dire_score ?? "?");
  const result = getDashboardMatchResult(match, currentTeam);
  const teamSide = getTeamSide(match, currentTeam);
  const matchDate = (od?.start_time ? new Date(od.start_time * 1000).toISOString() : "");

  // Extract picks and bans
  const picksBans = od?.picks_bans || [];
  const radiantPicks = picksBans.filter((pb: { is_pick: boolean; team: number }) => pb.is_pick && pb.team === 0).map((pb: { hero_id: number }) => pb.hero_id);
  const radiantBans = picksBans.filter((pb: { is_pick: boolean; team: number }) => !pb.is_pick && pb.team === 0).map((pb: { hero_id: number }) => pb.hero_id);
  const direPicks = picksBans.filter((pb: { is_pick: boolean; team: number }) => pb.is_pick && pb.team === 1).map((pb: { hero_id: number }) => pb.hero_id);
  const direBans = picksBans.filter((pb: { is_pick: boolean; team: number }) => !pb.is_pick && pb.team === 1).map((pb: { hero_id: number }) => pb.hero_id);

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
    <div className="flex flex-col gap-4 relative">
      <MatchSummary 
        radiantScore={radiantScore}
        direScore={direScore}
        result={result}
        teamSide={teamSide}
        fpSpIndicator={fpSpIndicator}
        matchDate={matchDate}
        duration={duration}
      />
      <PicksBansSection 
        radiantName={radiantName}
        direName={direName}
        radiantPicks={radiantPicks}
        radiantBans={radiantBans}
        direPicks={direPicks}
        direBans={direBans}
      />
      <PlayerStatsTable 
        radiantPlayers={radiantPlayers}
        onShowPlayerPopup={onShowPlayerPopup}
      />
    </div>
  );
} 