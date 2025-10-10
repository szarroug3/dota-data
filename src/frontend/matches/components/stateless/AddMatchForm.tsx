'use client';

import { AlertCircle } from 'lucide-react';
import React from 'react';

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
import { getValidationAriaAttributes } from '@/utils/validation';

interface AddMatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamSide: 'radiant' | 'dire' | '';
  onMatchIdChange: (value: string) => void;
  onTeamSideChange: (value: 'radiant' | 'dire' | '') => void;
  onSubmit: () => Promise<void> | void;
  matchExists: (matchId: string) => boolean;
  isSubmitting?: boolean;
  error?: string;
  validationError?: string;
  isValid: boolean;
}

interface FormFieldInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  helpText: React.ReactNode;
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

function AddMatchFields({
  matchId,
  teamSide,
  onMatchIdChange,
  onTeamSideChange,
  isSubmitting,
  isDisabled,
  handleSubmit,
  shouldShowMatchError,
  isValid,
}: {
  matchId: string;
  teamSide: '' | 'radiant' | 'dire';
  onMatchIdChange: (v: string) => void;
  onTeamSideChange: (v: '' | 'radiant' | 'dire') => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  shouldShowMatchError?: string;
  isValid: boolean;
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
        id="match-id"
        label="Match ID"
        placeholder="e.g., 1234567890"
        value={matchId}
        onChange={onMatchIdChange}
        disabled={isSubmitting}
        helpText={
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
            or{' '}
            <a
              href="https://opendota.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline"
            >
              OpenDota
            </a>{' '}
            match URLs
          </>
        }
        error={shouldShowMatchError}
        isValid={isValid}
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
        <p className="text-xs text-muted-foreground mt-1">Which side was the team on?</p>
      </FormField>
    </div>
  );
}

export function AddMatchForm({
  isOpen,
  onClose,
  matchId,
  teamSide,
  onMatchIdChange,
  onTeamSideChange,
  onSubmit,
  matchExists,
  isSubmitting = false,
  error,
  validationError,
  isValid,
}: AddMatchFormProps): React.ReactElement {
  const isDisabled = matchExists(matchId) || isSubmitting || !isValid || teamSide === '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDisabled) {
      await onSubmit();
    }
  }

  function getButtonText(): string {
    if (matchId.trim() === '') return 'Add Match';
    if (matchExists(matchId)) return 'Match Already Added';
    if (!isValid) return 'Invalid Match ID';
    return 'Add Match';
  }

  const shouldShowMatchError = matchId.trim().length > 0 ? validationError : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add New Match</SheetTitle>
          <SheetDescription>Add a match to analyze</SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <Form onSubmit={handleSubmit}>
            <AddMatchFields
              matchId={matchId}
              teamSide={teamSide}
              onMatchIdChange={onMatchIdChange}
              onTeamSideChange={onTeamSideChange}
              isSubmitting={isSubmitting}
              isDisabled={isDisabled}
              handleSubmit={handleSubmit}
              shouldShowMatchError={shouldShowMatchError}
              isValid={!validationError}
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
