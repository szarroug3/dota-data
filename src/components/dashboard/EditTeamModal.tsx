import { AlertCircle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getValidationAriaAttributes, validateTeamForm } from '@/utils/validation';

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
  isSubmitting: boolean,
  validation: { isValid: boolean; errors: { teamId?: string; leagueId?: string } }
): ButtonState => {
  // State 1: Validation errors
  if (!validation.isValid) {
    return {
      text: 'Fix Validation Errors',
      disabled: true
    };
  }

  // State 2: One of the fields is not filled out
  if (!newTeamId.trim() || !newLeagueId.trim()) {
    return {
      text: 'Save Changes',
      disabled: true
    };
  }

  // State 3: Team is filled out with a different already existing team data
  if (newTeamId !== currentTeamId || newLeagueId !== currentLeagueId) {
    if (teamExists(newTeamId.trim(), newLeagueId.trim())) {
      return {
        text: 'Team already imported',
        disabled: true
      };
    }
  }

  // State 4: Valid information
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

interface FormFieldInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isValid: boolean;
}

const FormFieldInput: React.FC<FormFieldInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  isValid
}) => {
  const hasError = Boolean(error);
  const ariaAttributes = getValidationAriaAttributes(isValid, hasError, error);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} *</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={`w-full ${hasError ? 'border-destructive focus:border-destructive' : ''}`}
          {...ariaAttributes}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>
      {hasError ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {id === 'teamId' ? 'Find this in Dotabuff team URLs' : 'Find this in Dotabuff league URLs'}
        </p>
      )}
    </div>
  );
};

const ModalForm: React.FC<{
  newTeamId: string;
  newLeagueId: string;
  setNewTeamId: (value: string) => void;
  setNewLeagueId: (value: string) => void;
  error?: string;
  validation: { isValid: boolean; errors: { teamId?: string; leagueId?: string } };
}> = ({ newTeamId, newLeagueId, setNewTeamId, setNewLeagueId, error, validation }) => (
  <div className="space-y-4">
    {error && (
      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )}
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormFieldInput
        id="teamId"
        label="Team ID"
        placeholder="e.g., 9517508"
        value={newTeamId}
        onChange={setNewTeamId}
        error={validation.errors.teamId}
        isValid={!validation.errors.teamId}
      />
      <FormFieldInput
        id="leagueId"
        label="League ID"
        placeholder="e.g., 16435"
        value={newLeagueId}
        onChange={setNewLeagueId}
        error={validation.errors.leagueId}
        isValid={!validation.errors.leagueId}
      />
    </div>
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  onSave: () => void;
  buttonState: ButtonState;
}> = ({ onCancel, onSave, buttonState }) => (
  <div className="flex gap-4 justify-end">
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={buttonState.disabled}
    >
      Cancel
    </Button>
    <Button
      type="button"
      onClick={onSave}
      disabled={buttonState.disabled}
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
  const [error, setError] = useState<string>();

  // Validation state
  const [validation, setValidation] = useState(() => validateTeamForm(newTeamId, newLeagueId));

  // Update validation when values change
  useEffect(() => {
    setValidation(validateTeamForm(newTeamId, newLeagueId));
  }, [newTeamId, newLeagueId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewTeamId(currentTeamId);
      setNewLeagueId(currentLeagueId);
      setError(undefined);
      setIsSubmitting(false);
    }
  }, [isOpen, currentTeamId, currentLeagueId]);

  const buttonState = getButtonState(
    newTeamId,
    newLeagueId,
    currentTeamId,
    currentLeagueId,
    teamExists,
    isSubmitting,
    validation
  );

  const handleSave = async () => {
    if (buttonState.disabled) return;

    try {
      setIsSubmitting(true);
      setError(undefined);
      await onSave(currentTeamId, currentLeagueId, newTeamId, newLeagueId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <ModalHeader onCancel={handleCancel} />
        <CardContent className="space-y-4">
          <ModalForm
            newTeamId={newTeamId}
            newLeagueId={newLeagueId}
            setNewTeamId={setNewTeamId}
            setNewLeagueId={setNewLeagueId}
            error={error}
            validation={validation}
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