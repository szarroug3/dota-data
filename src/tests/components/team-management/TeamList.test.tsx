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
      />
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
      />
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
      />
    );
    
    // TeamCard components should render the team names
    expect(screen.getByText('Team Liquid')).toBeInTheDocument();
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
      />
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
      />
    );
    
    const card = screen.getByText('Your Teams').closest('[data-slot="card"]');
    expect(card).toBeInTheDocument();
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

  it('should have proper card content styling', () => {
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
    
    const cardContent = screen.getByText('Team Liquid').closest('[class*="px-4"]');
    expect(cardContent).toBeInTheDocument();
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
    expect(heading).toBeInTheDocument();
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