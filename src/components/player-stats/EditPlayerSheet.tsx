'use client';

import { AlertCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Player } from '@/types/contexts/player-context-value';
import { getValidationAriaAttributes, validatePlayerId } from '@/utils/validation';

interface EditPlayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  existingPlayers: Player[];
  currentPlayerId: number;
  onEditPlayer: (newPlayerId: string) => Promise<void>;
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

export const EditPlayerSheet: React.FC<EditPlayerSheetProps> = ({
  isOpen,
  onClose,
  existingPlayers,
  currentPlayerId,
  onEditPlayer
}) => {
  const [playerId, setPlayerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Prefill when opening
  useEffect(() => {
    if (isOpen) {
      setPlayerId(String(currentPlayerId));
      setError(undefined);
      setIsSubmitting(false);
    }
  }, [isOpen, currentPlayerId]);

  // Validation state
  const [validation, setValidation] = useState(() => validatePlayerId(playerId));

  useEffect(() => {
    if (playerId.trim().length > 0) {
      setValidation(validatePlayerId(playerId));
    } else {
      setValidation({ isValid: true });
    }
  }, [playerId]);

  const isDuplicate = useMemo(() => {
    const nextId = parseInt(playerId, 10);
    if (!Number.isFinite(nextId)) return false;
    if (nextId === currentPlayerId) return false;
    return existingPlayers.some(p => p.profile.profile.account_id === nextId);
  }, [playerId, currentPlayerId, existingPlayers]);

  const isFormValid = playerId.trim() !== '' && validation.isValid && !isDuplicate;
  const isDisabled = isSubmitting || !isFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    try {
      // Optimistic: close immediately; background edit handled by parent
      onClose();
      await onEditPlayer(playerId);
    } catch (err) {
      // No-op: sheet is closed; log only
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (playerId.trim() === '') return 'Update Player';
    if (isDuplicate) return 'Player Already Added';
    if (!validation.isValid) return 'Invalid Player ID';
    return isSubmitting ? 'Updating...' : 'Update Player';
  };

  const shouldShowPlayerError = playerId.trim().length > 0 ? validation.error : undefined;
  const combinedError = isDuplicate ? 'Player already exists in the list' : shouldShowPlayerError;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Player</SheetTitle>
          <SheetDescription>
            Update the Account ID for this player
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <Form onSubmit={handleSubmit}>
            <div className="grid gap-4" onKeyDown={(e) => {
              if (e.key === 'Enter' && !isDisabled) {
                e.preventDefault();
                handleSubmit(e);
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
                error={combinedError}
                isValid={playerId.trim().length === 0 || (validation.isValid && !isDuplicate)}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm border rounded-md bg-destructive/10 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Form>
        </div>

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
};


