import React from 'react';

interface AddTeamFormProps {
  teamId: string;
  leagueId: string;
  onTeamIdChange: (value: string) => void;
  onLeagueIdChange: (value: string) => void;
  onAddTeam: (teamId: string, leagueId: string) => Promise<void>;
  teamExists: (teamId: string, leagueId: string) => boolean;
  isSubmitting?: boolean;
  onReset?: () => void;
}

interface FormFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  helpText: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  helpText
}) => (
  <div>
    <label 
      htmlFor={id} 
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {label} *
    </label>
    <input
      type="text"
      id={id}
      name={id}
      placeholder={placeholder}
      required
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 placeholder-gray-500 dark:placeholder-gray-400
                 disabled:opacity-50 disabled:cursor-not-allowed"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      {helpText}
    </p>
  </div>
);

interface FormActionsProps {
  isDisabled: boolean;
  isSubmitting: boolean;
  onReset?: () => void;
  getButtonText: () => string;
}

const FormActions: React.FC<FormActionsProps> = ({
  isDisabled,
  isSubmitting,
  onReset,
  getButtonText
}) => (
  <div className="flex justify-end space-x-3">
    {onReset && (
      <button
        type="button"
        onClick={onReset}
        disabled={isSubmitting}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                   text-gray-700 dark:text-gray-300 font-medium rounded-md 
                   transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reset
      </button>
    )}
    <button
      type="submit"
      disabled={isDisabled}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md 
                 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {getButtonText()}
    </button>
  </div>
);

export const AddTeamForm: React.FC<AddTeamFormProps> = ({ 
  teamId, 
  leagueId, 
  onTeamIdChange, 
  onLeagueIdChange, 
  onAddTeam, 
  teamExists,
  isSubmitting = false,
  onReset
}) => {
  const isDisabled = !teamId.trim() || !leagueId.trim() || teamExists(teamId, leagueId) || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      await onAddTeam(teamId, leagueId);
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return 'Adding Team...';
    if (teamExists(teamId, leagueId)) return 'Team Already Imported';
    return 'Add Team';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Add New Team
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="team-id"
            label="Team ID"
            placeholder="e.g., 9517508"
            value={teamId}
            onChange={onTeamIdChange}
            disabled={isSubmitting}
            helpText="Find this in Dotabuff team URLs: https://www.dotabuff.com/esports/teams/9517508"
          />
          <FormField
            id="league-id"
            label="League ID"
            placeholder="e.g., 16435"
            value={leagueId}
            onChange={onLeagueIdChange}
            disabled={isSubmitting}
            helpText="Find this in Dotabuff league URLs: https://www.dotabuff.com/esports/leagues/16435"
          />
        </div>
        <FormActions
          isDisabled={isDisabled}
          isSubmitting={isSubmitting}
          onReset={onReset}
          getButtonText={getButtonText}
        />
      </form>
    </div>
  );
}; 