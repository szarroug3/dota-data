import { fireEvent, render, screen } from '@testing-library/react';

import { TeamList } from '@/components/team-management/TeamList';

const mockSetActiveTeam = jest.fn();
const mockRemoveTeam = jest.fn();
const mockRefreshTeam = jest.fn();
const mockUpdateTeam = jest.fn();

const mockTeams = [
  { id: '1', teamId: '123', leagueId: '456', teamName: 'Team Alpha', leagueName: 'League A' },
  { id: '2', teamId: '789', leagueId: '012', teamName: 'Team Beta', leagueName: 'League B' }
];

const mockUseTeamData = jest.fn().mockReturnValue({
  teams: mockTeams,
  activeTeamId: '1',
  setActiveTeam: mockSetActiveTeam,
  removeTeam: mockRemoveTeam,
  refreshTeam: mockRefreshTeam,
  updateTeam: mockUpdateTeam
});

jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: () => mockUseTeamData()
}));

jest.mock('@/components/team-management/TeamCard', () => ({
  TeamCard: ({ team, isActive, onSwitch, onRemove, onRefresh, onUpdate }: any) => (
    <div data-testid={`team-card-${team.id}`}>
      <div data-testid={`team-name-${team.id}`}>{team.teamName}</div>
      <div data-testid={`team-league-${team.id}`}>{team.leagueName}</div>
      <div data-testid={`team-active-${team.id}`}>{isActive ? 'active' : 'inactive'}</div>
      <button data-testid={`switch-btn-${team.id}`} onClick={onSwitch}>Switch</button>
      <button data-testid={`remove-btn-${team.id}`} onClick={onRemove}>Remove</button>
      <button data-testid={`refresh-btn-${team.id}`} onClick={onRefresh}>Refresh</button>
      <button data-testid={`update-btn-${team.id}`} onClick={onUpdate}>Update</button>
    </div>
  )
}));

describe('TeamList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamData.mockReturnValue({
      teams: mockTeams,
      activeTeamId: '1',
      setActiveTeam: mockSetActiveTeam,
      removeTeam: mockRemoveTeam,
      refreshTeam: mockRefreshTeam,
      updateTeam: mockUpdateTeam
    });
  });

  it('should render the team list container', () => {
    render(<TeamList />);
    expect(screen.getByText('Your Teams')).toBeInTheDocument();
    expect(screen.getByText('2 teams')).toBeInTheDocument();
  });

  it('should render all team cards', () => {
    render(<TeamList />);
    expect(screen.getByTestId('team-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('team-card-2')).toBeInTheDocument();
  });

  it('should display team information correctly', () => {
    render(<TeamList />);
    expect(screen.getByTestId('team-name-1')).toHaveTextContent('Team Alpha');
    expect(screen.getByTestId('team-league-1')).toHaveTextContent('League A');
    expect(screen.getByTestId('team-name-2')).toHaveTextContent('Team Beta');
    expect(screen.getByTestId('team-league-2')).toHaveTextContent('League B');
  });

  it('should show active team status correctly', () => {
    render(<TeamList />);
    expect(screen.getByTestId('team-active-1')).toHaveTextContent('active');
    expect(screen.getByTestId('team-active-2')).toHaveTextContent('inactive');
  });

  it('should call setActiveTeam when switch button is clicked', () => {
    render(<TeamList />);
    const switchButton = screen.getByTestId('switch-btn-2');
    fireEvent.click(switchButton);
    expect(mockSetActiveTeam).toHaveBeenCalledWith('2');
  });

  it('should call removeTeam when remove button is clicked', () => {
    render(<TeamList />);
    const removeButton = screen.getByTestId('remove-btn-1');
    fireEvent.click(removeButton);
    expect(mockRemoveTeam).toHaveBeenCalledWith('1');
  });

  it('should call refreshTeam when refresh button is clicked', () => {
    render(<TeamList />);
    const refreshButton = screen.getByTestId('refresh-btn-1');
    fireEvent.click(refreshButton);
    expect(mockRefreshTeam).toHaveBeenCalledWith('1');
  });

  it('should call updateTeam when update button is clicked', () => {
    render(<TeamList />);
    const updateButton = screen.getByTestId('update-btn-1');
    fireEvent.click(updateButton);
    expect(mockUpdateTeam).toHaveBeenCalledWith('1');
  });

  it('should render empty state when no teams exist', () => {
    mockUseTeamData.mockReturnValue({
      teams: [],
      activeTeamId: null,
      setActiveTeam: mockSetActiveTeam,
      removeTeam: mockRemoveTeam,
      refreshTeam: mockRefreshTeam,
      updateTeam: mockUpdateTeam
    });
    render(<TeamList />);
    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
    expect(screen.getByText(/Add your first team above to start tracking/)).toBeInTheDocument();
  });

  it('should render empty state when teams is null', () => {
    mockUseTeamData.mockReturnValue({
      teams: null,
      activeTeamId: null,
      setActiveTeam: mockSetActiveTeam,
      removeTeam: mockRemoveTeam,
      refreshTeam: mockRefreshTeam,
      updateTeam: mockUpdateTeam
    });
    render(<TeamList />);
    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
  });

  it('should display correct team count for single team', () => {
    mockUseTeamData.mockReturnValue({
      teams: [{ id: '1', teamId: '123', leagueId: '456' }],
      activeTeamId: '1',
      setActiveTeam: mockSetActiveTeam,
      removeTeam: mockRemoveTeam,
      refreshTeam: mockRefreshTeam,
      updateTeam: mockUpdateTeam
    });
    render(<TeamList />);
    expect(screen.getByText('1 team')).toBeInTheDocument();
  });

  it('should display correct team count for multiple teams', () => {
    render(<TeamList />);
    expect(screen.getByText('2 teams')).toBeInTheDocument();
  });

  it('should handle all action button clicks', () => {
    render(<TeamList />);
    fireEvent.click(screen.getByTestId('switch-btn-1'));
    fireEvent.click(screen.getByTestId('remove-btn-1'));
    fireEvent.click(screen.getByTestId('refresh-btn-1'));
    fireEvent.click(screen.getByTestId('update-btn-1'));
    expect(mockSetActiveTeam).toHaveBeenCalledWith('1');
    expect(mockRemoveTeam).toHaveBeenCalledWith('1');
    expect(mockRefreshTeam).toHaveBeenCalledWith('1');
    expect(mockUpdateTeam).toHaveBeenCalledWith('1');
  });
}); 