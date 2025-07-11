import { fireEvent, render, screen } from '@testing-library/react';

import { TeamCard } from '@/components/team-management/TeamCard';

const baseTeam = {
  id: '1',
  name: 'Team Alpha',
  leagueId: '456',
  leagueName: 'League A',
  isActive: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockTeam = {
  ...baseTeam,
  teamId: '123',
  teamName: 'Team Alpha',
  isLoading: false,
  isError: false,
  errorMessage: undefined
};

const mockProps = {
  team: mockTeam,
  isActive: false,
  onSwitch: jest.fn(),
  onRemove: jest.fn(),
  onRefresh: jest.fn(),
  onUpdate: jest.fn()
};

describe('TeamCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render team information correctly', () => {
    render(<TeamCard {...mockProps} />);
    
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('League: League A')).toBeInTheDocument();
    expect(screen.getByText((content) => /ID:\s*1\s*•\s*League:\s*456/.test(content))).toBeInTheDocument();
  });

  it('should show team ID when team name is not available', () => {
    const teamWithoutName = { ...mockTeam, name: '', teamName: '', teamId: '123' };
    render(<TeamCard {...mockProps} team={teamWithoutName} />);
    
    expect(screen.getByText((content) => /Team\s*1/.test(content))).toBeInTheDocument();
  });

  it('should show league ID when league name is not available', () => {
    const teamWithoutLeagueName = { ...mockTeam, leagueName: '', };
    render(<TeamCard {...mockProps} team={teamWithoutLeagueName} />);
    
    expect(screen.getByText('League: League 456')).toBeInTheDocument();
  });

  it('should show active indicator when team is active', () => {
    render(<TeamCard {...mockProps} isActive={true} />);
    
    expect(screen.getByText('✓ Active Team')).toBeInTheDocument();
    expect(screen.getByTestId('active-indicator')).toBeInTheDocument();
  });

  it('should not show active indicator when team is not active', () => {
    render(<TeamCard {...mockProps} isActive={false} />);
    
    expect(screen.queryByText('✓ Active Team')).not.toBeInTheDocument();
    expect(screen.queryByTestId('active-indicator')).not.toBeInTheDocument();
  });

  it('should show switch button when team is not active', () => {
    render(<TeamCard {...mockProps} isActive={false} />);
    
    expect(screen.getByRole('button', { name: 'Switch' })).toBeInTheDocument();
  });

  it('should not show switch button when team is active', () => {
    render(<TeamCard {...mockProps} isActive={true} />);
    
    expect(screen.queryByRole('button', { name: 'Switch' })).not.toBeInTheDocument();
  });

  it('should call onSwitch when switch button is clicked', () => {
    render(<TeamCard {...mockProps} isActive={false} />);
    
    const switchButton = screen.getByRole('button', { name: 'Switch' });
    fireEvent.click(switchButton);
    
    expect(mockProps.onSwitch).toHaveBeenCalled();
  });

  it('should call onRemove when remove button is clicked', () => {
    render(<TeamCard {...mockProps} />);
    
    const removeButton = screen.getByTitle('Remove team');
    fireEvent.click(removeButton);
    
    expect(mockProps.onRemove).toHaveBeenCalled();
  });

  it('should call onRefresh when refresh button is clicked', () => {
    render(<TeamCard {...mockProps} />);
    
    const refreshButton = screen.getByTitle('Refresh team data');
    fireEvent.click(refreshButton);
    
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });

  it('should call onUpdate when update button is clicked', () => {
    render(<TeamCard {...mockProps} />);
    
    const updateButton = screen.getByTitle('Update team data');
    fireEvent.click(updateButton);
    
    expect(mockProps.onUpdate).toHaveBeenCalled();
  });

  it('should show loading state when team is loading', () => {
    const loadingTeam = { ...mockTeam, isLoading: true };
    render(<TeamCard {...mockProps} team={loadingTeam} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should disable action buttons when team is loading', () => {
    const loadingTeam = { ...mockTeam, isLoading: true };
    render(<TeamCard {...mockProps} team={loadingTeam} />);
    
    const refreshButton = screen.getByTitle('Refresh team data');
    const updateButton = screen.getByTitle('Update team data');
    const removeButton = screen.getByTitle('Remove team');
    
    expect(refreshButton).toBeDisabled();
    expect(updateButton).toBeDisabled();
    expect(removeButton).toBeDisabled();
  });

  it('should show error state when team has error', () => {
    const errorTeam = { ...mockTeam, isError: true, errorMessage: 'Failed to load team data' };
    render(<TeamCard {...mockProps} team={errorTeam} />);
    
    expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
  });

  it('should show default error message when no error message is provided', () => {
    const errorTeam = { ...mockTeam, isError: true, errorMessage: undefined };
    render(<TeamCard {...mockProps} team={errorTeam} />);
    
    expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
  });

  it('should apply correct styling for active team', () => {
    render(<TeamCard {...mockProps} isActive={true} />);
    
    const card = screen.getByText('Team Alpha').closest('.border');
    expect(card).toHaveClass('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  });

  it('should apply correct styling for inactive team', () => {
    render(<TeamCard {...mockProps} isActive={false} />);
    
    const card = screen.getByText('Team Alpha').closest('.border');
    expect(card).toHaveClass('border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800');
  });

  it('should apply correct text styling for active team', () => {
    render(<TeamCard {...mockProps} isActive={true} />);
    
    const teamName = screen.getByText('Team Alpha');
    expect(teamName).toHaveClass('text-blue-900', 'dark:text-blue-100');
  });

  it('should apply correct text styling for inactive team', () => {
    render(<TeamCard {...mockProps} isActive={false} />);
    
    const teamName = screen.getByText('Team Alpha');
    expect(teamName).toHaveClass('text-gray-900', 'dark:text-white');
  });

  it('should render all action buttons with correct titles', () => {
    render(<TeamCard {...mockProps} />);
    
    expect(screen.getByTitle('Refresh team data')).toBeInTheDocument();
    expect(screen.getByTitle('Update team data')).toBeInTheDocument();
    expect(screen.getByTitle('Remove team')).toBeInTheDocument();
  });

  it('should render action buttons with correct icons', () => {
    render(<TeamCard {...mockProps} />);
    
    // Check for SVG icons
    const refreshIcon = screen.getByTitle('Refresh team data').querySelector('svg');
    const updateIcon = screen.getByTitle('Update team data').querySelector('svg');
    const removeIcon = screen.getByTitle('Remove team').querySelector('svg');
    
    expect(refreshIcon).toBeInTheDocument();
    expect(updateIcon).toBeInTheDocument();
    expect(removeIcon).toBeInTheDocument();
  });

  it('should handle all button interactions', () => {
    render(<TeamCard {...mockProps} isActive={false} />);
    
    // Test switch button
    const switchButton = screen.getByRole('button', { name: 'Switch' });
    fireEvent.click(switchButton);
    expect(mockProps.onSwitch).toHaveBeenCalled();
    
    // Test other action buttons
    const refreshButton = screen.getByTitle('Refresh team data');
    const updateButton = screen.getByTitle('Update team data');
    const removeButton = screen.getByTitle('Remove team');
    
    fireEvent.click(refreshButton);
    fireEvent.click(updateButton);
    fireEvent.click(removeButton);
    
    expect(mockProps.onRefresh).toHaveBeenCalled();
    expect(mockProps.onUpdate).toHaveBeenCalled();
    expect(mockProps.onRemove).toHaveBeenCalled();
  });
}); 