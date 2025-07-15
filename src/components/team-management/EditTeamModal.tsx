import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
    <div>
      <CardTitle>Edit Team</CardTitle>
      <CardDescription>
        Update team and league information
      </CardDescription>
    </div>
    <Button
      variant="ghost"
      size="icon"
      onClick={onCancel}
      aria-label="Close modal"
      className="h-8 w-8"
    >
      <X className="h-4 w-4" />
    </Button>
  </CardHeader>
);

const ModalForm: React.FC<{
  newTeamId: string;
  newLeagueId: string;
  setNewTeamId: (value: string) => void;
  setNewLeagueId: (value: string) => void;
  error?: string;
}> = ({ newTeamId, newLeagueId, setNewTeamId, setNewLeagueId, error }) => (
  <div className="space-y-4">
    {error && (
      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="teamId">Team ID *</Label>
        <Input
          id="teamId"
          type="text"
          value={newTeamId}
          onChange={(e) => setNewTeamId(e.target.value)}
          placeholder="Enter team ID"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="leagueId">League ID *</Label>
        <Input
          id="leagueId"
          type="text"
          value={newLeagueId}
          onChange={(e) => setNewLeagueId(e.target.value)}
          placeholder="Enter league ID"
          required
        />
      </div>
    </div>
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  onSave: () => void;
  buttonState: ButtonState;
}> = ({ onCancel, onSave, buttonState }) => (
  <div className="flex gap-3">
    <Button
      variant="outline"
      onClick={onCancel}
      className="flex-1"
    >
      Cancel
    </Button>
    <Button
      onClick={onSave}
      disabled={buttonState.disabled}
      className="flex-1"
    >
      {buttonState.text}
    </Button>
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader onCancel={handleCancel} />
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}; 