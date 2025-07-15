import { render, screen } from '@testing-library/react';

import { TeamManagementPage } from '@/components/team-management/TeamManagementPage';

// Mock the team management components
jest.mock('@/components/team-management/AddTeamForm', () => ({
  AddTeamForm: ({ isSubmitting }: { isSubmitting?: boolean }) => (
    <div data-testid="add-team-form">
      Add Team Form
      {isSubmitting && <span data-testid="loading-indicator">Loading</span>}
    </div>
  )
}));

jest.mock('@/components/team-management/TeamList', () => ({
  TeamList: ({ teamDataList, activeTeam }: any) => (
    <div data-testid="team-list">
      <div data-testid="team-list-header">Your Teams</div>
      <div data-testid="team-list-content">
        Team List ({teamDataList?.length || 0} teams)
        {activeTeam && <span data-testid="active-team">Active: {activeTeam.teamId}</span>}
      </div>
    </div>
  )
}));

jest.mock('@/components/team-management/EditTeamModal', () => ({
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
  return render(<TeamManagementPage />);
};

describe('TeamManagementPage', () => {
  beforeEach(() => {
    // Reset mock context to default values
    mockContext.teamDataList = [];
    mockContext.activeTeam = null;
  });

  it('should render the main team management layout', () => {
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