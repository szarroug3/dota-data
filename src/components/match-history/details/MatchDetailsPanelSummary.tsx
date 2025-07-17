import React from 'react';

import { Badge } from '@/components/ui/badge';
import type { MatchDetails } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelSummaryProps {
  match: MatchDetails | null;
  className?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const MatchDetailsPanelSummary: React.FC<MatchDetailsPanelSummaryProps> = ({ match, className = '' }) => {
  if (!match) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No match selected</div>
          <div className="text-sm">Select a match to see details.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Match Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Match Information</h3>
          <Badge variant={match.result === 'win' ? 'success' : 'default'}>
            {match.result === 'win' ? 'Victory' : 'Defeat'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Date:</span>
            <div className="text-muted-foreground">{formatDate(match.date)}</div>
          </div>
          <div>
            <span className="font-medium">Duration:</span>
            <div className="text-muted-foreground">{formatDuration(match.duration)}</div>
          </div>
          <div>
            <span className="font-medium">Team Side:</span>
            <div className="text-muted-foreground capitalize">{match.teamSide}</div>
          </div>
          <div>
            <span className="font-medium">Game Mode:</span>
            <div className="text-muted-foreground">{match.gameMode}</div>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Match Score</h3>
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold">{match.radiantTeam}</div>
            <div className="text-2xl font-bold text-green-600">{match.radiantScore}</div>
          </div>
          <div className="text-muted-foreground">vs</div>
          <div className="text-center">
            <div className="text-lg font-bold">{match.direTeam}</div>
            <div className="text-2xl font-bold text-red-600">{match.direScore}</div>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Players ({match.radiantPlayers.length + match.direPlayers.length})</h3>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-green-600 mb-2">Radiant ({match.radiantPlayers.length})</div>
            <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded">
              {match.radiantPlayers.map(player => player.heroName).join(', ')}
            </div>
          </div>
          <div>
            <div className="font-medium text-red-600 mb-2">Dire ({match.direPlayers.length})</div>
            <div className="text-sm text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded">
              {match.direPlayers.map(player => player.heroName).join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Draft */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Draft Summary</h3>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-green-600 mb-2">Radiant Picks ({match.radiantPicks.length})</div>
            <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded">
              {match.radiantPicks.length > 0 ? match.radiantPicks.join(', ') : 'No picks recorded'}
            </div>
          </div>
          <div>
            <div className="font-medium text-red-600 mb-2">Dire Picks ({match.direPicks.length})</div>
            <div className="text-sm text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded">
              {match.direPicks.length > 0 ? match.direPicks.join(', ') : 'No picks recorded'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 