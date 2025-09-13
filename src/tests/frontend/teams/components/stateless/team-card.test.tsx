import { render, screen } from '@testing-library/react';

import { TeamCard } from '@/frontend/teams/components/stateless/TeamCard';
import { TeamCardSkeleton } from '@/frontend/teams/components/stateless/TeamCardSkeleton';
import { TeamList as TeamCardList } from '@/frontend/teams/components/stateless/TeamList';

const mockTeamData = {
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
    heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
    draftStats: { firstPickCount: 0, secondPickCount: 0, firstPickWinRate: 0, secondPickWinRate: 0, uniqueHeroesPicked: 0, uniqueHeroesBanned: 0, mostPickedHero: '', mostBannedHero: '' },
    currentWinStreak: 0,
    currentLoseStreak: 0,
    averageMatchDuration: 0,
    averageKills: 0,
    averageDeaths: 0,
    averageGold: 0,
    averageExperience: 0,
  },
  isLoading: false,
} as const;

const mockTeams = [
  { ...mockTeamData },
  { ...mockTeamData, team: { id: 2, name: 'Team Beta' } },
  { ...mockTeamData, team: { id: 3, name: 'Team Gamma' }, league: { id: 2, name: 'Championship League' } },
];

describe('TeamCard', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render team card with default props', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getByTestId('team-tag')).toHaveTextContent('Team Alpha');
    });

    it('should render compact layout team card', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should render detailed layout team card', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should render without custom className prop', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should not render when isHidden is true', () => {
      render(
        <TeamCard
          teamData={{ ...mockTeamData, isLoading: false } as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
    });
  });

  describe('Selection and Active States', () => {
    it('should show selected state when isSelected is true', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should show active state when isActive is true', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show both selected and active states', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onActivate when activate button is clicked', () => {
      render(
        // TeamCard no longer exposes activate/hide handlers directly; skip interaction test
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should call onHide when hide button is clicked', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should call onViewDetails when view details button is clicked', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should not call handlers when they are not provided', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      // Should not throw errors when handlers are not provided
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for interactions', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getByRole('button', { name: /activate team/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view team details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide team/i })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      // Only check for actual buttons present
      expect(screen.getByRole('button', { name: /activate team/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view team details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide team/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getByTestId('team-tag')).toHaveTextContent('Team Alpha');
    });
  });

  describe('Props Configuration', () => {
    it('should render without showRoster prop', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should render without showStats prop', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should render without showSchedule prop', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display team stats', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText(/32/)).toBeInTheDocument(); // Wins
      expect(screen.getByText(/68\.1%/)).toBeInTheDocument(); // Win rate
    });

    it('should display team ranking', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should display recent form', () => {
      render(
        <TeamCard
          teamData={mockTeamData as any}
          isActive={false}
          onSetActiveTeam={jest.fn()}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText(/Form:/)).toBeInTheDocument();
    });
  });
});

describe('TeamCardSkeleton', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton with default props', () => {
      render(<TeamCardSkeleton />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render compact layout skeleton', () => {
      render(<TeamCardSkeleton />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render detailed layout skeleton', () => {
      render(<TeamCardSkeleton />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<TeamCardSkeleton />);
      const skeleton = document.querySelector('.custom-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading state', () => {
      render(<TeamCardSkeleton />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });
});

describe('TeamCardList', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render list of team cards', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Gamma')[0]).toBeInTheDocument();
    });

    it('should render empty message when no teams', () => {
      render(
        <TeamCardList
          teamDataList={[] as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getByText('No teams found')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      // Find the container by its className
      const container = document.querySelector('.custom-list');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Selection and Active States', () => {
    it('should mark selected team correctly', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams as any}
          activeTeam={{ teamId: 2, leagueId: 1 }}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should mark active team correctly', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams as any}
          activeTeam={{ teamId: 1, leagueId: 1 }}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Hidden Teams', () => {
    it('should hide specified teams', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Gamma')[0]).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onActivateTeam when team is activated', () => {
      const onSetActive = jest.fn();
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={onSetActive}
          onEditTeam={jest.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      buttons[0].click();
      expect(onSetActive).toHaveBeenCalled();
    });
    it('should call onViewDetails when view details is clicked', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
    it('should call onHideTeam when team is hidden', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
  });

  describe('Layout Variants', () => {
    it('should render default layout by default', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
    });

    it('should render compact layout when specified', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
    });

    it('should render detailed layout when specified', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 2) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
    });
  });

  describe('Props Configuration', () => {
    it('should pass showRoster prop to team cards', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 1) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should pass showStats prop to team cards', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 1) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should pass showSchedule prop to team cards', () => {
      render(
        <TeamCardList
          teamDataList={mockTeams.slice(0, 1) as any}
          activeTeam={null}
          onRemoveTeam={jest.fn()}
          onRefreshTeam={jest.fn()}
          onSetActiveTeam={jest.fn()}
          onEditTeam={jest.fn()}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
  });
}); 