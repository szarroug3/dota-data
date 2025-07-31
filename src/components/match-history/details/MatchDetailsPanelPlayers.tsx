import { Crown } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import type { Match, PlayerMatchData } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

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

// Helper function to get team display names
function getTeamDisplayNames(match?: Match): { radiantName: string; direName: string } {
  if (!match) {
    return { radiantName: 'Radiant', direName: 'Dire' };
  }
  
  return {
    radiantName: match.radiant.name || 'Radiant',
    direName: match.dire.name || 'Dire'
  };
}

// Convert PlayerMatchData to Player interface
function convertPlayerMatchData(player: PlayerMatchData, team: 'radiant' | 'dire'): Player {
  console.log('SAMREEN', player)
  return {
    id: player.accountId.toString(),
    name: player.playerName,
    hero: player.hero.localizedName,
    team,
    role: player.role,
    heroImageUrl: player.hero.imageUrl,
    level: player.stats.level,
    kills: player.stats.kills,
    deaths: player.stats.deaths,
    assists: player.stats.assists,
    netWorth: player.stats.netWorth,
    lastHits: player.stats.lastHits,
    denies: player.stats.denies,
    gpm: player.stats.gpm,
    xpm: player.stats.xpm,
    items: player.items.map(item => item.name)
  };
}

// Get all players from match data
function getPlayersFromMatch(match?: Match): Player[] {
  if (!match) return [];
  
  const radiantPlayers = match.players.radiant.map(player => convertPlayerMatchData(player, 'radiant'));
  const direPlayers = match.players.dire.map(player => convertPlayerMatchData(player, 'dire'));
  
  return [...radiantPlayers, ...direPlayers];
}

// Extracted component for Player Card
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
            <div className="font-medium">{player.name}</div>
            <p className="text-sm text-muted-foreground">{player.hero}</p>
            {player.role && (
              <p className="text-xs text-muted-foreground capitalize">{player.role}</p>
            )}
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

// Extracted component for Team Statistics
const TeamStatistics: React.FC<{ 
  players: Player[]; 
  radiantName: string; 
  direName: string;
  matchResult: 'radiant' | 'dire';
}> = ({ players, radiantName, direName, matchResult }) => {
  const radiantPlayers = players.filter(p => p.team === 'radiant');
  const direPlayers = players.filter(p => p.team === 'dire');

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">Team Statistics</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            {radiantName}
            {matchResult === 'radiant' && <Crown className="w-4 h-4 text-yellow-500" />}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Kills:</span>
              <span className="font-medium">{radiantPlayers.reduce((sum, p) => sum + p.kills, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Deaths:</span>
              <span className="font-medium">{radiantPlayers.reduce((sum, p) => sum + p.deaths, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average GPM:</span>
              <span className="font-medium">
                {radiantPlayers.length > 0 ? Math.round(radiantPlayers.reduce((sum, p) => sum + p.gpm, 0) / radiantPlayers.length) : 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average XPM:</span>
              <span className="font-medium">
                {radiantPlayers.length > 0 ? Math.round(radiantPlayers.reduce((sum, p) => sum + p.xpm, 0) / radiantPlayers.length) : 0}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            {direName}
            {matchResult === 'dire' && <Crown className="w-4 h-4 text-yellow-500" />}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Kills:</span>
              <span className="font-medium">{direPlayers.reduce((sum, p) => sum + p.kills, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Deaths:</span>
              <span className="font-medium">{direPlayers.reduce((sum, p) => sum + p.deaths, 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average GPM:</span>
              <span className="font-medium">
                {direPlayers.length > 0 ? Math.round(direPlayers.reduce((sum, p) => sum + p.gpm, 0) / direPlayers.length) : 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average XPM:</span>
              <span className="font-medium">
                {direPlayers.length > 0 ? Math.round(direPlayers.reduce((sum, p) => sum + p.xpm, 0) / direPlayers.length) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted component for Radiant Players
const RadiantPlayers: React.FC<{ players: Player[]; teamName: string }> = ({ players, teamName }) => {
  const radiantPlayers = players.filter(p => p.team === 'radiant');

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">{teamName} Players</h3>
      </div>
      <div className="space-y-4">
        {radiantPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

// Extracted component for Dire Players
const DirePlayers: React.FC<{ players: Player[]; teamName: string }> = ({ players, teamName }) => {
  const direPlayers = players.filter(p => p.team === 'dire');

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">{teamName} Players</h3>
      </div>
      <div className="space-y-4">
        {direPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

// Extracted component for Performance Highlights
const PerformanceHighlights: React.FC<{ players: Player[] }> = ({ players }) => {
  if (players.length === 0) return null;

  const mostKills = players.reduce((max, player) => player.kills > max.kills ? player : max, players[0]);
  const mostAssists = players.reduce((max, player) => player.assists > max.assists ? player : max, players[0]);
  const highestGpm = players.reduce((max, player) => player.gpm > max.gpm ? player : max, players[0]);

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">Performance Highlights</h3>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{mostKills.kills}</div>
            <div className="text-sm text-muted-foreground">Most Kills</div>
            <div className="text-xs">{mostKills.hero}</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{mostAssists.assists}</div>
            <div className="text-sm text-muted-foreground">Most Assists</div>
            <div className="text-xs">{mostAssists.hero}</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{highestGpm.gpm}</div>
            <div className="text-sm text-muted-foreground">Highest GPM</div>
            <div className="text-xs">{highestGpm.hero}</div>
          </div>
        </div>
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
    <div className="space-y-4">
      <TeamStatistics players={players} radiantName={radiantName} direName={direName} matchResult={matchResult} />
      <RadiantPlayers players={players} teamName={radiantName} />
      <DirePlayers players={players} teamName={direName} />
      <PerformanceHighlights players={players} />
    </div>
  );
}; 