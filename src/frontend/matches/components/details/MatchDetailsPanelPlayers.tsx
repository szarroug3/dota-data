import { Crown } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Match, PlayerMatchData, Team } from '@/frontend/lib/app-data-types';
import type { TeamMatchParticipation } from '@/frontend/lib/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { getTeamDisplayNames } from '@/frontend/matches/utils/match-name-helpers';

interface MatchDetailsPanelPlayersProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
  allMatches: Match[];
  selectedTeam: Team;
}

type PlayerWithTeam = PlayerMatchData & { team: 'radiant' | 'dire' };
function convertPlayerMatchData(player: PlayerMatchData, team: 'radiant' | 'dire'): PlayerWithTeam {
  return { ...player, team };
}
function getPlayersFromMatch(match?: Match): PlayerWithTeam[] {
  if (!match) return [];
  const radiantPlayers = (match.players.radiant || []).map((player) => convertPlayerMatchData(player, 'radiant'));
  const direPlayers = (match.players.dire || []).map((player) => convertPlayerMatchData(player, 'dire'));
  return [...radiantPlayers, ...direPlayers];
}

const PlayerCard: React.FC<{
  player: PlayerWithTeam;
  teamMatch?: TeamMatchParticipation;
  allMatches: Match[];
}> = ({ player, teamMatch, allMatches }) => {
  const isOnActiveTeamSide = player.team === teamMatch?.side;
  const isHighPerforming =
    (isOnActiveTeamSide && allMatches[0]?.computed?.heroPerformance?.get(player.hero.id)?.isHighPerforming) || false;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <HeroAvatar
          hero={player.hero}
          avatarSize={{ width: 'w-12', height: 'h-12' }}
          isHighPerforming={isHighPerforming}
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-medium truncate @[510px]:block hidden">{player.playerName}</h3>
                {player.role && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0 @[235px]:block hidden">
                    {player.role.role}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate @[235px]:block hidden">
                {player.hero.localizedName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden @[500px]:flex flex-wrap gap-1 flex-1">
                {player.items.map((item, index) => (
                  <Avatar key={index} className="w-6 h-6">
                    <AvatarImage src={item.imageUrl} alt={item.name} className="object-cover object-center" />
                    <AvatarFallback className="text-xs">{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-right @[425px]:block hidden w-20">
                <div className="font-medium">Level {player.stats.level}</div>
                <div className="text-sm text-muted-foreground">
                  {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
                </div>
              </div>
              <div className="text-right @[425px]:hidden w-20 invisible">
                <div className="font-medium">Level 0</div>
                <div className="text-sm text-muted-foreground">0/0/0</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 @[410px]:grid-cols-2 gap-4 text-sm min-h-[60px]">
            <div className="@[300px]:block hidden">
              <div className="flex justify-between">
                <span>GPM:</span>
                <span className="font-medium">{player.stats.gpm}</span>
              </div>
              <div className="flex justify-between">
                <span>XPM:</span>
                <span className="font-medium">{player.stats.xpm}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Worth:</span>
                <span className="font-medium">{player.stats.netWorth.toLocaleString()}</span>
              </div>
            </div>
            <div className="@[410px]:block hidden">
              <div className="flex justify-between">
                <span>Last Hits:</span>
                <span className="font-medium">{player.stats.lastHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Denies:</span>
                <span className="font-medium">{player.stats.denies}</span>
              </div>
              <div className="flex justify-between">
                <span>KDA:</span>
                <span className="font-medium">
                  {((player.stats.kills + player.stats.assists) / Math.max(player.stats.deaths, 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const RadiantPlayers: React.FC<{
  players: PlayerWithTeam[];
  teamName: string;
  isWinner: boolean;
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  allMatches: Match[];
}> = ({ players, teamName, isWinner, match, teamMatch, allMatches }) => {
  const radiantPlayers = players.filter((p) => p.team === 'radiant');
  const sortedRadiantPlayers = match?.draft?.radiantPicks
    ? radiantPlayers.sort((a, b) => {
        const aPickIndex = match.draft.radiantPicks.findIndex(
          (pick) => pick.hero.localizedName === a.hero.localizedName,
        );
        const bPickIndex = match.draft.radiantPicks.findIndex(
          (pick) => pick.hero.localizedName === b.hero.localizedName,
        );
        return aPickIndex - bPickIndex;
      })
    : radiantPlayers;
  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
          <span className="truncate">{teamName}</span>
          {isWinner && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
        </h3>
      </div>
      <div className="space-y-4">
        {sortedRadiantPlayers.map((player, idx) => {
          const keyId = player.accountId && player.accountId !== 0 ? player.accountId : player.hero?.id || idx;
          return <PlayerCard key={`radiant-${keyId}`} player={player} teamMatch={teamMatch} allMatches={allMatches} />;
        })}
      </div>
    </div>
  );
};

const DirePlayers: React.FC<{
  players: PlayerWithTeam[];
  teamName: string;
  isWinner: boolean;
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  allMatches: Match[];
}> = ({ players, teamName, isWinner, match, teamMatch, allMatches }) => {
  const direPlayers = players.filter((p) => p.team === 'dire');
  const sortedDirePlayers = match?.draft?.direPicks
    ? direPlayers.sort((a, b) => {
        const aPickIndex = match.draft.direPicks.findIndex((pick) => pick.hero.localizedName === a.hero.localizedName);
        const bPickIndex = match.draft.direPicks.findIndex((pick) => pick.hero.localizedName === b.hero.localizedName);
        return aPickIndex - bPickIndex;
      })
    : direPlayers;
  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
          <span className="truncate">{teamName}</span>
          {isWinner && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
        </h3>
      </div>
      <div className="space-y-4">
        {sortedDirePlayers.map((player, idx) => {
          const keyId = player.accountId && player.accountId !== 0 ? player.accountId : player.hero?.id || idx;
          return <PlayerCard key={`dire-${keyId}`} player={player} teamMatch={teamMatch} allMatches={allMatches} />;
        })}
      </div>
    </div>
  );
};

export const MatchDetailsPanelPlayers: React.FC<MatchDetailsPanelPlayersProps> = ({
  match,
  teamMatch,
  allMatches = [],
  selectedTeam,
}) => {
  if (!match || !teamMatch) {
    return <div className="text-center text-muted-foreground py-8">No match or team data available</div>;
  }

  const players = getPlayersFromMatch(match);
  const { leftDisplayName, rightDisplayName } = getTeamDisplayNames(teamMatch, selectedTeam, match);
  const isRadiantWin = match?.result === 'radiant';
  const isDireWin = match?.result === 'dire';

  // Determine which team name corresponds to which side
  const userTeamSide = teamMatch.side;
  const radiantName = userTeamSide === 'radiant' ? leftDisplayName : rightDisplayName;
  const direName = userTeamSide === 'radiant' ? rightDisplayName : leftDisplayName;

  return (
    <div className="space-y-6">
      <RadiantPlayers
        players={players.filter((p) => p.team === 'radiant')}
        teamName={radiantName}
        isWinner={isRadiantWin}
        match={match}
        teamMatch={teamMatch}
        allMatches={allMatches}
      />
      <DirePlayers
        players={players.filter((p) => p.team === 'dire')}
        teamName={direName}
        isWinner={isDireWin}
        match={match}
        teamMatch={teamMatch}
        allMatches={allMatches}
      />
    </div>
  );
};
