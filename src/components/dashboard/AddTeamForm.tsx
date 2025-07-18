import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormRow } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddTeamFormProps {
  teamId: string;
  leagueId: string;
  onTeamIdChange: (value: string) => void;
  onLeagueIdChange: (value: string) => void;
  onAddTeam: (teamId: string, leagueId: string) => Promise<void>;
  teamExists: (teamId: string, leagueId: string) => boolean;
  isSubmitting?: boolean;
  onReset?: () => void;
}

interface FormFieldInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  helpText: string;
}

const FormFieldInput: React.FC<FormFieldInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  helpText
}) => (
  <FormField>
    <Label htmlFor={id} className="text-sm font-medium">
      {label} *
    </Label>
    <Input
      type="text"
      id={id}
      name={id}
      placeholder={placeholder}
      required
      disabled={disabled}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full"
    />
    <p className="text-xs text-muted-foreground">
      {helpText}
    </p>
  </FormField>
);

interface FormActionsProps {
  isDisabled: boolean;
  isSubmitting: boolean;
  onReset?: () => void;
  getButtonText: () => string;
}

const FormActions: React.FC<FormActionsProps> = ({
  isDisabled,
  isSubmitting,
  onReset,
  getButtonText
}) => (
  <div className="flex gap-4 justify-end">
    {onReset && (
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={isSubmitting}
      >
        Reset
      </Button>
    )}
    <Button
      type="submit"
      disabled={isDisabled}
    >
      {getButtonText()}
    </Button>
  </div>
);

export const AddTeamForm: React.FC<AddTeamFormProps> = ({ 
  teamId, 
  leagueId, 
  onTeamIdChange, 
  onLeagueIdChange, 
  onAddTeam, 
  teamExists,
  isSubmitting = false,
  onReset
}) => {
  const isDisabled = !teamId.trim() || !leagueId.trim() || teamExists(teamId, leagueId) || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      const currentTeamId = teamId;
      const currentLeagueId = leagueId;
      // Clear fields immediately
      onTeamIdChange('');
      onLeagueIdChange('');
      await onAddTeam(currentTeamId, currentLeagueId);
    }
  };

  const getButtonText = () => {
    if (teamExists(teamId, leagueId)) return 'Team Already Imported';
    return 'Add Team';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Team</CardTitle>
        <CardDescription>
          Add a team to track their performance and statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <FormRow>
            <FormFieldInput
              id="team-id"
              label="Team ID"
              placeholder="e.g., 9517508"
              value={teamId}
              onChange={onTeamIdChange}
              disabled={isSubmitting}
              helpText="Find this in Dotabuff team URLs"
            />
            <FormFieldInput
              id="league-id"
              label="League ID"
              placeholder="e.g., 16435"
              value={leagueId}
              onChange={onLeagueIdChange}
              disabled={isSubmitting}
              helpText="Find this in Dotabuff league URLs"
            />
          </FormRow>
          <FormActions
            isDisabled={isDisabled}
            isSubmitting={isSubmitting}
            onReset={onReset}
            getButtonText={getButtonText}
          />
        </Form>
      </CardContent>
    </Card>
  );
}; 