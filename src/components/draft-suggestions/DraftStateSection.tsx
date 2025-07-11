

import type { DraftPhase, HeroSuggestion } from '@/hooks/useDraftSuggestions';

import { DraftBoard } from './DraftBoard';

interface DraftStateSectionProps {
  currentDraft: DraftPhase;
  teamSide: 'radiant' | 'dire';
  heroSuggestions: HeroSuggestion[];
  onResetDraft: () => void;
  onTeamSideChange: (side: 'radiant' | 'dire') => void;
}

export function DraftStateSection({
  currentDraft,
  teamSide,
  heroSuggestions,
  onResetDraft,
  onTeamSideChange,
}: DraftStateSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Current Draft
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="team-side-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your team:
            </label>
            <select
              id="team-side-select"
              value={teamSide}
              onChange={(e) => onTeamSideChange(e.target.value as 'radiant' | 'dire')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="radiant">Radiant</option>
              <option value="dire">Dire</option>
            </select>
          </div>
          <button
            onClick={onResetDraft}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
          >
            Reset Draft
          </button>
        </div>
      </div>

      <DraftBoard
        draft={currentDraft}
        teamSide={teamSide}
        heroSuggestions={heroSuggestions}
      />
    </div>
  );
} 