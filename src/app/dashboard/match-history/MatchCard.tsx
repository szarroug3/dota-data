import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration, getHeroImageUrl, getHeroNameSync, getDashboardMatchResult, getOpponentName, getDashboardScoreWithResult, getTeamSide } from "@/lib/utils";
import type { Team } from "@/types/team";
import { EyeOff, RefreshCw } from "lucide-react";
import type { Match } from "./match-utils";

// Custom icon components from sidebar
const DotabuffIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" fill="none" />
    <text
      x="12"
      y="13.5"
      textAnchor="middle"
      fontSize="11"
      fill="currentColor"
      fontFamily="Arial, sans-serif"
      dominantBaseline="middle"
      fontWeight="normal"
    >
      D
    </text>
  </svg>
);

const OpenDotaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Outer circle (O) - explicit theme color, drawn first */}
    <circle cx="10" cy="10" r="7" stroke="#000" className="dark:stroke-white" fill="none" strokeWidth={1.5} />
    {/* D's vertical line (taller than the O) - green */}
    <line x1="10" y1="1" x2="10" y2="19" stroke="#22c55e" strokeWidth={1.5} />
    {/* D's bowl (same height as vertical line) - green */}
    <path d="M10 1 a9 9 0 0 1 0 18" stroke="#22c55e" fill="none" strokeWidth={1.5} />
  </svg>
);

interface MatchCardProps {
  match: Match;
  currentTeam: Team;
  preferredSite: string;
  isSelected: boolean;
  onSelect: (matchId: string) => void;
  onHide: (matchId: string) => void;
  teamSide?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

function getHeroPicks(match: Match, _currentTeam: Team) {
  if (!match.openDota?.players) return { radiant: [], dire: [] };
  const radiantHeroes = match.openDota.players
    .filter((p) => p.isRadiant === true)
    .map((p) => getHeroNameSync((p as any).hero_id))
    .slice(0, 5);
  const direHeroes = match.openDota.players
    .filter((p) => p.isRadiant === false)
    .map((p) => getHeroNameSync((p as any).hero_id))
    .slice(0, 5);
  return { radiant: radiantHeroes, dire: direHeroes };
}

function getPickOrder(match: Match, currentTeam: Team) {
  if (!match.openDota?.picks_bans) return null;
  const firstPick = match.openDota.picks_bans.find((pb: { is_pick: boolean }) => pb.is_pick);
  if (!firstPick) return null;
  const ourTeam = getTeamSide(match, currentTeam) === "Radiant" ? 0 : 1;
  return firstPick.team === ourTeam ? "FP" : "SP";
}

function HeroPicksDisplay({ heroPicks }: { heroPicks: { radiant: string[]; dire: string[] } }) {
  if (heroPicks.radiant.length === 0) return null;
  return (
    <div className="flex flex-col items-end ml-12 min-w-[56px] relative">
      <div className="flex flex-col items-end relative">
        <div className="flex items-center gap-1 mb-0.5 relative">
          {heroPicks.radiant.map((hero: string, index: number) => (
            <img
              key={index}
              src={getHeroImageUrl(hero)}
              alt={hero}
              className="w-5 h-5 rounded object-cover bg-gray-200 dark:bg-gray-700"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/window.svg";
              }}
              title={hero}
            />
          ))}
        </div>
        <div className="w-full flex justify-center text-[10px] text-muted-foreground my-0.5">vs</div>
        <div className="flex items-center gap-1 mt-0.5">
          {heroPicks.dire.map((hero: string, index: number) => (
            <img
              key={index}
              src={getHeroImageUrl(hero)}
              alt={hero}
              className="w-5 h-5 rounded object-cover bg-gray-200 dark:bg-gray-700"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/window.svg";
              }}
              title={hero}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCardActions({ matchUrl, matchLogo, onHide, matchId, onRefresh, isRefreshing }: { matchUrl: string; matchLogo: React.ReactNode; onHide: (id: string) => void; matchId: string; onRefresh?: () => void; isRefreshing: boolean }) {
  return (
    <div className="flex flex-row gap-1 items-center ml-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onHide(matchId);
        }}
        title="Hide match"
        className="p-1"
      >
        <EyeOff className="w-4 h-4" />
      </Button>
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          title="Refresh match data"
          disabled={isRefreshing}
          className="p-1"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
      {matchUrl && matchLogo && (
        <a
          href={matchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1"
          title="View match on preferred site"
          onClick={(e) => e.stopPropagation()}
        >
          {matchLogo}
        </a>
      )}
    </div>
  );
}

export default function MatchCard({
  match,
  currentTeam,
  preferredSite,
  isSelected,
  onSelect,
  onHide,
  teamSide,
  isRefreshing = false,
  onRefresh,
}: MatchCardProps) {
  let matchUrl = "";
  let matchLogo = null;
  if (preferredSite === "dotabuff") {
    const matchId = match.openDota?.match_id || match.id;
    matchUrl = `https://www.dotabuff.com/matches/${matchId}`;
    matchLogo = <DotabuffIcon className="w-5 h-5 text-red-500" />;
  } else if (match.openDota?.match_id) {
    matchUrl = `https://www.opendota.com/matches/${match.openDota.match_id}`;
    matchLogo = <OpenDotaIcon className="w-5 h-5" />;
  }

  const heroPicks = getHeroPicks(match, currentTeam);
  const pickOrder = getPickOrder(match, currentTeam);

  // Use openDota date/duration if available, otherwise fallback
  const matchDate = (match.openDota && (match.openDota as any).start_time)
    ? new Date((match.openDota as any).start_time * 1000).toISOString()
    : (match as any).date || "";
  const matchDuration = match.openDota?.duration ?? (match as any).duration ?? 0;

  return (
    <div
      className={`p-4 border-b cursor-pointer hover:bg-muted/30 transition-colors relative ${isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 !border-l-transparent"} ${isRefreshing ? "opacity-75" : ""}`}
      onClick={() => onSelect(match.id!)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">
              vs {getOpponentName(match, currentTeam)}
            </div>
            {isRefreshing && (
              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(matchDate)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="static"
              className={
                getDashboardMatchResult(match, currentTeam) === "W"
                  ? "bg-green-600 text-white px-2 py-0.5 text-xs font-bold rounded"
                  : "bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded"
              }
            >
              {getDashboardMatchResult(match, currentTeam)}
            </Badge>
            {/* R/D badge */}
            {teamSide && (
              <Badge
                variant="static"
                className={`px-2 py-0.5 text-xs font-bold rounded ${teamSide === 'Radiant' ? 'bg-blue-500 text-white' : teamSide === 'Dire' ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {teamSide === 'Radiant' ? 'R' : teamSide === 'Dire' ? 'D' : '?'}
              </Badge>
            )}
            {/* FP/SP badge */}
            {pickOrder && (
              <Badge
                variant="static"
                className={`px-2 py-0.5 text-xs font-bold rounded ${pickOrder === 'FP' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}
              >
                {pickOrder}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {getDashboardScoreWithResult(match, currentTeam)}
            </span>
            <span className="text-xs text-muted-foreground">
              •{" "}
              {formatDuration(matchDuration)}
            </span>
          </div>
        </div>
        <HeroPicksDisplay heroPicks={heroPicks} />
        <MatchCardActions matchUrl={matchUrl} matchLogo={matchLogo} onHide={onHide} matchId={match.id!} onRefresh={onRefresh} isRefreshing={isRefreshing} />
      </div>
    </div>
  );
} 