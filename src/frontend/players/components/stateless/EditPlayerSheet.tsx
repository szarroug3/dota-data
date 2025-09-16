'use client';

import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
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

interface EditPlayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Controlled input
  playerId: string;
  onChangePlayerId: (value: string) => void;
  // Submission
  onSubmit: () => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string;
  // Validation
  validationError?: string;
  isDuplicate?: boolean;
  isValid: boolean;
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

function getButtonText(playerId: string, isDuplicate: boolean, isValid: boolean, isSubmitting: boolean): string {
  if (playerId.trim() === '') return 'Update Player';
  if (isDuplicate) return 'Player Already Added';
  if (!isValid) return 'Invalid Player ID';
  return isSubmitting ? 'Updating...' : 'Update Player';
}

function EditPlayerForm({
  playerId,
  setPlayerId,
  isSubmitting,
  isDisabled,
  handleSubmit,
  combinedError,
  isFieldValid,
}: {
  playerId: string;
  setPlayerId: (value: string) => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  combinedError?: string;
  isFieldValid: boolean;
}) {
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
        id="player-id"
        label="Player ID"
        placeholder="e.g., 101753478"
        value={playerId}
        onChange={setPlayerId}
        disabled={isSubmitting}
        helpText="Find this in Dotabuff or OpenDota player URLs"
        error={combinedError}
        isValid={isFieldValid}
      />
    </div>
  );
}

export function EditPlayerSheet({
  isOpen,
  onClose,
  playerId,
  onChangePlayerId,
  onSubmit,
  isSubmitting = false,
  error,
  validationError,
  isDuplicate = false,
  isValid,
}: EditPlayerSheetProps): React.ReactElement {
  const isDisabled = isSubmitting || !isValid || isDuplicate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    await onSubmit();
  };

  const shouldShowPlayerError = playerId.trim().length > 0 ? validationError : undefined;
  const combinedError = isDuplicate ? 'Player already exists in the list' : shouldShowPlayerError;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Player</SheetTitle>
          <SheetDescription>Update the Account ID for this player</SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <Form onSubmit={handleSubmit}>
            <EditPlayerForm
              playerId={playerId}
              setPlayerId={onChangePlayerId}
              isSubmitting={isSubmitting}
              isDisabled={isDisabled}
              handleSubmit={handleSubmit}
              combinedError={combinedError}
              isFieldValid={playerId.trim().length === 0 || (isValid && !isDuplicate)}
            />
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm border rounded-md bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Form>
        </div>

        <SheetFooter>
          <Button type="submit" disabled={isDisabled} className="w-full" onClick={handleSubmit}>
            {getButtonText(playerId, isDuplicate, isValid, isSubmitting)}
          </Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
