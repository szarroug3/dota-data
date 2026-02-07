import { AlertCircle } from 'lucide-react';
import React from 'react';

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
import { getValidationAriaAttributes } from '@/utils/validation';

type TeamFormValidation = { isValid: boolean; errors: { teamId?: string; leagueId?: string } };

interface EditTeamSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeamId: string;
  currentLeagueId: string;
  newTeamId: string;
  newLeagueId: string;
  onChangeTeamId: (value: string) => void;
  onChangeLeagueId: (value: string) => void;
  onSubmit: (payload: {
    current: { teamId: string; leagueId: string };
    next: { teamId: string; leagueId: string };
  }) => Promise<void> | void;
  teamExists: (teamId: string, leagueId: string) => boolean;
  validation: TeamFormValidation;
  isSubmitting?: boolean;
  error?: string;
}

// Removed unused getButtonState and ButtonState as button state is provided via props

interface FormFieldInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const FormFieldInput: React.FC<FormFieldInputProps> = ({ id, label, placeholder, value, onChange, error }) => {
  const hasError = Boolean(error);
  const errorId = `${id}-error`;
  const ariaAttributes = getValidationAriaAttributes(hasError, errorId);

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
        <p className="text-xs text-destructive mt-1" id={errorId} tabIndex={0}>
          {error ?? ''}
        </p>
      ) : null}
      {!hasError && (
        <p className="text-xs text-muted-foreground">
          {id === 'teamId' ? (
            <>
              Find this in{' '}
              <a
                href="https://dotabuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                Dotabuff
              </a>{' '}
              team URLs
            </>
          ) : (
            <>
              Find this in{' '}
              <a
                href="https://dotabuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                Dotabuff
              </a>{' '}
              league URLs
            </>
          )}
        </p>
      )}
    </FormField>
  );
};

const getEditTeamButtonText = (isDuplicate: boolean, isSubmitting: boolean) => {
  if (isDuplicate) return 'Team already imported';
  if (isSubmitting) return 'Saving...';
  return 'Save Changes';
};

const getEditTeamSheetState = ({
  currentTeamId,
  currentLeagueId,
  newTeamId,
  newLeagueId,
  validation,
  teamExists,
  isSubmitting,
}: {
  currentTeamId: string;
  currentLeagueId: string;
  newTeamId: string;
  newLeagueId: string;
  validation: TeamFormValidation;
  teamExists: (teamId: string, leagueId: string) => boolean;
  isSubmitting: boolean;
}) => {
  const trimmedTeamId = newTeamId.trim();
  const trimmedLeagueId = newLeagueId.trim();
  const trimmedCurrentTeamId = currentTeamId.trim();
  const trimmedCurrentLeagueId = currentLeagueId.trim();
  const teamIdError = trimmedTeamId.length > 0 ? validation.errors.teamId : undefined;
  const leagueIdError = trimmedLeagueId.length > 0 ? validation.errors.leagueId : undefined;
  const isUnchanged = trimmedTeamId === trimmedCurrentTeamId && trimmedLeagueId === trimmedCurrentLeagueId;
  const isDuplicate = !isUnchanged && teamExists(trimmedTeamId, trimmedLeagueId);
  const hasRequiredInputs = trimmedTeamId.length > 0 && trimmedLeagueId.length > 0;
  const buttonDisabled = isSubmitting || !hasRequiredInputs || !validation.isValid || isDuplicate;
  const buttonText = getEditTeamButtonText(isDuplicate, isSubmitting);

  return { trimmedTeamId, trimmedLeagueId, teamIdError, leagueIdError, buttonDisabled, buttonText };
};

export const EditTeamSheet: React.FC<EditTeamSheetProps> = ({
  isOpen,
  onClose,
  currentTeamId,
  currentLeagueId,
  newTeamId,
  newLeagueId,
  onChangeTeamId,
  onChangeLeagueId,
  onSubmit,
  teamExists,
  validation,
  isSubmitting = false,
  error,
}) => {
  const { trimmedTeamId, trimmedLeagueId, teamIdError, leagueIdError, buttonDisabled, buttonText } =
    getEditTeamSheetState({
      currentTeamId,
      currentLeagueId,
      newTeamId,
      newLeagueId,
      validation,
      teamExists,
      isSubmitting,
    });

  const handleSubmit = async () => {
    if (buttonDisabled) return;
    await onSubmit({
      current: { teamId: currentTeamId.trim(), leagueId: currentLeagueId.trim() },
      next: { teamId: trimmedTeamId, leagueId: trimmedLeagueId },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="p-6">
        <SheetHeader>
          <SheetTitle>Edit Team</SheetTitle>
          <SheetDescription>Update team and league information</SheetDescription>
        </SheetHeader>

        <EditTeamSheetContent
          error={error}
          newTeamId={newTeamId}
          setNewTeamId={onChangeTeamId}
          newLeagueId={newLeagueId}
          setNewLeagueId={onChangeLeagueId}
          teamIdError={teamIdError}
          leagueIdError={leagueIdError}
          onSubmit={handleSubmit}
          buttonDisabled={buttonDisabled}
        />

        <SheetFooter className="flex flex-col gap-2 w-full">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={buttonDisabled}
            aria-busy={isSubmitting}
            aria-label={`Save changes for team ${currentTeamId} in league ${currentLeagueId}`}
            className="w-full"
          >
            {buttonText}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={buttonDisabled} className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

interface EditTeamSheetContentProps {
  error?: string;
  newTeamId: string;
  setNewTeamId: (value: string) => void;
  newLeagueId: string;
  setNewLeagueId: (value: string) => void;
  teamIdError?: string;
  leagueIdError?: string;
  onSubmit?: () => Promise<void> | void;
  buttonDisabled?: boolean;
}

const EditTeamSheetContent: React.FC<EditTeamSheetContentProps> = ({
  error,
  newTeamId,
  setNewTeamId,
  newLeagueId,
  setNewLeagueId,
  teamIdError,
  leagueIdError,
  onSubmit,
  buttonDisabled,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!buttonDisabled) {
        onSubmit?.();
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
            error={teamIdError}
          />
          <FormFieldInput
            id="leagueId"
            label="League ID"
            placeholder="e.g., 16435"
            value={newLeagueId}
            onChange={setNewLeagueId}
            error={leagueIdError}
          />
        </div>
      </div>
    </div>
  );
};
