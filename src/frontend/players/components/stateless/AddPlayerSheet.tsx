import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getValidationAriaAttributes } from '@/utils/validation';

interface AddPlayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Controlled input
  playerId: string;
  onChangePlayerId: (value: string) => void;
  // Submission
  onSubmit: () => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string;
  // Validation (controlled)
  validationError?: string;
  isDuplicate?: boolean;
  isValid: boolean; // overall form validity (non-empty and valid pattern)
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
          type="text"
          id={id}
          name={id}
          placeholder={placeholder}
          required
          disabled={disabled}
          value={value}
          onChange={e => onChange(e.target.value)}
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
          {helpText}
        </p>
      )}
    </FormField>
  );
};

function AddPlayerFields({
  playerId,
  setPlayerId,
  isSubmitting,
  isDisabled,
  handleSubmit,
  shouldShowPlayerError,
  isValid
}: {
  playerId: string;
  setPlayerId: (v: string) => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  shouldShowPlayerError?: string;
  isValid: boolean;
}) {
  return (
    <div className="grid gap-4" onKeyDown={(e) => {
      if (e.key === 'Enter' && !isDisabled) {
        e.preventDefault();
        void handleSubmit(e);
      }
    }}>
      <FormFieldInput
        id="player-id"
        label="Player ID"
        placeholder="e.g., 101753478"
        value={playerId}
        onChange={setPlayerId}
        disabled={isSubmitting}
        helpText="Find this in Dotabuff or OpenDota player URLs"
        error={shouldShowPlayerError}
        isValid={isValid}
      />
    </div>
  );
}

export function AddPlayerSheet({
  isOpen,
  onClose,
  playerId,
  onChangePlayerId,
  onSubmit,
  isSubmitting = false,
  error,
  validationError,
  isDuplicate = false,
  isValid
}: AddPlayerSheetProps): React.ReactElement {
  const isDisabled = isSubmitting || !isValid || isDuplicate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDisabled) {
      await onSubmit();
    }
  }

  function getButtonText(): string {
    if (playerId.trim() === '') return 'Add Player';
    if (isDuplicate) return 'Player Already Added';
    if (!isValid) return 'Invalid Player ID';
    return 'Add Player';
  }

  const shouldShowPlayerError = playerId.trim().length > 0 ? validationError : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Player</SheetTitle>
          <SheetDescription>
            Add a player to track their performance and statistics
          </SheetDescription>
        </SheetHeader>
        
        <AddPlayerSheetBody
          playerId={playerId}
          setPlayerId={onChangePlayerId}
          isSubmitting={isSubmitting}
          isDisabled={isDisabled}
          handleSubmit={handleSubmit}
          shouldShowPlayerError={shouldShowPlayerError}
          isValid={playerId.trim().length === 0 || isValid}
          error={error}
        />
        
        <SheetFooter>
          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full"
            onClick={handleSubmit}
          >
            {getButtonText()}
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

function AddPlayerSheetBody({
  playerId,
  setPlayerId,
  isSubmitting,
  isDisabled,
  handleSubmit,
  shouldShowPlayerError,
  isValid,
  error
}: {
  playerId: string;
  setPlayerId: (v: string) => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  shouldShowPlayerError?: string;
  isValid: boolean;
  error?: string;
}) {
  return (
    <div className="grid flex-1 auto-rows-min gap-6 px-4">
      <Form onSubmit={handleSubmit}>
        <AddPlayerFields
          playerId={playerId}
          setPlayerId={setPlayerId}
          isSubmitting={isSubmitting}
          isDisabled={isDisabled}
          handleSubmit={handleSubmit}
          shouldShowPlayerError={shouldShowPlayerError}
          isValid={isValid}
        />
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm border rounded-md bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Form>
    </div>
  );
}
