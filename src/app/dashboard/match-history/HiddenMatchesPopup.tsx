import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration, getHeroImageUrl, getHeroNameSync, getMatchResult, getOpponentName, getScoreWithResult, getTeamSide } from "@/lib/utils";
import type { OpenDotaFullMatch, OpenDotaMatchPlayer } from "@/types/opendota";
import type { Team } from "@/types/team";
import { Eye, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface HiddenMatch {
  id: string;
  openDota: OpenDotaFullMatch;
  [key: string]: unknown;
}

interface PickBan {
  is_pick: boolean;
  hero_id: number;
  team: number;
  order: number;
}

interface HiddenMatchesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenMatches: HiddenMatch[];
  currentTeam: Team;
  preferredSite: string;
  onUnhideMatch: (matchId: string) => void;
}

// Extracted component for pick order calculation
function getPickOrder(match: HiddenMatch) {
  if (!match.openDota?.picks_bans) return null;
  const firstPick = match.openDota.picks_bans.find((pb: PickBan) => pb.is_pick);
  if (!firstPick) return null;
  return firstPick.team === 0 ? "FP" : "SP";
}

// Extracted component for hero picks calculation
function getHeroPicks(match: HiddenMatch) {
  if (!match.openDota?.players) return { radiant: [], dire: [] };
  const radiantHeroes = match.openDota.players
    .filter((p: OpenDotaMatchPlayer) => p.isRadiant)
    .map((p: OpenDotaMatchPlayer) => getHeroNameSync(p.hero_id as number))
    .slice(0, 5);
  const direHeroes = match.openDota.players
    .filter((p: OpenDotaMatchPlayer) => !p.isRadiant)
    .map((p: OpenDotaMatchPlayer) => getHeroNameSync(p.hero_id as number))
    .slice(0, 5);
  return { radiant: radiantHeroes, dire: direHeroes };
}

// Extracted component for match URL and logo
function getMatchUrlAndLogo(match: HiddenMatch, preferredSite: string) {
  let matchUrl = "";
  let matchLogo = null;
  
  if (preferredSite === "dotabuff") {
    const matchId = match.openDota?.match_id || match.id;
    matchUrl = `https://www.dotabuff.com/matches/${matchId}`;
    matchLogo = (
      <img
        src="https://www.dotabuff.com/favicon.ico"
        alt="Dotabuff"
        className="w-5 h-5"
        style={{ display: "inline" }}
      />
    );
  } else if (match.openDota?.match_id) {
    matchUrl = `https://www.opendota.com/matches/${match.openDota.match_id}`;
    matchLogo = (
      <img
        src="https://www.opendota.com/assets/images/icons/icon-72x72.png"
        alt="OpenDota"
        className="w-5 h-5"
        style={{ display: "inline" }}
      />
    );
  }
  
  return { matchUrl, matchLogo };
}

