import { fireEvent, render, screen } from '@testing-library/react';

import { TeamCard, TeamCardList, TeamCardSkeleton } from '@/components/team/team-card';

const mockTeam = {
  id: '1',
  name: 'Team Alpha',
  tag: 'ALPHA',
  logo: '/logos/team-alpha.png',
  region: 'NA',
  division: 'Division 1',
  ranking: 8,
  points: 1847,
  coach: 'Coach Smith',
  captain: 'Captain Johnson',
  founded: '2020-01-15',
  website: 'https://teamalpha.com',
  social: {
    twitter: '@teamalpha',
    facebook: 'teamalpha',
    instagram: 'teamalpha'
  },
  leagueId: 'league1',
  leagueName: 'Pro League',
  isActive: true,
  createdAt: '2020-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const mockTeams = [
  {
    id: '1',
    name: 'Team Alpha',
    tag: 'ALPHA',
    logo: '/logos/team-alpha.png',
    region: 'NA',
    division: 'Division 1',
    ranking: 8,
    points: 1847,
    coach: 'Coach Smith',
    captain: 'Captain Johnson',
    founded: '2020-01-15',
    website: 'https://teamalpha.com',
    social: {
      twitter: '@teamalpha',
      facebook: 'teamalpha',
      instagram: 'teamalpha'
    },
    leagueId: 'league1',
    leagueName: 'Pro League',
    isActive: true,
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Team Beta',
    tag: 'BETA',
    logo: '/logos/team-beta.png',
    region: 'EU',
    division: 'Division 2',
    ranking: 12,
    points: 1650,
    coach: 'Coach Wilson',
    captain: 'Captain Davis',
    founded: '2021-03-20',
    website: 'https://teambeta.com',
    social: {
      twitter: '@teambeta',
      facebook: 'teambeta',
      instagram: 'teambeta'
    },
    leagueId: 'league1',
    leagueName: 'Pro League',
    isActive: true,
    createdAt: '2021-03-20T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z'
  },
  {
    id: '3',
    name: 'Team Gamma',
    tag: 'GAMMA',
    logo: '/logos/team-gamma.png',
    region: 'SEA',
    division: 'Division 1',
    ranking: 5,
    points: 2100,
    coach: 'Coach Brown',
    captain: 'Captain Lee',
    founded: '2019-08-10',
    website: 'https://teamgamma.com',
    social: {
      twitter: '@teamgamma',
      facebook: 'teamgamma',
      instagram: 'teamgamma'
    },
    leagueId: 'league2',
    leagueName: 'Championship League',
    isActive: true,
    createdAt: '2019-08-10T00:00:00Z',
    updatedAt: '2024-01-13T00:00:00Z'
  }
];

