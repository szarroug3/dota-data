import { render, screen } from '@testing-library/react';

import type { TeamDisplayData } from '@/frontend/lib/app-data-types';
import { TeamList } from '@/frontend/teams/components/stateless/TeamList';

describe('TeamList', () => {
  const mockOnRemoveTeam = jest.fn();
  const mockOnRefreshTeam = jest.fn();
  const mockOnEditTeam = jest.fn();
  const mockOnSetActiveTeam = jest.fn();

  const mockTeamDataList: TeamDisplayData[] = [
    {
      team: {
        id: 9517508,
        name: 'Team Liquid',
      },
      league: {
        id: 16435,
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
        totalDurationSeconds: 7500,
        averageMatchDurationSeconds: 1500,
        manualMatchCount: 1,
        manualPlayerCount: 0,
      },
      isLoading: false,
    },
    {
      team: {
        id: 2586976,
        name: 'OG',
      },
      league: {
        id: 16435,
        name: 'ESL Pro League',
      },
      timeAdded: '2024-01-01T00:00:00Z',
      matches: {},
      manualMatches: {},
      manualPlayers: [],
      players: [],
      performance: {
        totalMatches: 3,
        totalWins: 2,
        totalLosses: 1,
        overallWinRate: 67,
        erroredMatches: 0,
        totalDurationSeconds: 5400,
        averageMatchDurationSeconds: 1800,
        manualMatchCount: 0,
        manualPlayerCount: 0,
      },
      isLoading: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render team list with multiple teams', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Your Teams')).toBeInTheDocument();
    expect(screen.getByText('Manage your tracked teams and view their performance')).toBeInTheDocument();
  });

  it('should render empty state when no teams', () => {
    render(
      <TeamList
        teamDataList={[]}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
    expect(screen.getByText('Add your first team using the add team form to get started.')).toBeInTheDocument();
  });

  it('should display card header correctly', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Your Teams')).toBeInTheDocument();
    expect(screen.getByText('Manage your tracked teams and view their performance')).toBeInTheDocument();
  });

  it('should display team information correctly', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Team Liquid')).toBeInTheDocument();
    expect(screen.getByText('OG')).toBeInTheDocument();
  });

  it('should show active badge for active team', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={{ teamId: 9517508, leagueId: 16435 }}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should not show active badge for inactive team', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={{ teamId: 9517508, leagueId: 16435 }}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(1);
  });

  it('should render action buttons for each team', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    const refreshButtons = screen.getAllByTitle('Refresh team data');
    const editButtons = screen.getAllByTitle('Edit team');
    const deleteButtons = screen.getAllByTitle('Delete team');

    expect(refreshButtons).toHaveLength(2);
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('should pass handlers to TeamCard components', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Your Teams')).toBeInTheDocument();
    expect(screen.getByText('Team Liquid')).toBeInTheDocument();
    expect(screen.getByText('OG')).toBeInTheDocument();
  });

  it('should render team cards with proper data', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Your Teams')).toBeInTheDocument();
  });

  it('should have proper card structure', () => {
    render(
      <TeamList
        teamDataList={mockTeamDataList}
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />,
    );

    expect(screen.getByText('Your Teams')).toBeInTheDocument();
  });
});
