import { fireEvent, render, screen } from '@testing-library/react';

import type { TeamDisplayData } from '@/frontend/lib/app-data-types';
import { TeamCard } from '@/frontend/teams/components/stateless/TeamCard';

const mockTeamData: TeamDisplayData = {
  team: {
    id: 12345,
    name: 'Team Liquid',
  },
  league: {
    id: 67890,
    name: 'ESL Pro League',
  },
  timeAdded: '2024-01-01T00:00:00Z',
  matches: {},
  manualMatches: {},
  manualPlayers: [],
  players: [],
  performance: {
    totalMatches: 5,
    totalWins: 3,
    totalLosses: 2,
    overallWinRate: 60,
    erroredMatches: 0,
    heroUsage: {
      picks: [],
      bans: [],
      picksAgainst: [],
      bansAgainst: [],
      picksByPlayer: {},
    },
    draftStats: {
      firstPickCount: 0,
      secondPickCount: 0,
      firstPickWinRate: 0,
      secondPickWinRate: 0,
      uniqueHeroesPicked: 0,
      uniqueHeroesBanned: 0,
      mostPickedHero: '',
      mostBannedHero: '',
    },
    currentWinStreak: 0,
    currentLoseStreak: 0,
    averageMatchDuration: 1800,
    averageKills: 0,
    averageDeaths: 0,
    averageGold: 0,
    averageExperience: 0,
  },
};

describe('TeamCard', () => {
  const mockOnRemoveTeam = jest.fn();
  const mockOnRefreshTeam = jest.fn();
  const mockOnSetActiveTeam = jest.fn();
  const mockOnEditTeam = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render team information', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={true}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByText('Team Liquid')).toBeInTheDocument();
    expect(screen.getByText('ESL Pro League')).toBeInTheDocument();
  });

  it('should show active badge when team is active', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={true}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should not show active badge when team is not active', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('should render refresh button', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const refreshButton = screen.getByTitle('Refresh team data');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should render edit button', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const editButton = screen.getByTitle('Edit team');
    expect(editButton).toBeInTheDocument();
  });

  it('should render delete button', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const deleteButton = screen.getByTitle('Delete team');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should call onSetActiveTeam when card is clicked', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const card = screen.getByRole('button', { name: 'Select team Team Liquid' });
    fireEvent.click(card);

    expect(mockOnSetActiveTeam).toHaveBeenCalledWith(12345, 67890);
  });

  it('should call onRefreshTeam when refresh button is clicked', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const refreshButton = screen.getByTitle('Refresh team data');
    fireEvent.click(refreshButton);

    expect(mockOnRefreshTeam).toHaveBeenCalledWith(12345, 67890);
  });

  it('should call onEditTeam when edit button is clicked', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const editButton = screen.getByTitle('Edit team');
    fireEvent.click(editButton);

    expect(mockOnEditTeam).toHaveBeenCalledWith(12345, 67890);
  });

  it('should call onRemoveTeam when delete button is clicked', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const deleteButton = screen.getByTitle('Delete team');
    fireEvent.click(deleteButton);

    expect(mockOnRemoveTeam).toHaveBeenCalledWith(12345, 67890);
  });

  it('should prevent event bubbling when action buttons are clicked', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const refreshButton = screen.getByTitle('Refresh team data');
    const editButton = screen.getByTitle('Edit team');
    const deleteButton = screen.getByTitle('Delete team');

    fireEvent.click(refreshButton);
    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    // onSetActiveTeam should not be called when action buttons are clicked
    expect(mockOnSetActiveTeam).not.toHaveBeenCalled();
    expect(mockOnRefreshTeam).toHaveBeenCalledWith(12345, 67890);
    expect(mockOnEditTeam).toHaveBeenCalledWith(12345, 67890);
    expect(mockOnRemoveTeam).toHaveBeenCalledWith(12345, 67890);
  });

  it('should handle team with error', () => {
    const teamWithError = {
      ...mockTeamData,
      error: 'Failed to load team data',
    };

    render(
      <TeamCard
        teamData={teamWithError}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
  });

  it('should not allow selecting team with error', () => {
    const teamWithError = {
      ...mockTeamData,
      error: 'Failed to load team data',
    };

    render(
      <TeamCard
        teamData={teamWithError}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const card = screen.getByText('Team Liquid').closest('div');
    fireEvent.click(card!);

    expect(mockOnSetActiveTeam).not.toHaveBeenCalled();
  });

  it('should show loading indicator when team is loading', () => {
    const loadingTeam = {
      ...mockTeamData,
      isLoading: true,
    };

    render(
      <TeamCard
        teamData={loadingTeam}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByTestId('team-loading-spinner')).toBeInTheDocument();
  });

  it('should handle team with missing name', () => {
    const teamWithoutName = {
      ...mockTeamData,
      team: {
        ...mockTeamData.team,
        name: '',
      },
    };

    render(
      <TeamCard
        teamData={teamWithoutName}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByText('Loading 12345...')).toBeInTheDocument();
  });

  it('should handle team with missing league name', () => {
    const teamWithoutLeagueName = {
      ...mockTeamData,
      league: {
        ...mockTeamData.league,
        name: '',
      },
    };

    render(
      <TeamCard
        teamData={teamWithoutLeagueName}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByText('Loading 67890...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const card = screen.getByRole('button', { name: 'Select team Team Liquid' });
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Select team Team Liquid');
  });

  it('should have proper button accessibility attributes', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const refreshButton = screen.getByTitle('Refresh team data');
    const editButton = screen.getByTitle('Edit team');
    const deleteButton = screen.getByTitle('Delete team');

    expect(refreshButton).toHaveAttribute('aria-label', 'Refresh data for Team Liquid');
    expect(editButton).toHaveAttribute('aria-label', 'Edit team');
    expect(deleteButton).toHaveAttribute('aria-label', 'Delete team Team Liquid');
  });

  it('should display team stats when available', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.getByText('5 matches')).toBeInTheDocument();
    expect(screen.getByText('60.0% win rate')).toBeInTheDocument();
  });

  it('should not display team stats when team has error', () => {
    const teamWithError = {
      ...mockTeamData,
      error: 'Failed to load team data',
    };

    render(
      <TeamCard
        teamData={teamWithError}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    expect(screen.queryByText('5 matches')).not.toBeInTheDocument();
    expect(screen.queryByText('60.0% win rate')).not.toBeInTheDocument();
  });

  it('should have proper card styling for active team', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={true}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const card = screen.getByRole('button', { name: 'Select team Team Liquid' });
    expect(card).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5');
  });

  it('should have proper card styling for inactive team', () => {
    render(
      <TeamCard
        teamData={mockTeamData}
        isActive={false}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
        onEditTeam={mockOnEditTeam}
      />,
    );

    const card = screen.getByRole('button', { name: 'Select team Team Liquid' });
    expect(card).toHaveClass('hover:bg-accent/50');
  });
});