describe('TeamCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnActivate = jest.fn();
  const mockOnHide = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render team card with default props', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getByTestId('team-tag')).toHaveTextContent('Team Alpha');
    });

    it('should render compact layout team card', () => {
      render(
        <TeamCard
          team={mockTeam}
          layout="compact"
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should render detailed layout team card', () => {
      render(
        <TeamCard
          team={mockTeam}
          layout="detailed"
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TeamCard
          team={mockTeam}
          className="custom-team-card"
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      const cardElement = screen.getAllByText('Team Alpha')[0].closest('.bg-white');
      expect(cardElement).toHaveClass('custom-team-card');
    });

    it('should not render when isHidden is true', () => {
      render(
        <TeamCard
          team={mockTeam}
          isHidden={true}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
    });
  });

  describe('Selection and Active States', () => {
    it('should show selected state when isSelected is true', () => {
      render(
        <TeamCard
          team={mockTeam}
          isSelected={true}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should show active state when isActive is true', () => {
      render(
        <TeamCard
          team={mockTeam}
          isActive={true}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show both selected and active states', () => {
      render(
        <TeamCard
          team={mockTeam}
          isSelected={true}
          isActive={true}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onActivate when activate button is clicked', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      const activateButton = screen.getByRole('button', { name: /activate/i });
      fireEvent.click(activateButton);

      expect(mockOnActivate).toHaveBeenCalledWith('1');
    });

    it('should call onHide when hide button is clicked', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      const hideButton = screen.getByRole('button', { name: /hide/i });
      fireEvent.click(hideButton);

      expect(mockOnHide).toHaveBeenCalledWith('1');
    });

    it('should call onViewDetails when view details button is clicked', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByRole('button', { name: /view team details/i });
      fireEvent.click(viewDetailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith('1');
    });

    it('should not call handlers when they are not provided', () => {
      render(
        <TeamCard
          team={mockTeam}
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
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByRole('button', { name: /activate team/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view team details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hide team/i })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
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
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getByTestId('team-tag')).toHaveTextContent('Team Alpha');
    });
  });

  describe('Props Configuration', () => {
    it('should pass showRoster prop to variant components', () => {
      render(
        <TeamCard
          team={mockTeam}
          showRoster={false}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should pass showStats prop to variant components', () => {
      render(
        <TeamCard
          team={mockTeam}
          showStats={false}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should pass showSchedule prop to variant components', () => {
      render(
        <TeamCard
          team={mockTeam}
          showSchedule={false}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display team stats', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText(/32/)).toBeInTheDocument(); // Wins
      expect(screen.getByText(/68\.1%/)).toBeInTheDocument(); // Win rate
    });

    it('should display team ranking', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
          layout="detailed"
        />
      );
      const rankingElement = screen.getByText(/#8/);
      expect(rankingElement).toBeInTheDocument(); // Ranking position
      expect(screen.getByTestId('team-points')).toHaveTextContent('1847');
    });

    it('should display recent form', () => {
      render(
        <TeamCard
          team={mockTeam}
          onSelect={mockOnSelect}
          onActivate={mockOnActivate}
          onHide={mockOnHide}
          onViewDetails={mockOnViewDetails}
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
      render(<TeamCardSkeleton layout="compact" />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render detailed layout skeleton', () => {
      render(<TeamCardSkeleton layout="detailed" />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<TeamCardSkeleton className="custom-skeleton" />);
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
  const mockOnSelectTeam = jest.fn();
  const mockOnActivateTeam = jest.fn();
  const mockOnHideTeam = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render list of team cards', () => {
      render(
        <TeamCardList
          teams={mockTeams}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Gamma')[0]).toBeInTheDocument();
    });

    it('should render empty message when no teams', () => {
      render(
        <TeamCardList
          teams={[]}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByText('No teams found')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          className="custom-list"
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
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
          teams={mockTeams}
          selectedTeamId="2"
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should mark active team correctly', () => {
      render(
        <TeamCardList
          teams={mockTeams}
          activeTeamId="1"
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Hidden Teams', () => {
    it('should hide specified teams', () => {
      render(
        <TeamCardList
          teams={mockTeams}
          hiddenTeamIds={['2']}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.queryByText('Team Beta')).not.toBeInTheDocument();
      expect(screen.getAllByText('Team Gamma')[0]).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onActivateTeam when team is activated', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );
      const activateButtons = screen.getAllByRole('button', { name: /activate team/i });
      fireEvent.click(activateButtons[0]);
      expect(mockOnActivateTeam).toHaveBeenCalledWith('1');
    });
    it('should call onViewDetails when view details is clicked', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );
      const viewDetailsButtons = screen.getAllByRole('button', { name: /view team details/i });
      fireEvent.click(viewDetailsButtons[0]);
      expect(mockOnViewDetails).toHaveBeenCalledWith('1');
    });
    it('should call onHideTeam when team is hidden', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );
      const hideButtons = screen.getAllByRole('button', { name: /hide team/i });
      fireEvent.click(hideButtons[0]);
      expect(mockOnHideTeam).toHaveBeenCalledWith('1');
    });
  });

  describe('Layout Variants', () => {
    it('should render default layout by default', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
    });

    it('should render compact layout when specified', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          layout="compact"
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Team Beta')[0]).toBeInTheDocument();
    });

    it('should render detailed layout when specified', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 2)}
          layout="detailed"
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
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
          teams={mockTeams.slice(0, 1)}
          showRoster={false}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should pass showStats prop to team cards', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 1)}
          showStats={false}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });

    it('should pass showSchedule prop to team cards', () => {
      render(
        <TeamCardList
          teams={mockTeams.slice(0, 1)}
          showSchedule={false}
          onSelectTeam={mockOnSelectTeam}
          onActivateTeam={mockOnActivateTeam}
          onHideTeam={mockOnHideTeam}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getAllByText('Team Alpha')[0]).toBeInTheDocument();
    });
  });
}); 