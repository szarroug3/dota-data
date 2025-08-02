import { AlertCircle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getValidationAriaAttributes, validateTeamForm } from '@/utils/validation';

interface EditTeamSheetProps {
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

  // State 3: Valid information (allow submission even with validation errors)
  return {
    text: isSubmitting ? 'Saving...' : 'Save Changes',
    disabled: isSubmitting
  };
};

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
    <FormField>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} *
      </Label>
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
        <p className="text-xs text-destructive mt-1" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {id === 'teamId' ? 'Find this in Dotabuff team URLs' : 'Find this in Dotabuff league URLs'}
        </p>
      )}
    </FormField>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useEditTeamSheetState = (
  isOpen: boolean,
  currentTeamId: string,
  currentLeagueId: string
) => {
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

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewTeamId(currentTeamId);
      setNewLeagueId(currentLeagueId);
      setError(undefined);
      setIsSubmitting(false);
    }
  }, [isOpen, currentTeamId, currentLeagueId]);

  return {
    newTeamId,
    setNewTeamId,
    newLeagueId,
    setNewLeagueId,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    validation
  };
};

export const EditTeamSheet: React.FC<EditTeamSheetProps> = ({
  isOpen,
  onClose,
  currentTeamId,
  currentLeagueId,
  onSave,
  teamExists
}) => {
  const {
    newTeamId,
    setNewTeamId,
    newLeagueId,
    setNewLeagueId,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    validation
  } = useEditTeamSheetState(isOpen, currentTeamId, currentLeagueId);

  const buttonState = getButtonState(
    newTeamId,
    newLeagueId,
    currentTeamId,
    currentLeagueId,
    teamExists,
    isSubmitting
  );

  const handleSave = useCallback(async () => {
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
  }, [buttonState.disabled, setIsSubmitting, setError, onSave, currentTeamId, currentLeagueId, newTeamId, newLeagueId, onClose]);

  // Only show errors for fields that have been touched (have content)
  const shouldShowTeamError = newTeamId.trim().length > 0 ? validation.errors.teamId : undefined;
  const shouldShowLeagueError = newLeagueId.trim().length > 0 ? validation.errors.leagueId : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="p-6">
        <SheetHeader>
          <SheetTitle>Edit Team</SheetTitle>
          <SheetDescription>
            Update team and league information
          </SheetDescription>
        </SheetHeader>
        
        <EditTeamSheetContent
          error={error}
          newTeamId={newTeamId}
          setNewTeamId={setNewTeamId}
          newLeagueId={newLeagueId}
          setNewLeagueId={setNewLeagueId}
          shouldShowTeamError={shouldShowTeamError}
          shouldShowLeagueError={shouldShowLeagueError}
        />
        
        <SheetFooter className="flex flex-col gap-2 w-full">
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={buttonState.disabled}
            className="w-full"
            data-save-team-button
          >
            {buttonState.text}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={buttonState.disabled} className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ============================================================================
// SHEET CONTENT COMPONENT
// ============================================================================

interface EditTeamSheetContentProps {
  error?: string;
  newTeamId: string;
  setNewTeamId: (value: string) => void;
  newLeagueId: string;
  setNewLeagueId: (value: string) => void;
  shouldShowTeamError?: string;
  shouldShowLeagueError?: string;
}

const EditTeamSheetContent: React.FC<EditTeamSheetContentProps> = ({
  error,
  newTeamId,
  setNewTeamId,
  newLeagueId,
  setNewLeagueId,
  shouldShowTeamError,
  shouldShowLeagueError
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Find the save button and trigger it
      const saveButton = document.querySelector('[data-save-team-button]') as HTMLButtonElement;
      if (saveButton && !saveButton.disabled) {
        saveButton.click();
      }
    }
  };

  return (
    <div className="grid flex-1 auto-rows-min gap-6 py-4">
      <div className="grid gap-4" onKeyDown={handleKeyDown}>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        <FormFieldInput
          id="teamId"
          label="Team ID"
          placeholder="e.g., 9517508"
          value={newTeamId}
          onChange={setNewTeamId}
          error={shouldShowTeamError}
          isValid={!shouldShowTeamError}
        />
        <FormFieldInput
          id="leagueId"
          label="League ID"
          placeholder="e.g., 16435"
          value={newLeagueId}
          onChange={setNewLeagueId}
          error={shouldShowLeagueError}
          isValid={!shouldShowLeagueError}
        />
      </div>
    </div>
  </div>
  );
}; 