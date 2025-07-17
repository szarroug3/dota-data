import React, { useEffect } from 'react';

import type { Match } from '@/types/contexts/match-context-value';


interface HiddenMatchesModalProps {
  hiddenMatches: Match[];
  onUnhide: (matchId: string) => void;
  onClose: () => void;
}

export const HiddenMatchesModal: React.FC<HiddenMatchesModalProps> = ({ hiddenMatches, onUnhide, onClose }) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-card dark:bg-card rounded-lg shadow-lg p-6 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Hidden Matches</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {hiddenMatches.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No hidden matches.</div>
        ) : (
          <ul className="divide-y divide-border dark:divide-border">
            {hiddenMatches.map(match => (
              <li key={match.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">vs {match.opponent}</div>
                  <div className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()} • {Math.floor(match.duration / 60)}m {match.duration % 60}s</div>
                </div>
                <button
                  onClick={() => onUnhide(match.id)}
                  className="ml-4 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Unhide
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}; 