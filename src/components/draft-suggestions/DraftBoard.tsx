import React from 'react';

import type { DraftPhase, HeroSuggestion } from '@/hooks/useDraftSuggestions';

interface DraftBoardProps {
  draft: DraftPhase;
  teamSide: 'radiant' | 'dire';
  heroSuggestions: HeroSuggestion[];
}

export const DraftBoard: React.FC<DraftBoardProps> = ({ draft, teamSide, heroSuggestions }) => {
  const getHeroName = (heroId: string) => {
    return heroSuggestions.find(h => h.heroId === heroId)?.heroName ?? 'Unknown Hero';
  };

  const renderTeamSection = (
    title: string,
    picks: string[],
    bans: string[],
    isYourTeam: boolean
  ) => (
    <div className={`flex-1 ${isYourTeam ? 'bg-primary/10 p-4 rounded-lg' : ''}`}>
      <h4 className="font-semibold text-lg mb-3 text-foreground border-b-2 border-border pb-2">
        {title} {isYourTeam && '(Your Team)'}
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-md mb-2 text-foreground">Picks</h5>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {picks.slice(0, 5).map((heroId, index) => (
              <li key={`${heroId}-${index}`} className="truncate">
                {index + 1}. {getHeroName(heroId)}
              </li>
            ))}
            {picks.length < 5 && Array.from({ length: 5 - picks.length }).map((_, i) => (
              <li key={`pick-empty-${i}`} className="text-muted-foreground">...</li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-medium text-md mb-2 text-foreground">Bans</h5>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {bans.slice(0, 7).map((heroId, index) => (
              <li key={`${heroId}-${index}`} className="truncate">
                {index + 1}. {getHeroName(heroId)}
              </li>
            ))}
            {bans.length < 7 && Array.from({ length: 7 - bans.length }).map((_, i) => (
              <li key={`ban-empty-${i}`} className="text-muted-foreground">...</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const radiantPicks = draft.picks.filter((_, i) => [0, 3, 4, 7, 8].includes(i));
  const direPicks = draft.picks.filter((_, i) => [1, 2, 5, 6, 9].includes(i));

  const radiantBans = draft.bans.filter((_, i) => [0, 2, 4, 10, 12].includes(i));
  const direBans = draft.bans.filter((_, i) => [1, 3, 5, 9, 11].includes(i));

  return (
    <div className="flex space-x-6">
      {renderTeamSection(
        'Radiant',
        radiantPicks,
        radiantBans,
        teamSide === 'radiant'
      )}
      <div className="border-l border-border" />
      {renderTeamSection(
        'Dire',
        direPicks,
        direBans,
        teamSide === 'dire'
      )}
    </div>
  );
}; 