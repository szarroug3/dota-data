

import React from 'react';

import type { HeroSuggestion } from '@/hooks/useDraftSuggestions';

interface HeroSuggestionsSectionProps {
  suggestions: HeroSuggestion[];
}

export const HeroSuggestionsSection: React.FC<HeroSuggestionsSectionProps> = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          Recommended Heroes
        </h3>
        <p className="text-muted-foreground">
          Based on your team&apos;s performance and current meta trends.
        </p>
      </div>
      {/* Implementation would go here */}
    </div>
  );
}; 