import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddTeamForm } from '@/frontend/teams/components/stateless/AddTeamForm';

describe('AddTeamForm', () => {
  const mockOnAddTeam = jest.fn();
  const mockOnTeamIdChange = jest.fn();
  const mockOnLeagueIdChange = jest.fn();
  const mockTeamExists = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTeamExists.mockReturnValue(false);
  });

  it('should render the form with all required elements', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    expect(screen.getByText('Add New Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Team ID *')).toBeInTheDocument();
    expect(screen.getByLabelText('League ID *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Team' })).toBeInTheDocument();
  });

  it('should disable the Add button when fields are empty', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable the Add button when both fields are filled', () => {
    render(
      <AddTeamForm
        teamId="team-liquid"
        leagueId="esl-pro-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );
    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    expect(submitButton).toBeEnabled();
  });

  it('should disable the Add button when team already exists', () => {
    mockTeamExists.mockReturnValue(true);
    render(
      <AddTeamForm
        teamId="existing-team"
        leagueId="existing-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );
    const submitButton = screen.getByRole('button', { name: 'Team Already Imported' });
    expect(submitButton).toBeDisabled();
  });

  it('should show "Team Already Imported" text when team exists', () => {
    mockTeamExists.mockReturnValue(true);
    render(
      <AddTeamForm
        teamId="existing-team"
        leagueId="existing-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );
    expect(screen.getByRole('button', { name: 'Team Already Imported' })).toBeInTheDocument();
  });

  it('should render form fields with proper attributes', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const teamIdInput = screen.getByLabelText('Team ID *');
    const leagueIdInput = screen.getByLabelText('League ID *');

    expect(teamIdInput).toHaveAttribute('type', 'text');
    expect(teamIdInput).toBeRequired();
    expect(teamIdInput).toHaveAttribute('placeholder', 'e.g., 9517508');

    expect(leagueIdInput).toHaveAttribute('type', 'text');
    expect(leagueIdInput).toBeRequired();
    expect(leagueIdInput).toHaveAttribute('placeholder', 'e.g., 16435');
  });

  it('should render help text for form fields', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    expect(
      screen.getByText((content, element) => {
        return element?.textContent === 'Find this in Dotabuff team URLs';
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === 'Find this in Dotabuff league URLs';
      }),
    ).toBeInTheDocument();
  });

  it('should render submit button with proper attributes', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have proper form structure with Form components', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const form = screen.getByRole('button', { name: 'Add Team' }).closest('form');
    expect(form).toBeInTheDocument();
  });

  it('should have proper card structure', () => {
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const card = screen.getByText('Add New Team').closest('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it('should call onTeamIdChange when team ID input changes', async () => {
    const user = userEvent.setup();
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const teamIdInput = screen.getByLabelText('Team ID *');
    await user.type(teamIdInput, 'test-team');

    expect(mockOnTeamIdChange).toHaveBeenCalledTimes(9);
    expect(mockOnTeamIdChange).toHaveBeenLastCalledWith('m');
  });

  it('should call onLeagueIdChange when league ID input changes', async () => {
    const user = userEvent.setup();
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const leagueIdInput = screen.getByLabelText('League ID *');
    await user.type(leagueIdInput, 'test-league');

    expect(mockOnLeagueIdChange).toHaveBeenCalledTimes(11);
    expect(mockOnLeagueIdChange).toHaveBeenLastCalledWith('e');
  });

  it('should call onAddTeam and clear fields when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    await user.click(submitButton);

    expect(mockOnAddTeam).toHaveBeenCalledWith('test-team', 'test-league');
    expect(mockOnTeamIdChange).toHaveBeenCalledWith('');
    expect(mockOnLeagueIdChange).toHaveBeenCalledWith('');
  });

  it('should not call onAddTeam when form is submitted with empty data', async () => {
    const user = userEvent.setup();
    render(
      <AddTeamForm
        teamId=""
        leagueId=""
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    await user.click(submitButton);

    expect(mockOnAddTeam).not.toHaveBeenCalled();
  });

  it('should not call onAddTeam when form is submitted with existing team', async () => {
    mockTeamExists.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <AddTeamForm
        teamId="existing-team"
        leagueId="existing-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Team Already Imported' });
    await user.click(submitButton);

    expect(mockOnAddTeam).not.toHaveBeenCalled();
  });

  it('should disable button when submitting', () => {
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
        isSubmitting={true}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Add Team' });
    expect(submitButton).toBeDisabled();
  });

  it('should call onReset when reset button is clicked', async () => {
    const mockOnReset = jest.fn();
    const user = userEvent.setup();
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
        onReset={mockOnReset}
      />,
    );

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalled();
  });

  it('should not show reset button when onReset is not provided', () => {
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('should disable inputs when submitting', () => {
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
        isSubmitting={true}
      />,
    );

    const teamIdInput = screen.getByLabelText('Team ID *');
    const leagueIdInput = screen.getByLabelText('League ID *');

    expect(teamIdInput).toBeDisabled();
    expect(leagueIdInput).toBeDisabled();
  });

  it('should call teamExists with correct parameters', () => {
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    expect(mockTeamExists).toHaveBeenCalledWith('test-team', 'test-league');
  });

  it('should align buttons to the right', () => {
    render(
      <AddTeamForm
        teamId="test-team"
        leagueId="test-league"
        onTeamIdChange={mockOnTeamIdChange}
        onLeagueIdChange={mockOnLeagueIdChange}
        onAddTeam={mockOnAddTeam}
        teamExists={mockTeamExists}
      />,
    );

    const actionsContainer = screen.getByRole('button', { name: 'Add Team' }).closest('.flex');
    expect(actionsContainer).toHaveClass('justify-end');
  });
});
