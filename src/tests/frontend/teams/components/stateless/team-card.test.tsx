import { fireEvent, render, screen } from '@testing-library/react';

import type { TeamDisplayData } from '@/frontend/lib/app-data-types';
import { TeamCard } from '@/frontend/teams/components/stateless/TeamCard';
import { TeamCardSkeleton } from '@/frontend/teams/components/stateless/TeamCardSkeleton';
import { TeamList } from '@/frontend/teams/components/stateless/TeamList';

type TeamOverrides = Partial<TeamDisplayData> & {
  team?: Partial<TeamDisplayData['team']>;
  league?: Partial<TeamDisplayData['league']>;
  performance?: Partial<TeamDisplayData['performance']>;
};

const baseTeamData: TeamDisplayData = {
  team: { id: 1, name: 'Team Alpha' },
  league: { id: 1, name: 'Pro League' },
  timeAdded: new Date().toISOString(),
  matches: {},
  manualMatches: {},
  manualPlayers: [],
  players: [],
  performance: {
    totalMatches: 100,
    totalWins: 68,
    totalLosses: 32,
    overallWinRate: 68.1,
    erroredMatches: 0,
  },
  isLoading: false,
};

const createTeamData = (overrides: TeamOverrides = {}): TeamDisplayData => ({
  ...baseTeamData,
  ...overrides,
  team: { ...baseTeamData.team, ...overrides.team },
  league: { ...baseTeamData.league, ...overrides.league },
  performance: { ...baseTeamData.performance, ...overrides.performance },
});

const mockTeams: TeamDisplayData[] = [
  createTeamData(),
  createTeamData({ team: { id: 2, name: 'Team Beta' } }),
  createTeamData({ team: { id: 3, name: 'Team Gamma' }, league: { id: 2, name: 'Championship League' } }),
];

describe('TeamCard', () => {
  it('renders team details and stats', () => {
    render(
      <TeamCard
        teamData={baseTeamData}
        isActive={false}
        onSetActiveTeam={jest.fn()}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Select team Team Alpha' })).toBeInTheDocument();
    expect(screen.getByText('Pro League')).toBeInTheDocument();
    expect(screen.getByText('100 matches')).toBeInTheDocument();
    expect(screen.getByText('68.1% win rate')).toBeInTheDocument();
  });

  it('shows active badge when active', () => {
    render(
      <TeamCard
        teamData={baseTeamData}
        isActive={true}
        onSetActiveTeam={jest.fn()}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('calls onSetActiveTeam when card is clicked', () => {
    const onSetActiveTeam = jest.fn();
    render(
      <TeamCard
        teamData={baseTeamData}
        isActive={false}
        onSetActiveTeam={onSetActiveTeam}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select team Team Alpha' }));
    expect(onSetActiveTeam).toHaveBeenCalledWith(1, 1);
  });

  it('calls action handlers when buttons are clicked', () => {
    const onRefreshTeam = jest.fn();
    const onEditTeam = jest.fn();
    const onRemoveTeam = jest.fn();
    render(
      <TeamCard
        teamData={baseTeamData}
        isActive={false}
        onSetActiveTeam={jest.fn()}
        onRemoveTeam={onRemoveTeam}
        onRefreshTeam={onRefreshTeam}
        onEditTeam={onEditTeam}
      />,
    );

    fireEvent.click(screen.getByTitle('Refresh team data'));
    fireEvent.click(screen.getByTitle('Edit team'));
    fireEvent.click(screen.getByTitle('Delete team'));

    expect(onRefreshTeam).toHaveBeenCalledWith(1, 1);
    expect(onEditTeam).toHaveBeenCalledWith(1, 1);
    expect(onRemoveTeam).toHaveBeenCalledWith(1, 1);
  });

  it('shows error state and hides stats when error is present', () => {
    render(
      <TeamCard
        teamData={{ ...baseTeamData, error: 'Failed to load team data' }}
        isActive={false}
        onSetActiveTeam={jest.fn()}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
    expect(screen.queryByText('100 matches')).not.toBeInTheDocument();
  });
});

describe('TeamCardSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<TeamCardSkeleton />);

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('TeamList', () => {
  it('renders a list of team cards', () => {
    render(
      <TeamList
        teamDataList={mockTeams}
        activeTeam={null}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onSetActiveTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();
  });

  it('renders empty state when there are no teams', () => {
    render(
      <TeamList
        teamDataList={[]}
        activeTeam={null}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onSetActiveTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
    expect(screen.getByText('Add your first team using the add team form to get started.')).toBeInTheDocument();
  });

  it('marks the active team', () => {
    render(
      <TeamList
        teamDataList={mockTeams}
        activeTeam={{ teamId: 2, leagueId: 1 }}
        onRemoveTeam={jest.fn()}
        onRefreshTeam={jest.fn()}
        onSetActiveTeam={jest.fn()}
        onEditTeam={jest.fn()}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
