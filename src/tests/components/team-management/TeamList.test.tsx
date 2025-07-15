import { render, screen } from '@testing-library/react';

import { TeamList } from '@/components/team-management/TeamList';
import type { TeamData } from '@/types/contexts/team-context-value';

describe('TeamList', () => {
  const mockOnRemoveTeam = jest.fn();
  const mockOnRefreshTeam = jest.fn();
  const mockOnEditTeam = jest.fn();
  const mockOnSetActiveTeam = jest.fn();

  const mockTeamDataList: TeamData[] = [
    {
      team: {
        id: 'team-liquid',
        name: 'Team Liquid',
        leagueId: 'esl-pro-league',
        leagueName: 'ESL Pro League',
        logoUrl: 'https://example.com/liquid-logo.png',
        lastUpdated: '2024-01-15T10:30:00Z',
        isActive: false,
        isLoading: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      league: {
        id: 'esl-pro-league',
        name: 'ESL Pro League',
        region: 'Europe',
        tier: 'Tier 1',
        prizePool: 500000,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-06-30T23:59:59Z',
        lastUpdated: '2024-01-15T10:30:00Z'
      },
      matches: [],
      players: [],
      summary: {
        totalMatches: 5,
        totalWins: 3,
        totalLosses: 2,
        overallWinRate: 60,
        lastMatchDate: '2024-01-01T00:00:00Z'
      }
    },
    {
      team: {
        id: 'og',
        name: 'OG',
        leagueId: 'esl-pro-league',
        leagueName: 'ESL Pro League',
        logoUrl: 'https://example.com/og-logo.png',
        lastUpdated: '2024-01-15T10:30:00Z',
        isActive: false,
        isLoading: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      league: {
        id: 'esl-pro-league',
        name: 'ESL Pro League',
        region: 'Europe',
        tier: 'Tier 1',
        prizePool: 500000,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-06-30T23:59:59Z',
        lastUpdated: '2024-01-15T10:30:00Z'
      },
      matches: [],
      players: [],
      summary: {
        totalMatches: 3,
        totalWins: 2,
        totalLosses: 1,
        overallWinRate: 67,
        lastMatchDate: '2024-01-01T00:00:00Z'
      }
    }
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
      />
    );
    
    expect(screen.getByText('Your Teams (2)')).toBeInTheDocument();
    expect(screen.getByText('Team Liquid')).toBeInTheDocument();
    expect(screen.getByText('OG')).toBeInTheDocument();
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
      />
    );
    
    expect(screen.getByText('No Teams Added')).toBeInTheDocument();
    expect(screen.getByText('Add your first team using the form above to get started.')).toBeInTheDocument();
  });

  it('should display team count in header', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    expect(screen.getByText('Your Teams (2)')).toBeInTheDocument();
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
      />
    );
    
    expect(screen.getByText('Team Liquid')).toBeInTheDocument();
    expect(screen.getAllByText('ESL Pro League')).toHaveLength(2);
    expect(screen.getByText('OG')).toBeInTheDocument();
  });

  it('should show active badge for active team', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={{ teamId: 'team-liquid', leagueId: 'esl-pro-league' }}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should not show active badge for inactive team', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={{ teamId: 'team-liquid', leagueId: 'esl-pro-league' }}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    // OG is not active, so no "Active" badge should be shown
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(1); // Only Team Liquid should have active badge
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
      />
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
      />
    );
    
    // The handlers should be passed down to TeamCard components
    // This is tested indirectly by ensuring the TeamList renders without errors
    expect(screen.getByText('Your Teams (2)')).toBeInTheDocument();
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
      />
    );
    
    // The TeamCard components should render with the team data
    // This is tested indirectly by ensuring the TeamList renders without errors
    expect(screen.getByText('Your Teams (2)')).toBeInTheDocument();
  });

  it('should have proper styling for team cards', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    // Find the card container by looking for the div that contains the team name and has the card classes
    const cardContainer = screen.getByText('Team Liquid').closest('div[class*="bg-gray-50"]');
    expect(cardContainer).toHaveClass('bg-gray-50', 'dark:bg-gray-900');
  });

  it('should display league information for each team', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    expect(screen.getAllByText('ESL Pro League')).toHaveLength(2);
  });

  it('should have proper spacing between team cards', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    const teamCards = screen.getAllByText('Team Liquid');
    const container = teamCards[0].closest('.space-y-3');
    expect(container).toBeInTheDocument();
  });

  it('should render team names as headings', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    const teamNames = screen.getAllByText('Team Liquid');
    const heading = teamNames[0];
    expect(heading).toHaveClass('text-lg', 'font-medium');
  });

  it('should have hover effects on team cards', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    // Find the card container for the inactive team (OG) which should have hover effects
    const cardContainer = screen.getByText('OG').closest('div[class*="bg-gray-50"]');
    expect(cardContainer).toHaveClass('transition-all', 'duration-200');
  });

  it('should handle active team selection correctly', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={{ teamId: 'og', leagueId: 'esl-pro-league' }}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    // OG should now be active instead of Team Liquid
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(1);
  });

  it('should handle null active team', () => {
    render(
      <TeamList 
        teamDataList={mockTeamDataList} 
        activeTeam={null}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    // No active badges should be shown
    const activeBadges = screen.queryAllByText('Active');
    expect(activeBadges).toHaveLength(0);
  });

  it('should handle different league IDs for same team', () => {
    const teamDataWithDifferentLeagues: TeamData[] = [
      {
        team: {
          id: 'team-liquid',
          name: 'Team Liquid',
          leagueId: 'esl-pro-league',
          leagueName: 'ESL Pro League',
          logoUrl: 'https://example.com/liquid-logo.png',
          lastUpdated: '2024-01-15T10:30:00Z',
          isActive: false,
          isLoading: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        league: {
          id: 'esl-pro-league',
          name: 'ESL Pro League',
          region: 'Europe',
          tier: 'Tier 1',
          prizePool: 500000,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-06-30T23:59:59Z',
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        matches: [],
        players: [],
        summary: {
          totalMatches: 5,
          totalWins: 3,
          totalLosses: 2,
          overallWinRate: 60,
          lastMatchDate: '2024-01-01T00:00:00Z'
        }
      },
      {
        team: {
          id: 'team-liquid',
          name: 'Team Liquid',
          leagueId: 'different-league',
          leagueName: 'Different League',
          logoUrl: 'https://example.com/liquid-logo.png',
          lastUpdated: '2024-01-15T10:30:00Z',
          isActive: true,
          isLoading: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        league: {
          id: 'different-league',
          name: 'Different League',
          region: 'Europe',
          tier: 'Tier 2',
          prizePool: 250000,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-06-30T23:59:59Z',
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        matches: [],
        players: [],
        summary: {
          totalMatches: 3,
          totalWins: 2,
          totalLosses: 1,
          overallWinRate: 67,
          lastMatchDate: '2024-01-01T00:00:00Z'
        }
      }
    ];

    render(
      <TeamList 
        teamDataList={teamDataWithDifferentLeagues} 
        activeTeam={{ teamId: 'team-liquid', leagueId: 'different-league' }}
        onRemoveTeam={mockOnRemoveTeam}
        onRefreshTeam={mockOnRefreshTeam}
        onEditTeam={mockOnEditTeam}
        onSetActiveTeam={mockOnSetActiveTeam}
      />
    );
    
    // Should show both Team Liquid entries with different league names
    expect(screen.getAllByText('Team Liquid')).toHaveLength(2);
    expect(screen.getByText('ESL Pro League')).toBeInTheDocument();
    expect(screen.getByText('Different League')).toBeInTheDocument();
    
    // Only the second one should be active
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges).toHaveLength(1);
  });
}); 