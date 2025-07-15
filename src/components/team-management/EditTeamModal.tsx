import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeamId: string;
  currentLeagueId: string;
  onSave: (oldTeamId: string, oldLeagueId: string, newTeamId: string, newLeagueId: string) => Promise<void>;
  teamExists: (teamId: string, leagueId: string) => boolean;
}

interface ButtonState {
  text: string;
  disabled: boolean;
}

const getButtonState = (
  newTeamId: string,
  newLeagueId: string,
  currentTeamId: string,
  currentLeagueId: string,
  teamExists: (teamId: string, leagueId: string) => boolean,
  isSubmitting: boolean
): ButtonState => {
  // State 1: One of the fields is not filled out
  if (!newTeamId.trim() || !newLeagueId.trim()) {
    return {
      text: 'Save Changes',
      disabled: true
    };
  }

  // State 2: Team is filled out with a different already existing team data
  if (newTeamId !== currentTeamId || newLeagueId !== currentLeagueId) {
    if (teamExists(newTeamId.trim(), newLeagueId.trim())) {
      return {
        text: 'Team already imported',
        disabled: true
      };
    }
  }

  // State 3: Valid information
  return {
    text: isSubmitting ? 'Saving...' : 'Save Changes',
    disabled: isSubmitting
  };
};

const ModalHeader: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
      Edit Team
    </h2>
    <button
      onClick={onCancel}
      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      aria-label="Close modal"
      type="button"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

const ModalForm: React.FC<{
  newTeamId: string;
  newLeagueId: string;
  setNewTeamId: (value: string) => void;
  setNewLeagueId: (value: string) => void;
  error?: string;
}> = ({ newTeamId, newLeagueId, setNewTeamId, setNewLeagueId, error }) => (
  <div className="p-6 space-y-4">
    {error && (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    )}
    
    <div>
      <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Team ID
      </label>
      <input
        id="teamId"
        type="text"
        value={newTeamId}
        onChange={(e) => setNewTeamId(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter team ID"
      />
    </div>

    <div>
      <label htmlFor="leagueId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        League ID
      </label>
      <input
        id="leagueId"
        type="text"
        value={newLeagueId}
        onChange={(e) => setNewLeagueId(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter league ID"
      />
    </div>
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  onSave: () => void;
  buttonState: ButtonState;
}> = ({ onCancel, onSave, buttonState }) => (
  <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
    <button
      onClick={onCancel}
      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                 border border-gray-300 dark:border-gray-600 rounded-md
                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      type="button"
    >
      Cancel
    </button>
    <button
      onClick={onSave}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md
                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      disabled={buttonState.disabled}
      type="button"
    >
      {buttonState.text}
    </button>
  </div>
);

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  currentTeamId,
  currentLeagueId,
  onSave,
  teamExists
}) => {
  const [newTeamId, setNewTeamId] = useState(currentTeamId);
  const [newLeagueId, setNewLeagueId] = useState(currentLeagueId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Update form state when currentTeamId or currentLeagueId changes
  useEffect(() => {
    setNewTeamId(currentTeamId);
    setNewLeagueId(currentLeagueId);
    setError(undefined);
  }, [currentTeamId, currentLeagueId]);

  const buttonState = getButtonState(newTeamId, newLeagueId, currentTeamId, currentLeagueId, teamExists, isSubmitting);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(undefined);
      await onSave(currentTeamId, currentLeagueId, newTeamId.trim(), newLeagueId.trim());
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewTeamId(currentTeamId);
    setNewLeagueId(currentLeagueId);
    setError(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <ModalHeader onCancel={handleCancel} />
        <ModalForm
          newTeamId={newTeamId}
          newLeagueId={newLeagueId}
          setNewTeamId={setNewTeamId}
          setNewLeagueId={setNewLeagueId}
          error={error}
        />
        <ModalActions
          onCancel={handleCancel}
          onSave={handleSave}
          buttonState={buttonState}
        />
      </div>
    </div>
  );
}; 