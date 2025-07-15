import React from 'react';

import type { DetailedMatch } from './useMatchDetails';

interface MatchHeaderProps {
  match: DetailedMatch;
  onClose?: () => void;
  formatDuration: (seconds: number) => string;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match, onClose, formatDuration }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-sm border border-border dark:border-border p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-bold text-foreground dark:text-foreground">
          Match #{match.id}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground dark:text-muted-foreground">Duration:</span>
          <span className="font-mono text-sm font-medium text-foreground dark:text-foreground">
            {formatDuration(match.duration)}
          </span>
        </div>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
          aria-label="Close match details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-success">{match.radiantScore}</div>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Radiant</div>
      </div>
      
      <div className="text-center">
        <div className={`text-2xl font-bold ${match.winner === 'radiant' ? 'text-success' : 'text-destructive'}`}>
          {match.winner === 'radiant' ? 'Radiant Victory' : 'Dire Victory'}
        </div>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Winner</div>
      </div>
      
      <div className="text-center">
        <div className="text-3xl font-bold text-destructive">{match.direScore}</div>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Dire</div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-muted-foreground dark:text-muted-foreground">Game Mode:</span>
        <span className="ml-2 font-medium text-foreground dark:text-foreground">{match.gameMode}</span>
      </div>
      <div>
        <span className="text-muted-foreground dark:text-muted-foreground">Patch:</span>
        <span className="ml-2 font-medium text-foreground dark:text-foreground">{match.patch}</span>
      </div>
      <div>
        <span className="text-muted-foreground dark:text-muted-foreground">Total Kills:</span>
        <span className="ml-2 font-medium text-foreground dark:text-foreground">{match.totalKills}</span>
      </div>
      <div>
        <span className="text-muted-foreground dark:text-muted-foreground">Roshan Kills:</span>
        <span className="ml-2 font-medium text-foreground dark:text-foreground">{match.objectives.roshan}</span>
      </div>
    </div>
  </div>
); 