import { AlertCircle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Player } from '@/types/contexts/player-context-value';
import { getValidationAriaAttributes, validatePlayerId } from '@/utils/validation';

interface AddPlayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (playerId: string) => Promise<void>;
  existingPlayers: Player[];
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

export const AddPlayerSheet: React.FC<AddPlayerSheetProps> = ({
  isOpen,
  onClose,
  onAddPlayer,
  existingPlayers
}) => {
  const [playerId, setPlayerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Validation state
  const [validation, setValidation] = useState(() => validatePlayerId(playerId));

  // Update validation when values change
  useEffect(() => {
    // Only validate if the field has content
    if (playerId.trim().length > 0) {
      setValidation(validatePlayerId(playerId));
    } else {
      // When empty, don't show validation errors
      setValidation({ isValid: true });
    }
  }, [playerId]);

  const handleAddPlayer = useCallback(async (newPlayerId: string) => {
    try {
      setIsSubmitting(true);
      setError(undefined);
      await onAddPlayer(newPlayerId);
      onClose();
    } catch (error) {
      console.error('Failed to add player:', error);
      setError(error instanceof Error ? error.message : 'Failed to add player');
    } finally {
      setIsSubmitting(false);
    }
  }, [onAddPlayer, onClose]);

  const handleClose = useCallback(() => {
    setPlayerId('');
    setIsSubmitting(false);
    setError(undefined);
    onClose();
  }, [onClose]);

  const checkPlayerExists = useCallback((playerId: string) => {
    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum)) return false;
    
    return existingPlayers.some(player => 
      player.profile.profile.account_id === playerIdNum
    );
  }, [existingPlayers]);

  // Check if form is valid
  const isFormValid = playerId.trim() !== '' && validation.isValid;
  const isDisabled = checkPlayerExists(playerId) || isSubmitting || !isFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDisabled) {
      const currentPlayerId = playerId;
      // Clear fields immediately
      setPlayerId('');
      await handleAddPlayer(currentPlayerId);
    }
  };

  const getButtonText = () => {
    if (playerId.trim() === '') return 'Add Player';
    if (checkPlayerExists(playerId)) return 'Player Already Added';
    if (!validation.isValid) return 'Invalid Player ID';
    return 'Add Player';
  };

  // Only show errors for fields that have been touched (have content)
  const shouldShowPlayerError = playerId.trim().length > 0 ? validation.error : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Player</SheetTitle>
          <SheetDescription>
            Add a player to track their performance and statistics
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
                error={shouldShowPlayerError}
                isValid={playerId.trim().length === 0 || validation.isValid}
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
            {isSubmitting ? 'Adding Player...' : getButtonText()}
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