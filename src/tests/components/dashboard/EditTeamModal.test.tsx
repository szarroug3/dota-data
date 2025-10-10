import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo, useState } from 'react';

import { EditTeamSheet } from '@/frontend/teams/components/stateless/EditTeamSheet';

// Controlled harness to adapt stateless EditTeamSheet to previous stateful test expectations
const ControlledEditTeamHarness = ({
  isOpen,
  onClose,
  currentTeamId,
  currentLeagueId,
  onSave,
  teamExists,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentTeamId: string;
  currentLeagueId: string;
  onSave: (oldTeamId: string, oldLeagueId: string, newTeamId: string, newLeagueId: string) => Promise<void>;
  teamExists: (teamId: string, leagueId: string) => boolean;
}) => {
  const [newTeamId, setNewTeamId] = useState(currentTeamId);
  const [newLeagueId, setNewLeagueId] = useState(currentLeagueId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const { buttonText, buttonDisabled } = useMemo(() => {
    if (!newTeamId.trim() || !newLeagueId.trim()) {
      return { buttonText: 'Save Changes', buttonDisabled: true };
    }
    if (newTeamId !== currentTeamId || newLeagueId !== currentLeagueId) {
      if (teamExists(newTeamId.trim(), newLeagueId.trim())) {
        return { buttonText: 'Team already imported', buttonDisabled: true };
      }
    }
    return { buttonText: isSubmitting ? 'Saving...' : 'Save Changes', buttonDisabled: isSubmitting };
  }, [newTeamId, newLeagueId, currentTeamId, currentLeagueId, teamExists, isSubmitting]);

  const handleSubmit = async () => {
    if (buttonDisabled) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await onSave(currentTeamId, currentLeagueId, newTeamId, newLeagueId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamIdError = newTeamId.trim().length > 0 ? undefined : undefined;
  const leagueIdError = newLeagueId.trim().length > 0 ? undefined : undefined;

  return (
    <EditTeamSheet
      isOpen={isOpen}
      onClose={onClose}
      currentTeamId={currentTeamId}
      currentLeagueId={currentLeagueId}
      newTeamId={newTeamId}
      newLeagueId={newLeagueId}
      onChangeTeamId={setNewTeamId}
      onChangeLeagueId={setNewLeagueId}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      teamIdError={teamIdError}
      leagueIdError={leagueIdError}
      buttonText={buttonText}
      buttonDisabled={buttonDisabled}
    />
  );
};

describe('EditTeamSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockTeamExists = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    currentTeamId: '12345',
    currentLeagueId: '67890',
    onSave: mockOnSave,
    teamExists: mockTeamExists,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTeamExists.mockReturnValue(false);
  });

  it('should render sheet when isOpen is true', () => {
    render(<ControlledEditTeamHarness {...defaultProps} />);

    expect(screen.getByText('Edit Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Team ID *')).toBeInTheDocument();
    expect(screen.getByLabelText('League ID *')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render sheet when isOpen is false', () => {
    render(<ControlledEditTeamHarness {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
  });

  it('should populate form with current team and league IDs', () => {
    render(<ControlledEditTeamHarness {...defaultProps} />);

    const teamIdInput = screen.getByLabelText('Team ID *') as HTMLInputElement;
    const leagueIdInput = screen.getByLabelText('League ID *') as HTMLInputElement;

    expect(teamIdInput.value).toBe('12345');
    expect(leagueIdInput.value).toBe('67890');
  });

  it('should call onSave with correct parameters when save is clicked', async () => {
    const user = userEvent.setup();
    render(<ControlledEditTeamHarness {...defaultProps} />);

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('12345', '67890', '12345', '67890');
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ControlledEditTeamHarness {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable save button when team ID is empty', async () => {
    const user = userEvent.setup();
    render(<ControlledEditTeamHarness {...defaultProps} />);

    const teamIdInput = screen.getByLabelText('Team ID *');
    const saveButton = screen.getByText('Save Changes');

    // Clear the team ID input
    await user.clear(teamIdInput);

    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when league ID is empty', async () => {
    const user = userEvent.setup();
    render(<ControlledEditTeamHarness {...defaultProps} />);

    const leagueIdInput = screen.getByLabelText('League ID *');
    const saveButton = screen.getByText('Save Changes');

    // Clear the league ID input
    await user.clear(leagueIdInput);

    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when team already exists', async () => {
    const user = userEvent.setup();
    mockTeamExists.mockReturnValue(true);
    render(<ControlledEditTeamHarness {...defaultProps} />);

    const teamIdInput = screen.getByLabelText('Team ID *');
    const leagueIdInput = screen.getByLabelText('League ID *');

    // Change to a different team
    await user.clear(teamIdInput);
    await user.type(teamIdInput, 'team2');
    await user.clear(leagueIdInput);
    await user.type(leagueIdInput, 'league2');

    // Wait for the button text to update
    await waitFor(() => {
      expect(screen.getByText('Team already imported')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Team already imported');
    expect(saveButton).toBeDisabled();
  });

  it('should show error message when onSave throws an error', async () => {
    const user = userEvent.setup();
    const mockOnSaveWithError = jest.fn().mockRejectedValue(new Error('Failed to update team'));

    render(<ControlledEditTeamHarness {...defaultProps} onSave={mockOnSaveWithError} />);

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update team')).toBeInTheDocument();
    });

    // Modal should still be open
    expect(screen.getByText('Edit Team')).toBeInTheDocument();
  });

  it('should show loading state when saving', async () => {
    const user = userEvent.setup();
    const mockOnSaveWithDelay = jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<ControlledEditTeamHarness {...defaultProps} onSave={mockOnSaveWithDelay} />);

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('should clear error when form is reset', async () => {
    const user = userEvent.setup();
    const mockOnSaveWithError = jest.fn().mockRejectedValue(new Error('Failed to update team'));

    const { unmount } = render(<ControlledEditTeamHarness {...defaultProps} onSave={mockOnSaveWithError} />);

    // Trigger an error
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update team')).toBeInTheDocument();
    });

    // Reset form by clicking cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Unmount and remount to simulate reopening
    unmount();
    render(<ControlledEditTeamHarness {...defaultProps} onSave={mockOnSave} />);

    // Error should be cleared
    expect(screen.queryByText('Failed to update team')).not.toBeInTheDocument();
  });
});