// Extracted component for hero pick images
function HeroPicksDisplay({ heroPicks }: { heroPicks: { radiant: string[]; dire: string[] } }) {
  if (heroPicks.radiant.length === 0) return null;

  return (
    <div className="flex flex-col items-end ml-12 min-w-[56px] relative mt-2">
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

// Extracted component for match badges
function MatchBadges({ 
  match, 
  currentTeam, 
  teamSide 
}: { 
  match: HiddenMatch; 
  currentTeam: Team; 
  teamSide: string | null; 
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <Badge
        variant="static"
        className={
          getMatchResult(match.openDota, currentTeam) === "W"
            ? "bg-green-600 text-white px-2 py-0.5 text-xs font-bold rounded"
            : "bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded"
        }
      >
        {getMatchResult(match.openDota, currentTeam)}
      </Badge>
      {teamSide && (
        <Badge
          variant="static"
          className={`px-2 py-0.5 text-xs font-bold rounded ${teamSide === 'Radiant' ? 'bg-blue-500 text-white' : teamSide === 'Dire' ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground'}`}
        >
          {teamSide === 'Radiant' ? 'R' : teamSide === 'Dire' ? 'D' : '?'}
        </Badge>
      )}
      {/* FP/SP badge */}
      {getPickOrder(match) && (
        <Badge
          variant="static"
          className={`px-2 py-0.5 text-xs font-bold rounded ${getPickOrder(match) === 'FP' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}
        >
          {getPickOrder(match)}
        </Badge>
      )}
      <span className="text-xs text-muted-foreground">
        {getScoreWithResult(match.openDota, currentTeam)}
      </span>
      <span className="text-xs text-muted-foreground">
        • {formatDuration(match.openDota?.duration || 0)}
      </span>
    </div>
  );
}

// Extracted component for match actions
function MatchActions({ 
  match, 
  onUnhideMatch, 
  matchUrl, 
  matchLogo 
}: { 
  match: HiddenMatch; 
  onUnhideMatch: (matchId: string) => void; 
  matchUrl: string; 
  matchLogo: React.ReactNode | null; 
}) {
  return (
    <div className="flex flex-row gap-1 items-center ml-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={e => { e.stopPropagation(); onUnhideMatch(match.id); }}
        title="Show match"
        className="p-1"
      >
        <Eye className="w-4 h-4" />
      </Button>
      {matchUrl && matchLogo && (
        <a
          href={matchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1"
          title="View match on preferred site"
          onClick={e => e.stopPropagation()}
        >
          {matchLogo}
        </a>
      )}
    </div>
  );
}

// Extracted component for individual hidden match
function HiddenMatchItem({ 
  match, 
  currentTeam, 
  preferredSite, 
  onUnhideMatch 
}: { 
  match: HiddenMatch; 
  currentTeam: Team; 
  preferredSite: string; 
  onUnhideMatch: (matchId: string) => void; 
}) {
  const teamSide = getTeamSide(match, currentTeam);
  const heroPicks = getHeroPicks(match);
  const { matchUrl, matchLogo } = getMatchUrlAndLogo(match, preferredSite);

  return (
    <div
      key={match.id || (match.date as string) + (match.opponent as string || "unknown")}
      className="p-4 border-b last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors relative"
      onClick={() => onUnhideMatch(match.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">
              vs {getOpponentName(match, currentTeam)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(typeof match.date === 'string' ? match.date : "")}
          </div>
          <MatchBadges match={match} currentTeam={currentTeam} teamSide={teamSide} />
        </div>
        <MatchActions 
          match={match} 
          onUnhideMatch={onUnhideMatch} 
          matchUrl={matchUrl} 
          matchLogo={matchLogo} 
        />
      </div>
      <HeroPicksDisplay heroPicks={heroPicks} />
    </div>
  );
}

// Extracted component for popup header
function PopupHeader({ 
  hiddenMatchesCount, 
  onClose 
}: { 
  hiddenMatchesCount: number; 
  onClose: () => void; 
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="text-lg font-semibold">Hidden Matches ({hiddenMatchesCount})</h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Extracted component for popup content
function PopupContent({ 
  hiddenMatches, 
  currentTeam, 
  preferredSite, 
  onUnhideMatch 
}: { 
  hiddenMatches: HiddenMatch[]; 
  currentTeam: Team; 
  preferredSite: string; 
  onUnhideMatch: (matchId: string) => void; 
}) {
  return (
    <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
      {hiddenMatches.length > 0 ? (
        hiddenMatches.map((match: HiddenMatch) => (
          <HiddenMatchItem
            key={match.id}
            match={match}
            currentTeam={currentTeam}
            preferredSite={preferredSite}
            onUnhideMatch={onUnhideMatch}
          />
        ))
      ) : (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No hidden matches
        </div>
      )}
    </div>
  );
}

export default function HiddenMatchesPopup({
  isOpen,
  onClose,
  hiddenMatches,
  currentTeam,
  preferredSite,
  onUnhideMatch,
}: HiddenMatchesPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div ref={popupRef} className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <PopupHeader hiddenMatchesCount={hiddenMatches.length} onClose={onClose} />
        <PopupContent 
          hiddenMatches={hiddenMatches}
          currentTeam={currentTeam}
          preferredSite={preferredSite}
          onUnhideMatch={onUnhideMatch}
        />
      </div>
    </div>
  );
} 