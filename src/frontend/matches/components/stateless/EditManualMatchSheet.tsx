'use client';

import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface EditManualMatchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Controlled form state
  matchIdString: string;
  teamSide: '' | 'radiant' | 'dire';
  onChangeMatchId: (value: string) => void;
  onChangeTeamSide: (value: '' | 'radiant' | 'dire') => void;
  // Submission
  onSubmit: () => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string;
  // Validation (controlled)
  validationError?: string;
  duplicateError?: string;
  isFormValid: boolean;
}

interface FormFieldInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  helpText: string;
  error?: string;
  isValid: boolean;
}

const FormFieldInput: React.FC<FormFieldInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  helpText,
  error,
  isValid,
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
          type="text"
          id={id}
          name={id}
          placeholder={placeholder}
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${hasError ? 'border-destructive focus:border-destructive' : ''}`}
          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
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
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </FormField>
  );
};

function getButtonText(
  validationIsValid: boolean,
  teamSide: '' | 'radiant' | 'dire',
  isSubmitting: boolean,
  duplicateError?: string,
): string {
  if (duplicateError) return 'Match Already Exists';
  if (!validationIsValid) return 'Invalid Match ID';
  if (teamSide === '') return 'Select Team Side';
  if (isSubmitting) return 'Updating...';
  return 'Update Match';
}

function EditManualMatchForm({
  matchIdString,
  setMatchIdString,
  teamSide,
  setTeamSide,
  isSubmitting,
  isDisabled,
  handleSubmit,
  validationError,
  duplicateError,
}: {
  matchIdString: string;
  setMatchIdString: (v: string) => void;
  teamSide: '' | 'radiant' | 'dire';
  setTeamSide: (v: '' | 'radiant' | 'dire') => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  validationError?: string;
  duplicateError?: string;
}) {
  const shouldShowMatchError = matchIdString.trim().length > 0 ? validationError : undefined;
  const combinedError = duplicateError || shouldShowMatchError;

  return (
    <div
      className="grid gap-4"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDisabled) {
          e.preventDefault();
          void handleSubmit(e);
        }
      }}
    >
      <FormFieldInput
        id="match-id"
        label="Match ID"
        placeholder="e.g., 1234567890"
        value={matchIdString}
        onChange={setMatchIdString}
        disabled={isSubmitting}
        helpText="Find this in Dotabuff match URLs"
        error={combinedError}
        isValid={!validationError && !duplicateError}
      />

      <FormField>
        <Label htmlFor="team-side" className="text-sm font-medium">
          Team Side *
        </Label>
        <Select
          value={teamSide}
          onValueChange={(value: 'radiant' | 'dire' | '') => setTeamSide(value)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="radiant">Radiant</SelectItem>
            <SelectItem value="dire">Dire</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Which side was the team on?</p>
      </FormField>
    </div>
  );
}

export function EditManualMatchSheet({
  isOpen,
  onClose,
  matchIdString,
  teamSide,
  onChangeMatchId,
  onChangeTeamSide,
  onSubmit,
  isSubmitting = false,
  error: _error,
  validationError,
  duplicateError,
  isFormValid,
}: EditManualMatchSheetProps): React.ReactElement {
  const isDisabled = isSubmitting || !isFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      await onSubmit();
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Match</SheetTitle>
          <SheetDescription>Update the match ID or team side for this match</SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <EditManualMatchForm
            matchIdString={matchIdString}
            setMatchIdString={onChangeMatchId}
            teamSide={teamSide}
            setTeamSide={onChangeTeamSide}
            isSubmitting={isSubmitting}
            isDisabled={isDisabled}
            handleSubmit={handleSubmit}
            validationError={validationError}
            duplicateError={duplicateError}
          />
        </div>

        <SheetFooter className="flex flex-col gap-2 w-full">
          <Button type="button" onClick={handleSubmit} disabled={isDisabled} className="w-full">
            {getButtonText(!validationError, teamSide, isSubmitting, duplicateError)}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
