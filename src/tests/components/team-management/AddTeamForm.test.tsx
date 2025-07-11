import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddTeamForm } from '@/components/team-management/AddTeamForm';

// Mock the useTeamData hook
const mockAddTeam = jest.fn();
const mockTeams = [
  { id: '123', teamId: '123', leagueId: '456', teamName: 'Team Alpha', leagueName: 'League A' },
  { id: '2', teamId: '789', leagueId: '012', teamName: 'Team Beta', leagueName: 'League B' }
];

const mockUseTeamData = jest.fn().mockReturnValue({
  teams: mockTeams,
  addTeam: mockAddTeam
});

jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: () => mockUseTeamData()
}));

describe('AddTeamForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamData.mockReturnValue({
      teams: mockTeams,
      addTeam: mockAddTeam
    });
  });

  it('should render the form with all required elements', () => {
    render(<AddTeamForm />);
    
    expect(screen.getByText('Add New Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Team ID')).toBeInTheDocument();
    expect(screen.getByLabelText('League ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Team' })).toBeInTheDocument();
  });

  it('should display the team count', () => {
    render(<AddTeamForm />);
    
    expect(screen.getByText('2 teams added')).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    const user = userEvent.setup();
    mockAddTeam.mockResolvedValue(undefined);
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '999');
    await user.type(leagueIdInput, '888');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddTeam).toHaveBeenCalledWith('999', '888');
    });
  });

  it('should clear form fields after successful submission', async () => {
    const user = userEvent.setup();
    mockAddTeam.mockResolvedValue(undefined);
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '999');
    await user.type(leagueIdInput, '888');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(teamIdInput).toHaveValue('');
      expect(leagueIdInput).toHaveValue('');
    });
  });

  it('should show error message and keep button enabled when form is invalid', async () => {
    const user = userEvent.setup();
    render(<AddTeamForm />);
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Please enter both Team ID') && content.includes('League ID'))).toBeInTheDocument();
    });
  });

  it('should show error message for team already added', async () => {
    const user = userEvent.setup();
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    
    await user.type(teamIdInput, '123');
    await user.type(leagueIdInput, '456');
    
    await waitFor(() => {
      expect(screen.getByText((content) => /Team\s*Already\s*Added/.test(content))).toBeInTheDocument();
    });
  });

  it('should disable submit button when submitting', async () => {
    const user = userEvent.setup();
    mockAddTeam.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '999');
    await user.type(leagueIdInput, '888');
    await user.click(submitButton);
    
    expect(screen.getByText('Adding Team...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should show error message when addTeam fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to add team';
    mockAddTeam.mockRejectedValue(new Error(errorMessage));
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '999');
    await user.type(leagueIdInput, '888');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle non-Error exceptions', async () => {
    const user = userEvent.setup();
    mockAddTeam.mockRejectedValue('String error');
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '999');
    await user.type(leagueIdInput, '888');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to add team')).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '999');
    await user.type(leagueIdInput, '888');
    
    expect(submitButton).toBeEnabled();
  });

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup();
    mockAddTeam.mockResolvedValue(undefined);
    
    render(<AddTeamForm />);
    
    const teamIdInput = screen.getByLabelText('Team ID');
    const leagueIdInput = screen.getByLabelText('League ID');
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    
    await user.type(teamIdInput, '  999  ');
    await user.type(leagueIdInput, '  888  ');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddTeam).toHaveBeenCalledWith('999', '888');
    });
  });

  it('should handle single team count correctly', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', teamId: '123', leagueId: '456' }],
      addTeam: mockAddTeam
    });
    
    render(<AddTeamForm />);
    
    expect(screen.getByText('1 team added')).toBeInTheDocument();
  });

  it('should handle empty teams array', () => {
    mockUseTeamData.mockReturnValue({
      teams: [],
      addTeam: mockAddTeam
    });
    
    render(<AddTeamForm />);
    
    expect(screen.getByText('0 teams added')).toBeInTheDocument();
  });
}); 