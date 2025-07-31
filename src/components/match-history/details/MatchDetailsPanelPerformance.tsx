import { Crown } from 'lucide-react';
import React from 'react';

import { Separator } from '@/components/ui/separator';
import { Match } from '@/types/contexts/match-context-value';
import { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelPerformanceProps {
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
    items: player.items.map(item => item.localizedName),
    heroImageUrl: player.hero.imageUrl,
  };
}

function getPlayersFromMatch(match?: Match): Player[] {
  if (!match) return [];

  const radiantPlayers = (match.players.radiant || []).map(player => convertPlayerMatchData(player, 'radiant'));
  const direPlayers = (match.players.dire || []).map(player => convertPlayerMatchData(player, 'dire'));

  return [...radiantPlayers, ...direPlayers];
}

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

export const MatchDetailsPanelPerformance: React.FC<MatchDetailsPanelPerformanceProps> = ({ match, teamMatch: _teamMatch, className }) => {
  const players = getPlayersFromMatch(match);
  const { radiantName, direName } = getTeamDisplayNames(match);
  const matchResult = match?.result || 'radiant';

  if (!match || players.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No match data available
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <TeamStatistics players={players} radiantName={radiantName} direName={direName} matchResult={matchResult} />
      
      <Separator />
      
      <PerformanceHighlights players={players} />
    </div>
  );
}; 