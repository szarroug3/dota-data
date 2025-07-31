import { Crown } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Match, PlayerMatchData } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelPlayersProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
}

interface Player {
  id: string;
  name: string;
  hero: string;
  team: 'radiant' | 'dire';
  role?: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  netWorth: number;
  lastHits: number;
  denies: number;
  items: string[];
  heroImageUrl: string;
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

function convertPlayerMatchData(player: PlayerMatchData, team: 'radiant' | 'dire'): Player {
  return {
    id: player.accountId.toString(),
    name: player.playerName,
    hero: player.hero.localizedName,
    team,
    role: player.role,
    level: player.stats.level,
    kills: player.stats.kills,
    deaths: player.stats.deaths,
    assists: player.stats.assists,
    gpm: player.stats.gpm,
    xpm: player.stats.xpm,
    netWorth: player.stats.netWorth,
    lastHits: player.stats.lastHits,
    denies: player.stats.denies,
    items: player.items.map((item: any) => item.localizedName),
    heroImageUrl: player.hero.imageUrl,
  };
}

function getPlayersFromMatch(match?: Match): Player[] {
  if (!match) return [];

  const radiantPlayers = (match.players.radiant || []).map(player => convertPlayerMatchData(player, 'radiant'));
  const direPlayers = (match.players.dire || []).map(player => convertPlayerMatchData(player, 'dire'));

  return [...radiantPlayers, ...direPlayers];
}

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => (
  <Card className="p-4">
    <div className="flex items-start gap-4">
      <Avatar className="w-12 h-12">
        <AvatarImage src={player.heroImageUrl} alt={player.hero} />
        <AvatarFallback>{player.hero.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{player.name}</h3>
              {player.role && (
                <Badge variant="secondary" className="text-xs">
                  {player.role}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{player.hero}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-1">
              {player.items.map((item, index) => {
                // Convert item name to URL format (lowercase, replace spaces with hyphens, remove apostrophes)
                const itemKey = item.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                const itemImageUrl = `https://dotabuff.com/assets/items/${itemKey}.jpg`;
                
                return (
                  <Avatar key={index} className="w-6 h-6">
                    <AvatarImage 
                      src={itemImageUrl} 
                      alt={item}
                      className="object-cover object-center"
                    />
                    <AvatarFallback className="text-xs">
                      {item.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">Level {player.level}</div>
              <div className="text-sm text-muted-foreground">
                {player.kills}/{player.deaths}/{player.assists}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex justify-between">
              <span>GPM:</span>
              <span className="font-medium">{player.gpm}</span>
            </div>
            <div className="flex justify-between">
              <span>XPM:</span>
              <span className="font-medium">{player.xpm}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Worth:</span>
              <span className="font-medium">{player.netWorth.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <span>Last Hits:</span>
              <span className="font-medium">{player.lastHits}</span>
            </div>
            <div className="flex justify-between">
              <span>Denies:</span>
              <span className="font-medium">{player.denies}</span>
            </div>
            <div className="flex justify-between">
              <span>KDA:</span>
              <span className="font-medium">
                {((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// Extracted component for Radiant Players
const RadiantPlayers: React.FC<{ 
  players: Player[]; 
  teamName: string; 
  isWinner: boolean;
  match?: Match;
}> = ({ players, teamName, isWinner, match }) => {
  const radiantPlayers = players.filter(p => p.team === 'radiant');
  
  // Sort players by pick order if draft data is available
  const sortedRadiantPlayers = match?.draft?.radiantPicks 
    ? radiantPlayers.sort((a, b) => {
        const aPickIndex = match.draft.radiantPicks.findIndex(pick => pick.hero.localizedName === a.hero);
        const bPickIndex = match.draft.radiantPicks.findIndex(pick => pick.hero.localizedName === b.hero);
        return aPickIndex - bPickIndex;
      })
    : radiantPlayers;

  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {teamName}
          {isWinner && <Crown className="w-4 h-4 text-yellow-500" />}
        </h3>
      </div>
      <div className="space-y-4">
        {sortedRadiantPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

// Extracted component for Dire Players
const DirePlayers: React.FC<{ 
  players: Player[]; 
  teamName: string; 
  isWinner: boolean;
  match?: Match;
}> = ({ players, teamName, isWinner, match }) => {
  const direPlayers = players.filter(p => p.team === 'dire');
  
  // Sort players by pick order if draft data is available
  const sortedDirePlayers = match?.draft?.direPicks 
    ? direPlayers.sort((a, b) => {
        const aPickIndex = match.draft.direPicks.findIndex(pick => pick.hero.localizedName === a.hero);
        const bPickIndex = match.draft.direPicks.findIndex(pick => pick.hero.localizedName === b.hero);
        return aPickIndex - bPickIndex;
      })
    : direPlayers;

  return (
    <div>
      <div className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {teamName}
          {isWinner && <Crown className="w-4 h-4 text-yellow-500" />}
        </h3>
      </div>
      <div className="space-y-4">
        {sortedDirePlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

export const MatchDetailsPanelPlayers: React.FC<MatchDetailsPanelPlayersProps> = ({ match }) => {
  const players = getPlayersFromMatch(match);
  const { radiantName, direName } = getTeamDisplayNames(match);
  const matchResult = match?.result || 'radiant';

  if (!match || players.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No player data available</div>
          <div className="text-sm">Select a match to view player details.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RadiantPlayers 
        players={players} 
        teamName={radiantName} 
        isWinner={matchResult === 'radiant'}
        match={match}
      />
      <DirePlayers 
        players={players} 
        teamName={direName} 
        isWinner={matchResult === 'dire'}
        match={match}
      />
    </div>
  );
}; 