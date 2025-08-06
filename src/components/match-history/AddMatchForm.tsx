'use client';

import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
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
import { getValidationAriaAttributes, validateMatchId } from '@/utils/validation';

// ============================================================================
// INTERFACES
// ============================================================================

interface AddMatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamSide: 'radiant' | 'dire' | '';
  onMatchIdChange: (value: string) => void;
  onTeamSideChange: (value: 'radiant' | 'dire' | '') => void;
  onAddMatch: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>;
  matchExists: (matchId: string) => boolean;
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

export const AddMatchForm: React.FC<AddMatchFormProps> = ({ 
  isOpen,
  onClose,
  matchId, 
  teamSide, 
  onMatchIdChange, 
  onTeamSideChange, 
  onAddMatch, 
  matchExists,
  isSubmitting = false,
  error
}) => {
  // Validation state
  const [validation, setValidation] = useState(() => validateMatchId(matchId));

  // Update validation when values change
  useEffect(() => {
    setValidation(validateMatchId(matchId));
  }, [matchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDisabled && (teamSide === 'radiant' || teamSide === 'dire')) {
      const currentMatchId = matchId;
      const currentTeamSide = teamSide as 'radiant' | 'dire';
      // Clear fields immediately
      onMatchIdChange('');
      onTeamSideChange('');
      await onAddMatch(currentMatchId, currentTeamSide);
      onClose();
    }
  };

  const getButtonText = () => {
    if (matchId.trim() === '') return 'Add Match';
    if (matchExists(matchId)) return 'Match Already Added';
    if (!validation.isValid) return 'Invalid Match ID';
    return 'Add Match';
  };

  // Only show errors for fields that have been touched (have content)
  const shouldShowMatchError = matchId.trim().length > 0 ? validation.error : undefined;

  // Check if form is valid
  const isFormValid = validation.isValid && teamSide !== '';
  const isDisabled = matchExists(matchId) || isSubmitting || !isFormValid;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Match</SheetTitle>
          <SheetDescription>
            Add a match to the active team&apos;s history
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
                id="match-id"
                label="Match ID"
                placeholder="e.g., 1234567890"
                value={matchId}
                onChange={onMatchIdChange}
                disabled={isSubmitting}
                helpText="Find this in Dotabuff match URLs"
                error={shouldShowMatchError}
                isValid={!validation.error}
              />
              
              <FormField>
                <Label htmlFor="team-side" className="text-sm font-medium">
                  Team Side *
                </Label>
                <Select
                  value={teamSide}
                  onValueChange={(value: 'radiant' | 'dire' | '') => onTeamSideChange(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="data-[placeholder]:text-foreground">
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
            {isSubmitting ? 'Adding Match...' : getButtonText()}
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