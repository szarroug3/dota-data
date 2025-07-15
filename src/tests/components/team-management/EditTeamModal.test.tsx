import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditTeamModal } from '@/components/team-management/EditTeamModal';

describe('EditTeamModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockTeamExists = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    currentTeamId: 'team1',
    currentLeagueId: 'league1',
    onSave: mockOnSave,
    teamExists: mockTeamExists,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTeamExists.mockReturnValue(false);
  });

  it('should render modal when isOpen is true', () => {
    render(<EditTeamModal {...defaultProps} />);
    
    expect(screen.getByText('Edit Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Team ID *')).toBeInTheDocument();
    expect(screen.getByLabelText('League ID *')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<EditTeamModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
  });

  it('should populate form with current team and league IDs', () => {
    render(<EditTeamModal {...defaultProps} />);
    
    const teamIdInput = screen.getByLabelText('Team ID *') as HTMLInputElement;
    const leagueIdInput = screen.getByLabelText('League ID *') as HTMLInputElement;
    
    expect(teamIdInput.value).toBe('team1');
    expect(leagueIdInput.value).toBe('league1');
  });

  it('should call onSave with correct parameters when save is clicked', async () => {
    const user = userEvent.setup();
    render(<EditTeamModal {...defaultProps} />);
    
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith('team1', 'league1', 'team1', 'league1');
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<EditTeamModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable save button when team ID is empty', async () => {
    const user = userEvent.setup();
    render(<EditTeamModal {...defaultProps} />);
    
    const teamIdInput = screen.getByLabelText('Team ID *');
    const saveButton = screen.getByText('Save Changes');
    
    // Clear the team ID input
    await user.clear(teamIdInput);
    
    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when league ID is empty', async () => {
    const user = userEvent.setup();
    render(<EditTeamModal {...defaultProps} />);
    
    const leagueIdInput = screen.getByLabelText('League ID *');
    const saveButton = screen.getByText('Save Changes');
    
    // Clear the league ID input
    await user.clear(leagueIdInput);
    
    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when team already exists', async () => {
    const user = userEvent.setup();
    mockTeamExists.mockReturnValue(true);
    render(<EditTeamModal {...defaultProps} />);
    
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
    
    render(<EditTeamModal {...defaultProps} onSave={mockOnSaveWithError} />);
    
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
    const mockOnSaveWithDelay = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<EditTeamModal {...defaultProps} onSave={mockOnSaveWithDelay} />);
    
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);
    
    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('should clear error when form is reset', async () => {
    const user = userEvent.setup();
    const mockOnSaveWithError = jest.fn().mockRejectedValue(new Error('Failed to update team'));
    
    render(<EditTeamModal {...defaultProps} onSave={mockOnSaveWithError} />);
    
    // Trigger an error
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update team')).toBeInTheDocument();
    });
    
    // Reset form by clicking cancel
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    // Reopen modal
    render(<EditTeamModal {...defaultProps} onSave={mockOnSave} />);
    
    // Error should be cleared
    expect(screen.queryByText('Failed to update team')).not.toBeInTheDocument();
  });
}); 