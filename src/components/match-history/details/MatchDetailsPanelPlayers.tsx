import { Crown } from 'lucide-react';
import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Hero } from '@/types/contexts/constants-context-value';
import { Match, PlayerMatchData } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelPlayersProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}



function getTeamDisplayNames(match?: Match): { radiantName: string; direName: string } {
  if (!match) {
    return { radiantName: 'Radiant', direName: 'Dire' };
  }

  // Try to get team names from the match data
  const radiantName = match.radiant?.name || 'Radiant';
  const direName = match.dire?.name || 'Dire';

  return { radiantName, direName };
}

type PlayerWithTeam = PlayerMatchData & { team: 'radiant' | 'dire' };

function convertPlayerMatchData(player: PlayerMatchData, team: 'radiant' | 'dire'): PlayerWithTeam {
  return {
    ...player,
    team
  };
}

function getPlayersFromMatch(match?: Match): PlayerWithTeam[] {
  if (!match) return [];

  const radiantPlayers = (match.players.radiant || []).map(player => convertPlayerMatchData(player, 'radiant'));
  const direPlayers = (match.players.dire || []).map(player => convertPlayerMatchData(player, 'dire'));

  return [...radiantPlayers, ...direPlayers];
}

// Helper function to determine if a hero is high-performing
const isHighPerformingHero = (hero: Hero, allMatches: Match[], teamMatches: Record<number, TeamMatchParticipation>, hiddenMatchIds: Set<number>): boolean => {
  const heroStats: { count: number; wins: number; totalGames: number } = { count: 0, wins: 0, totalGames: 0 };
  
  // Aggregate hero statistics from unhidden matches
  allMatches.forEach(matchData => {
    // Skip manually hidden matches
    if (hiddenMatchIds.has(matchData.id)) {
      return;
    }
    
    const matchTeamData = teamMatches[matchData.id];
    if (!matchTeamData?.side) {
      return;
    }
    
    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';
    
    teamPlayers.forEach(player => {
      if (player.hero?.id === hero.id) {
        heroStats.count++;
        heroStats.totalGames++;
        if (isWin) {
          heroStats.wins++;
        }
      }
    });
  });
  
  // High-performing criteria: 5+ games, 60%+ win rate
  return heroStats.count >= 5 && (heroStats.wins / heroStats.count) >= 0.6;
};

const PlayerCard: React.FC<{ 
  player: PlayerWithTeam;
  teamMatch?: TeamMatchParticipation;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ player, teamMatch, allMatches = [], teamMatches = {}, hiddenMatchIds = new Set() }) => {
  // Determine if this hero is on the active team's side AND is high-performing
  const isOnActiveTeamSide = player.team === teamMatch?.side;
  const isHighPerforming = isOnActiveTeamSide && isHighPerformingHero(player.hero, allMatches, teamMatches, hiddenMatchIds);
  
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
                    {player.role}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate @[235px]:block hidden">{player.hero.localizedName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-1 flex-1 @[500px]:flex hidden">
                {player.items.map((item, index) => (
                  <Avatar key={index} className="w-6 h-6">
                    <AvatarImage 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="object-cover object-center"
                    />
                    <AvatarFallback className="text-xs">
                      {item.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
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
                <div className="text-sm text-muted-foreground">
                  0/0/0
                </div>
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

// Extracted component for Radiant Players
const RadiantPlayers: React.FC<{ 
  players: PlayerWithTeam[]; 
  teamName: string; 
  isWinner: boolean;
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ players, teamName, isWinner, match, teamMatch, allMatches, teamMatches, hiddenMatchIds }) => {
  const radiantPlayers = players.filter(p => p.team === 'radiant');
  
  // Sort players by pick order if draft data is available
  const sortedRadiantPlayers = match?.draft?.radiantPicks 
    ? radiantPlayers.sort((a, b) => {
        const aPickIndex = match.draft.radiantPicks.findIndex(pick => pick.hero.localizedName === a.hero.localizedName);
        const bPickIndex = match.draft.radiantPicks.findIndex(pick => pick.hero.localizedName === b.hero.localizedName);
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
        {sortedRadiantPlayers.map((player) => (
          <PlayerCard key={player.accountId} player={player} teamMatch={teamMatch} allMatches={allMatches} teamMatches={teamMatches} hiddenMatchIds={hiddenMatchIds} />
        ))}
      </div>
    </div>
  );
};

// Extracted component for Dire Players
const DirePlayers: React.FC<{ 
  players: PlayerWithTeam[]; 
  teamName: string; 
  isWinner: boolean;
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  allMatches?: Match[];
  teamMatches?: Record<number, TeamMatchParticipation>;
  hiddenMatchIds?: Set<number>;
}> = ({ players, teamName, isWinner, match, teamMatch, allMatches, teamMatches, hiddenMatchIds }) => {
  const direPlayers = players.filter(p => p.team === 'dire');
  
  // Sort players by pick order if draft data is available
  const sortedDirePlayers = match?.draft?.direPicks 
    ? direPlayers.sort((a, b) => {
        const aPickIndex = match.draft.direPicks.findIndex(pick => pick.hero.localizedName === a.hero.localizedName);
        const bPickIndex = match.draft.direPicks.findIndex(pick => pick.hero.localizedName === b.hero.localizedName);
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
        {sortedDirePlayers.map((player) => (
          <PlayerCard key={player.accountId} player={player} teamMatch={teamMatch} allMatches={allMatches} teamMatches={teamMatches} hiddenMatchIds={hiddenMatchIds} />
        ))}
      </div>
    </div>
  );
};

export const MatchDetailsPanelPlayers: React.FC<MatchDetailsPanelPlayersProps> = ({ match, teamMatch, allMatches = [], teamMatches = {}, hiddenMatchIds = new Set() }) => {
  const players = getPlayersFromMatch(match);
  const { radiantName, direName } = getTeamDisplayNames(match);
  const isRadiantWin = match?.result === 'radiant';
  const isDireWin = match?.result === 'dire';

  return (
    <div className="space-y-6">
      {/* Radiant Team */}
      <RadiantPlayers 
        players={players.filter(p => p.team === 'radiant')} 
        teamName={radiantName} 
        isWinner={isRadiantWin}
        match={match}
        teamMatch={teamMatch}
        allMatches={allMatches}
        teamMatches={teamMatches}
        hiddenMatchIds={hiddenMatchIds}
      />
      
      {/* Dire Team */}
      <DirePlayers 
        players={players.filter(p => p.team === 'dire')} 
        teamName={direName} 
        isWinner={isDireWin}
        match={match}
        teamMatch={teamMatch}
        allMatches={allMatches}
        teamMatches={teamMatches}
        hiddenMatchIds={hiddenMatchIds}
      />
    </div>
  );
}; 