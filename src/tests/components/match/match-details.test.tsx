import { render, screen } from '@testing-library/react';

import { MatchDetails } from '@/components/match/match-details';
import { useMatchDetails } from '@/components/match/match-details/useMatchDetails';

// Mock the useMatchDetails hook
jest.mock('@/components/match/match-details/useMatchDetails', () => ({
  useMatchDetails: jest.fn()
}));

const mockUseMatchDetails = jest.mocked(useMatchDetails);

describe('MatchDetails', () => {
  const mockMatchDetails = {
    id: '12345',
    duration: 2847,
    winner: 'radiant' as const,
    radiantScore: 35,
    direScore: 28,
    gameMode: 'All Pick',
    patch: '7.34e',
    startTime: '2024-01-15T14:30:00Z',
    endTime: '2024-01-15T15:17:27Z',
    players: [
      {
        playerId: '1',
        playerName: 'Player1',
        heroId: '1',
        heroName: 'Anti-Mage',
        kills: 12,
        deaths: 2,
        assists: 8,
        kda: 10.0,
        gpm: 687,
        xpm: 698,
        lastHits: 312,
        denies: 18,
        netWorth: 25840,
        heroDamage: 31250,
        heroHealing: 0,
        towerDamage: 8920,
        items: ['Manta Style', 'Butterfly'],
        level: 25,
        side: 'radiant' as const
      }
    ],
    timeline: [
      {
        timestamp: 180,
        event: 'kill',
        player: 'Player1',
        hero: 'Anti-Mage',
        description: 'First blood on enemy carry',
        importance: 'high' as const
      }
    ],
    totalKills: 63,
    totalDeaths: 63,
    totalAssists: 142,
    objectives: {
      towers: { radiant: 8, dire: 3 },
      barracks: { radiant: 2, dire: 0 },
      roshan: 2
    },
    bans: [
      { heroId: '11', heroName: 'Invoker', team: 'radiant' as const, order: 1 }
    ],
    picks: [
      { heroId: '1', heroName: 'Anti-Mage', team: 'radiant' as const, order: 1, playerId: '1', playerName: 'Player1' }
    ]
  };

  const mockHookReturn = {
    matchDetails: mockMatchDetails,
    isLoading: false,
    error: null,
    currentLevel: 'basic' as const,
    setCurrentLevel: jest.fn(),
    formatDuration: jest.fn((seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`),
    formatTimestamp: jest.fn((timestamp: number) => `${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}`),
    formatNumber: jest.fn((num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()),
    getKDAColor: jest.fn((kda: number) => kda >= 3 ? 'text-green-600' : 'text-red-600'),
    getEventIcon: jest.fn((event: string) => event === 'kill' ? '⚔️' : '📝')
  };

  beforeEach(() => {
    mockUseMatchDetails.mockReturnValue(mockHookReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render match details with basic level', () => {
    render(<MatchDetails matchId="12345" level="basic" />);
    
    expect(screen.getByText('Match #12345')).toBeInTheDocument();
    expect(screen.getByText('Player Performance')).toBeInTheDocument();
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('Anti-Mage')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    mockUseMatchDetails.mockReturnValue({
      ...mockHookReturn,
      isLoading: true
    });

    render(<MatchDetails matchId="12345" />);
    
    // The LoadingSkeleton should be rendered
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseMatchDetails.mockReturnValue({
      ...mockHookReturn,
      error: 'Failed to load match details'
    });

    render(<MatchDetails matchId="12345" />);
    
    expect(screen.getByText('Error loading match details')).toBeInTheDocument();
    expect(screen.getByText('Failed to load match details')).toBeInTheDocument();
  });

  it('should render not found state', () => {
    mockUseMatchDetails.mockReturnValue({
      ...mockHookReturn,
      matchDetails: null
    });

    render(<MatchDetails matchId="12345" />);
    
    expect(screen.getByText('Match not found')).toBeInTheDocument();
  });

  it('should render detail level controls', () => {
    render(<MatchDetails matchId="12345" />);
    
    expect(screen.getByText('Detail Level')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('should render draft phase section for advanced level', () => {
    mockUseMatchDetails.mockReturnValue({
      ...mockHookReturn,
      currentLevel: 'advanced'
    });

    render(<MatchDetails matchId="12345" level="advanced" />);
    
    expect(screen.getByText('Draft Phase')).toBeInTheDocument();
    expect(screen.getByText('Picks')).toBeInTheDocument();
    expect(screen.getByText('Bans')).toBeInTheDocument();
  });

  it('should render timeline for expert level', () => {
    mockUseMatchDetails.mockReturnValue({
      ...mockHookReturn,
      currentLevel: 'expert'
    });

    render(<MatchDetails matchId="12345" level="expert" />);
    
    expect(screen.getByText('Match Timeline')).toBeInTheDocument();
  });
}); 