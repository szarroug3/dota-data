'use client';

import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
import { useTeamContext } from '@/contexts/team-context';
import { getValidationAriaAttributes, validateMatchId } from '@/utils/validation';

// ============================================================================
// INTERFACES
// ============================================================================

interface EditManualMatchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  currentTeamSide: 'radiant' | 'dire';
  onEditMatch: (matchId: number, teamSide: 'radiant' | 'dire') => Promise<void>;
  isSubmitting?: boolean;
  error?: string;
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

// ============================================================================
// FORM COMPONENTS
// ============================================================================

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
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </FormField>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EditManualMatchSheet: React.FC<EditManualMatchSheetProps> = ({ 
  isOpen,
  onClose,
  matchId, 
  currentTeamSide, 
  onEditMatch, 
  isSubmitting = false,
  error: _error
}) => {
  const { getSelectedTeam } = useTeamContext();
  
  // Form state
  const [matchIdString, setMatchIdString] = useState(matchId.toString());
  const [teamSide, setTeamSide] = useState<'radiant' | 'dire' | ''>(currentTeamSide);

  // Reset form when matchId changes
  useEffect(() => {
    setMatchIdString(matchId.toString());
    setTeamSide(currentTeamSide);
  }, [matchId, currentTeamSide]);

  // Validation state
  const [validation, setValidation] = useState(() => validateMatchId(matchIdString));

  // Update validation when values change
  useEffect(() => {
    setValidation(validateMatchId(matchIdString));
  }, [matchIdString]);

  // Check for duplicate matches
  const [duplicateError, setDuplicateError] = useState<string | undefined>();

  useEffect(() => {
    const newMatchId = parseInt(matchIdString, 10);
    if (isNaN(newMatchId) || newMatchId === matchId) {
      setDuplicateError(undefined);
      return;
    }

    const selectedTeam = getSelectedTeam();
    if (!selectedTeam) {
      setDuplicateError(undefined);
      return;
    }

    // Check if new match ID already exists in manual matches
    if (selectedTeam.manualMatches && newMatchId in selectedTeam.manualMatches) {
      setDuplicateError(`Match ${newMatchId} is already added as a manual match`);
      return;
    }

    // Check if new match ID already exists in regular matches
    if (selectedTeam.matches && newMatchId in selectedTeam.matches) {
      setDuplicateError(`Match ${newMatchId} is already in the team's match history`);
      return;
    }

    setDuplicateError(undefined);
  }, [matchIdString, matchId, getSelectedTeam]);

  // Check if form is valid
  const isFormValid = validation.isValid && teamSide !== '' && !duplicateError;
  const isDisabled = isSubmitting || !isFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDisabled && (teamSide === 'radiant' || teamSide === 'dire')) {
      const newMatchId = parseInt(matchIdString, 10);
      const newTeamSide = teamSide as 'radiant' | 'dire';
      await onEditMatch(newMatchId, newTeamSide);
      onClose();
    }
  };

  const getButtonText = () => {
    if (duplicateError) return 'Match Already Exists';
    if (!validation.isValid) return 'Invalid Match ID';
    if (teamSide === '') return 'Select Team Side';
    if (isSubmitting) return 'Updating...';
    return 'Update Match';
  };

  // Only show errors for fields that have been touched (have content)
  const shouldShowMatchError = matchIdString.trim().length > 0 ? validation.error : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Match</SheetTitle>
          <SheetDescription>
            Update the match ID or team side for this match
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-4" onKeyDown={(e) => {
            if (e.key === 'Enter' && !isDisabled) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}>
            <FormFieldInput
              id="match-id"
              label="Match ID"
              placeholder="e.g., 1234567890"
              value={matchIdString}
              onChange={setMatchIdString}
              disabled={isSubmitting}
              helpText="Find this in Dotabuff match URLs"
              error={shouldShowMatchError || duplicateError}
              isValid={!validation.error && !duplicateError}
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
              <p className="text-xs text-muted-foreground mt-1">
                Which side was the team on?
              </p>
            </FormField>
          </div>
        </div>
        
        <SheetFooter className="flex flex-col gap-2 w-full">
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-full"
          >
            {getButtonText()}
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
}; 