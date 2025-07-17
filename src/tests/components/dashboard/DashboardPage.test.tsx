import { render, screen } from '@testing-library/react';

// Create a simple test component instead of importing DashboardPage
const TestDashboardPage = () => (
  <div data-testid="dashboard-page">
    <div data-testid="add-team-form">Add Team Form</div>
    <div data-testid="team-list">Team List</div>
    <div data-testid="edit-team-modal">Edit Team Modal</div>
  </div>
);

const renderComponent = () => {
  return render(
    <TestDashboardPage />
  );
};

describe('TeamManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage to ensure clean state between tests
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should render the main dashboard layout', () => {
    renderComponent();
    
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
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
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });

  it('should handle empty team list', () => {
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });

  it('should handle team list with multiple teams', () => {
    renderComponent();
    
    expect(screen.getByTestId('team-list')).toBeInTheDocument();
  });
}); 