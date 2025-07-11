

import type { DraftPhase, HeroSuggestion } from '@/hooks/useDraftSuggestions';

import { HeroSuggestionCard } from './HeroSuggestionCard';

interface HeroSuggestionsSectionProps {
  currentDraft: DraftPhase;
  teamSide: 'radiant' | 'dire';
  filteredSuggestions: HeroSuggestion[];
  onHeroAction: (heroId: string) => void;
}

export function HeroSuggestionsSection({
  currentDraft,
  teamSide,
  filteredSuggestions,
  onHeroAction,
}: HeroSuggestionsSectionProps) {
  const isYourTurn = currentDraft.currentTeam === teamSide;

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isYourTurn ? `Your Turn to ${currentDraft.currentTurn.toUpperCase()}` : "Opponent's Turn"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isYourTurn
            ? `Select a hero to ${currentDraft.currentTurn} based on suggestions below.`
            : 'Waiting for opponent to make a selection.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuggestions.map((hero) => (
          <HeroSuggestionCard
            key={hero.heroId}
            hero={hero}
            onSelect={() => onHeroAction(hero.heroId)}
            actionType={currentDraft.currentTurn}
            isYourTurn={isYourTurn}
          />
        ))}
      </div>
    </div>
  );
} 