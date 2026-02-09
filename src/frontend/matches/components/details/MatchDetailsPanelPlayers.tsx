import { Crown } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAppData } from '@/frontend/contexts/app-data-context';
import { Match, PlayerMatchData } from '@/frontend/lib/app-data/app-data-types';
import type { TeamMatchParticipation } from '@/frontend/lib/app-data/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';

interface MatchDetailsPanelPlayersProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
  hiddenMatchIds: Set<number>;
  selectedTeamId: string;
}

function getTeamDisplayNames(match?: Match): { radiantName: string; direName: string } {
  if (!match) {
    return { radiantName: 'Radiant', direName: 'Dire' };
  }
  const radiantName = match.radiant?.name || 'Radiant';
  const direName = match.dire?.name || 'Dire';
  return { radiantName, direName };
}

type PlayerWithTeam = PlayerMatchData & { team: 'radiant' | 'dire' };

const PlayerCard: React.FC<{
  player: PlayerWithTeam;
  teamMatch?: TeamMatchParticipation;
  selectedTeamId: string;
  hiddenMatchIds: Set<number>;
}> = ({ player, teamMatch, selectedTeamId, hiddenMatchIds }) => {
  const appData = useAppData();
  const isOnActiveTeamSide = player.team === teamMatch?.side;
  const isHighPerforming =
    isOnActiveTeamSide && appData.isHighPerformingHero(player.hero.id, selectedTeamId, hiddenMatchIds);
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
                  <Badge variant="secondary" className="text-xs shrink-0 @[235px]:block hidden">
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
                <span className="font-medium">{appData.getMatchPlayerKda(player).toFixed(2)}</span>
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
  teamMatch?: TeamMatchParticipation;
  selectedTeamId: string;
  hiddenMatchIds: Set<number>;
}> = ({ players, teamName, isWinner, teamMatch, selectedTeamId, hiddenMatchIds }) => {
  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
          <span className="truncate">{teamName}</span>
          {isWinner && <Crown className="w-4 h-4 text-yellow-500 shrink-0" />}
        </h3>
      </div>
      <div className="space-y-4">
        {players.map((player, idx) => {
          const keyId = player.accountId && player.accountId !== 0 ? player.accountId : player.hero?.id || idx;
          return (
            <PlayerCard
              key={`radiant-${keyId}`}
              player={player}
              teamMatch={teamMatch}
              selectedTeamId={selectedTeamId}
              hiddenMatchIds={hiddenMatchIds}
            />
          );
        })}
      </div>
    </div>
  );
};

const DirePlayers: React.FC<{
  players: PlayerWithTeam[];
  teamName: string;
  isWinner: boolean;
  teamMatch?: TeamMatchParticipation;
  selectedTeamId: string;
  hiddenMatchIds: Set<number>;
}> = ({ players, teamName, isWinner, teamMatch, selectedTeamId, hiddenMatchIds }) => {
  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 min-w-0">
          <span className="truncate">{teamName}</span>
          {isWinner && <Crown className="w-4 h-4 text-yellow-500 shrink-0" />}
        </h3>
      </div>
      <div className="space-y-4">
        {players.map((player, idx) => {
          const keyId = player.accountId && player.accountId !== 0 ? player.accountId : player.hero?.id || idx;
          return (
            <PlayerCard
              key={`dire-${keyId}`}
              player={player}
              teamMatch={teamMatch}
              selectedTeamId={selectedTeamId}
              hiddenMatchIds={hiddenMatchIds}
            />
          );
        })}
      </div>
    </div>
  );
};

export const MatchDetailsPanelPlayers: React.FC<MatchDetailsPanelPlayersProps> = ({
  match,
  teamMatch,
  hiddenMatchIds = new Set(),
  selectedTeamId,
}) => {
  const appData = useAppData();
  const radiantPlayers: PlayerWithTeam[] = (match ? appData.getPlayersSortedByDraft(match.id, 'radiant') : []).map(
    (p) => ({ ...p, team: 'radiant' as const }),
  );
  const direPlayers: PlayerWithTeam[] = (match ? appData.getPlayersSortedByDraft(match.id, 'dire') : []).map((p) => ({
    ...p,
    team: 'dire' as const,
  }));
  const { radiantName, direName } = getTeamDisplayNames(match);
  const isRadiantWin = match?.result === 'radiant';
  const isDireWin = match?.result === 'dire';
  return (
    <div className="space-y-6">
      <RadiantPlayers
        players={radiantPlayers}
        teamName={radiantName}
        isWinner={isRadiantWin}
        teamMatch={teamMatch}
        selectedTeamId={selectedTeamId}
        hiddenMatchIds={hiddenMatchIds}
      />
      <DirePlayers
        players={direPlayers}
        teamName={direName}
        isWinner={isDireWin}
        teamMatch={teamMatch}
        selectedTeamId={selectedTeamId}
        hiddenMatchIds={hiddenMatchIds}
      />
    </div>
  );
};
