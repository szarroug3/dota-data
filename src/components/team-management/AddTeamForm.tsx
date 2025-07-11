import React, { useState } from 'react';

import { useTeamData } from '@/hooks/use-team-data';
import type { Team } from '@/types/contexts/team-context-value';

function validateForm(teamId: string, leagueId: string): string | null {
  if (!teamId.trim() || !leagueId.trim()) {
    return 'Please enter both Team ID and League ID';
  }
  return null;
}

function isTeamAlreadyAdded(teams: Team[], teamId: string, leagueId: string): boolean {
  return teams?.some(team => team.id === teamId.trim() && team.leagueId === leagueId.trim());
}

const TeamFormFields: React.FC<{
  teamId: string;
  leagueId: string;
  setTeamId: (id: string) => void;
  setLeagueId: (id: string) => void;
  isSubmitting: boolean;
}> = ({ teamId, leagueId, setTeamId, setLeagueId, isSubmitting }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Team ID
      </label>
      <input
        id="teamId"
        type="text"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
        placeholder="Enter Team ID"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        disabled={isSubmitting}
      />
    </div>
    <div>
      <label htmlFor="leagueId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        League ID
      </label>
      <input
        id="leagueId"
        type="text"
        value={leagueId}
        onChange={(e) => setLeagueId(e.target.value)}
        placeholder="Enter League ID"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        disabled={isSubmitting}
      />
    </div>
  </div>
);

const ErrorMessage: React.FC<{ error: string | null }> = ({ error }) => (
  error ? (
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-md p-3">
      <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
    </div>
  ) : null
);

const DuplicateMessage: React.FC<{ alreadyAdded: boolean }> = ({ alreadyAdded }) => (
  alreadyAdded ? (
    <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
      <p className="text-sm text-yellow-600 dark:text-yellow-300">Team Already Added</p>
    </div>
  ) : null
);

export const AddTeamForm: React.FC = () => {
  const { teams, addTeam } = useTeamData();
  const [teamId, setTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(teamId, leagueId);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await addTeam(teamId.trim(), leagueId.trim());
      setTeamId('');
      setLeagueId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const alreadyAdded = isTeamAlreadyAdded(teams, teamId, leagueId);
  const isFormValid = teamId.trim() && leagueId.trim() && !alreadyAdded;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Team</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TeamFormFields
          teamId={teamId}
          leagueId={leagueId}
          setTeamId={setTeamId}
          setLeagueId={setLeagueId}
          isSubmitting={isSubmitting}
        />
        <ErrorMessage error={error} />
        <DuplicateMessage alreadyAdded={alreadyAdded} />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : isFormValid
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
            }`}
          >
            {isSubmitting ? 'Adding Team...' : 'Add Team'}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {teams?.length || 0} team{teams?.length !== 1 ? 's' : ''} added
          </p>
        </div>
      </form>
    </div>
  );
}; 