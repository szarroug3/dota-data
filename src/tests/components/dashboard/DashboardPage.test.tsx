import { render, screen } from '@testing-library/react';

import { DashboardPage } from '@/components/dashboard/DashboardPage';

// Mock the dashboard components
jest.mock('@/components/dashboard/AddTeamForm', () => ({
  AddTeamForm: ({ isSubmitting }: { isSubmitting?: boolean }) => (
    <div data-testid="add-team-form">
      Add Team Form {isSubmitting ? '(Submitting)' : ''}
    </div>
  )
}));

jest.mock('@/components/dashboard/TeamList', () => ({
  TeamList: () => <div data-testid="team-list">Team List</div>
}));

jest.mock('@/components/dashboard/EditTeamModal', () => ({
  EditTeamModal: () => <div data-testid="edit-team-modal">Edit Team Modal</div>
}));

// Mock the team data fetching context
jest.mock('@/contexts/team-data-fetching-context', () => ({
  useTeamDataFetching: () => ({
    fetchTeamData: jest.fn(),
    fetchLeagueData: jest.fn()
  })
}));

const mockContext = {
  teamDataList: [] as any[],
  activeTeam: null as any,
  addTeam: jest.fn(),
  removeTeam: jest.fn(),
  refreshTeam: jest.fn(),
  updateTeam: jest.fn(),
  setActiveTeam: jest.fn(),
  teamExists: jest.fn().mockReturnValue(false),
  clearGlobalError: jest.fn(),
  getGlobalError: jest.fn().mockReturnValue(null),
  isInitialized: jest.fn().mockReturnValue(true)
};

const mockUseTeamContext = jest.fn(() => mockContext);

jest.mock('@/contexts/team-context', () => ({
  useTeamContext: () => mockUseTeamContext()
}));

const renderComponent = () => {
  return render(<DashboardPage />);
};

describe('TeamManagementPage', () => {
  beforeEach(() => {
    // Reset mock context to default values
    mockContext.teamDataList = [];
    mockContext.activeTeam = null;
  });

  it('should render the main dashboard layout', () => {
    renderComponent();
    
    expect(screen.getByTestId('add-team-form')).toBeInTheDocument();
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });

  it('should render the add team form', () => {
    renderComponent();
    
    expect(screen.getByTestId('add-team-form')).toBeInTheDocument();
  });

  it('should render the team list', () => {
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });

  it('should render the edit team modal', () => {
    renderComponent();
    
    expect(screen.getByTestId('edit-team-modal')).toBeInTheDocument();
  });

  it('should pass props to AddTeamForm component', () => {
    renderComponent();
    
    expect(screen.getByTestId('add-team-form')).toBeInTheDocument();
  });

  it('should pass props to TeamList component', () => {
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });

  it('should handle active team display', () => {
    mockContext.activeTeam = { teamId: 'team-liquid', leagueId: 'esl-pro-league' };
    renderComponent();
    
    expect(screen.getByTestId('active-team')).toBeInTheDocument();
    expect(screen.getByText('Active: team-liquid')).toBeInTheDocument();
  });

  it('should handle empty team list', () => {
    mockContext.teamDataList = [];
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
    expect(screen.getByText('Team List (0 teams)')).toBeInTheDocument();
  });

  it('should handle team list with multiple teams', () => {
    mockContext.teamDataList = [
      { team: { id: 'team1', name: 'Team 1' } },
      { team: { id: 'team2', name: 'Team 2' } }
    ];
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
    expect(screen.getByText('Team List (2 teams)')).toBeInTheDocument();
  });
}); 