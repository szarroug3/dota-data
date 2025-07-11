import { render, screen } from '@testing-library/react';

import { PerformanceHighlights } from '@/components/dashboard/PerformanceHighlights';
import { useTeamData } from '@/hooks/use-team-data';

// Mock the hooks
jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: jest.fn()
}));

const mockUseTeamData = jest.mocked(useTeamData);

// Define mock teams
const mockTeams = [
  {
    id: '1',
    name: 'Team Alpha',
    leagueId: 'league-1',
    leagueName: 'Professional League',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Team Beta',
    leagueId: 'league-2',
    leagueName: 'Amateur League',
    isActive: true,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  }
];

const mockTeamData = {
  team: mockTeams[0],
  matches: [],
  players: [],
  summary: {
    totalMatches: 50,
    totalWins: 35,
    totalLosses: 15,
    overallWinRate: 70.0,
    lastMatchDate: '2023-01-01T00:00:00Z'
  }
};

// Mock team stats matching the ContextTeamStats interface
const mockTeamStats = {
  totalMatches: 20,
  wins: 15,
  losses: 5,
  winRate: 75.0,
  averageMatchDuration: 2400,
  mostPlayedHeroes: [
    {
      heroId: '1',
      heroName: 'Anti-Mage',
      gamesPlayed: 10,
      wins: 8,
      winRate: 80.0
    }
  ],
  recentPerformance: [
    {
      period: '2023-01-01',
      wins: 3,
      losses: 2,
      winRate: 60.0
    }
  ]
};

describe('PerformanceHighlights', () => {
  beforeEach(() => {
    // Setup mocks
    (useTeamData as jest.Mock).mockReturnValue({
      teams: mockTeams,
      activeTeamId: '1',
      activeTeam: mockTeams[0],
      teamData: mockTeamData,
      teamStats: mockTeamStats,
      isLoadingTeams: false,
      isLoadingTeamData: false,
      isLoadingTeamStats: false,
      teamsError: null,
      teamDataError: null,
      teamStatsError: null,
      setActiveTeam: jest.fn(),
      addTeam: jest.fn(),
      removeTeam: jest.fn(),
      refreshTeam: jest.fn(),
      updateTeam: jest.fn(),
      clearErrors: jest.fn()
    });
  });

  it('should render performance highlights', () => {
    render(<PerformanceHighlights />);
    expect(screen.getByText('Performance Highlights')).toBeInTheDocument();
  });

  it('should display best performing hero', () => {
    render(<PerformanceHighlights />);
    expect(screen.getByText('Best Performing Hero')).toBeInTheDocument();
    expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
  });

  it('should display recent trend', () => {
    render(<PerformanceHighlights />);
    expect(screen.getByText('Recent Trend')).toBeInTheDocument();
    expect(screen.getByText('Improving')).toBeInTheDocument();
  });

  it('should display most played hero', () => {
    render(<PerformanceHighlights />);
    expect(screen.getByText('Most Played Hero')).toBeInTheDocument();
    expect(screen.getByText('Crystal Maiden')).toBeInTheDocument();
  });

  it('should display key statistic', () => {
    render(<PerformanceHighlights />);
    expect(screen.getByText('Key Statistic')).toBeInTheDocument();
    expect(screen.getByText('Won 3 of last 5 matches')).toBeInTheDocument();
  });

  it('should display performance highlights with mock data', () => {
    render(<PerformanceHighlights />);
    
    expect(screen.getByText('Performance Highlights')).toBeInTheDocument();
    expect(screen.getByText('Best Performing Hero')).toBeInTheDocument();
    expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
    expect(screen.getByText('15 games • 73.3% win rate')).toBeInTheDocument();
  });

  it('should show empty state when no team data', () => {
    mockUseTeamData.mockReturnValue({
      teams: [],
      activeTeam: null,
      activeTeamId: null,
      teamData: null,
      teamStats: null,
      isLoadingTeams: false,
      isLoadingTeamData: false,
      isLoadingTeamStats: false,
      teamsError: null,
      teamDataError: null,
      teamStatsError: null,
      setActiveTeam: jest.fn(),
      addTeam: jest.fn(),
      removeTeam: jest.fn(),
      refreshTeam: jest.fn(),
      updateTeam: jest.fn(),
      clearErrors: jest.fn()
    });

    render(<PerformanceHighlights />);
    
    expect(screen.getByText('Add matches to see highlights')).toBeInTheDocument();
  });
}); 