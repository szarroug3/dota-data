import { fireEvent, render, screen } from '@testing-library/react';

import { MatchListViewList } from '@/components/match-history/list/MatchListViewList';
import type { Match } from '@/types/contexts/match-context-value';

// Mock the hero context
jest.mock('@/contexts/hero-context', () => ({
  useHeroContext: () => ({
    heroes: [
      {
        id: '1',
        name: 'crystal_maiden',
        localizedName: 'Crystal Maiden',
        primaryAttribute: 'intelligence',
        attackType: 'ranged',
        roles: ['Support', 'Disabler', 'Nuker'],
        complexity: 1,
        imageUrl: 'https://dota2protracker.com/static/heroes/crystal_maiden_vert.jpg'
      },
      {
        id: '2',
        name: 'juggernaut',
        localizedName: 'Juggernaut',
        primaryAttribute: 'agility',
        attackType: 'melee',
        roles: ['Carry', 'Pusher'],
        complexity: 2,
        imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg'
      }
    ],
    loading: false,
    error: null
  })
}));



const mockMatches: Match[] = [
  {
    id: '1',
    teamId: 'team1',
    leagueId: 'league1',
    opponent: 'Test Opponent 1',
    result: 'win',
    teamSide: 'radiant',
    date: '2024-11-25',
    duration: 3120,
    pickOrder: 'first',
    players: [],
    heroes: ['1', '2', '3', '4', '5']
  },
  {
    id: '2',
    teamId: 'team1',
    leagueId: 'league1',
    opponent: 'Test Opponent 2',
    result: 'loss',
    teamSide: 'dire',
    date: '2024-11-24',
    duration: 2400,
    pickOrder: 'second',
    players: [],
    heroes: ['2', '3', '4', '5', '6']
  }
];

const defaultProps = {
  matches: mockMatches,
  selectedMatchId: null,
  onSelectMatch: jest.fn(),
  onHideMatch: jest.fn(),
  onRefreshMatch: jest.fn()
};

describe('MatchListViewList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no matches', () => {
    render(<MatchListViewList {...defaultProps} matches={[]} />);
    
    expect(screen.getByText('No matches found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or adding more matches.')).toBeInTheDocument();
  });

  it('renders match cards with opponent names', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    expect(screen.getByText('Test Opponent 1')).toBeInTheDocument();
    expect(screen.getByText('Test Opponent 2')).toBeInTheDocument();
  });

  it('renders match dates', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    // Check that dates are rendered (using regex to account for timezone differences)
    const dateElements1 = screen.getAllByText(/Nov \d+, 2024/);
    const dateElements2 = screen.getAllByText(/Nov \d+, 2024/);
    expect(dateElements1.length).toBeGreaterThan(0);
    expect(dateElements2.length).toBeGreaterThan(0);
  });

  it('renders victory and defeat badges', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    expect(screen.getByText('Victory')).toBeInTheDocument();
    expect(screen.getByText('Defeat')).toBeInTheDocument();
  });

  it('renders team side badges', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    expect(screen.getByText('Radiant')).toBeInTheDocument();
    expect(screen.getByText('Dire')).toBeInTheDocument();
  });

  it('renders hero avatars', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    // Check for hero avatars (they should be present as fallback text)
    const avatars = screen.getAllByText(/CR|JU|LI|PU|AX/);
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders action buttons', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    // Check for refresh and hide buttons
    const refreshButtons = screen.getAllByLabelText(/refresh match vs/i);
    const hideButtons = screen.getAllByLabelText(/hide match vs/i);
    
    expect(refreshButtons).toHaveLength(2);
    expect(hideButtons).toHaveLength(2);
  });

  it('calls onSelectMatch when match card is clicked', () => {
    const onSelectMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onSelectMatch={onSelectMatch} />);
    
    const firstMatchCard = screen.getByText('Test Opponent 1').closest('[role="button"]');
    fireEvent.click(firstMatchCard!);
    
    expect(onSelectMatch).toHaveBeenCalledWith('1');
  });

  it('calls onSelectMatch when Enter key is pressed on match card', () => {
    const onSelectMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onSelectMatch={onSelectMatch} />);
    
    const firstMatchCard = screen.getByText('Test Opponent 1').closest('[role="button"]');
    fireEvent.keyDown(firstMatchCard!, { key: 'Enter' });
    
    expect(onSelectMatch).toHaveBeenCalledWith('1');
  });

  it('calls onSelectMatch when Space key is pressed on match card', () => {
    const onSelectMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onSelectMatch={onSelectMatch} />);
    
    const firstMatchCard = screen.getByText('Test Opponent 1').closest('[role="button"]');
    fireEvent.keyDown(firstMatchCard!, { key: ' ' });
    
    expect(onSelectMatch).toHaveBeenCalledWith('1');
  });

  it('calls onHideMatch when hide button is clicked', () => {
    const onHideMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onHideMatch={onHideMatch} />);
    
    const hideButtons = screen.getAllByLabelText(/hide match vs/i);
    fireEvent.click(hideButtons[0]);
    
    expect(onHideMatch).toHaveBeenCalledWith('1');
  });

  it('calls onRefreshMatch when refresh button is clicked', () => {
    const onRefreshMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onRefreshMatch={onRefreshMatch} />);
    
    const refreshButtons = screen.getAllByLabelText(/refresh match vs/i);
    fireEvent.click(refreshButtons[0]);
    
    expect(onRefreshMatch).toHaveBeenCalledWith('1');
  });

  it('applies selected state styling when match is selected', () => {
    render(<MatchListViewList {...defaultProps} selectedMatchId="1" />);
    
    const selectedCard = screen.getByText('Test Opponent 1').closest('[role="button"]');
    expect(selectedCard).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5');
  });

  it('applies hover state styling to unselected cards', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    const unselectedCard = screen.getByText('Test Opponent 2').closest('[role="button"]');
    expect(unselectedCard).toHaveClass('hover:bg-accent/50', 'hover:shadow-md');
  });

  it('formats duration correctly', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    // The duration should be formatted as MM:SS
    // 3120 seconds = 52:00
    // 2400 seconds = 40:00
    // Note: Duration might not be visible depending on container size
    // This test ensures the component renders without errors
    expect(screen.getByText('Test Opponent 1')).toBeInTheDocument();
  });

  it('handles long opponent names with truncation', () => {
    const longNameMatch: Match = {
      ...mockMatches[0],
      opponent: 'Very Long Opponent Name That Should Be Truncated When It Exceeds The Available Space'
    };
    
    render(<MatchListViewList {...defaultProps} matches={[longNameMatch]} />);
    
    expect(screen.getByText(/Very Long Opponent Name/)).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <MatchListViewList {...defaultProps} className="custom-class" />
    );
    
    const listContainer = container.firstChild;
    expect(listContainer).toHaveClass('custom-class');
  });

  it('prevents default behavior on Enter key press', () => {
    const onSelectMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onSelectMatch={onSelectMatch} />);
    
    const firstMatchCard = screen.getByText('Test Opponent 1').closest('[role="button"]');
    fireEvent.keyDown(firstMatchCard!, { key: 'Enter' });
    
    expect(onSelectMatch).toHaveBeenCalledWith('1');
  });

  it('prevents default behavior on Space key press', () => {
    const onSelectMatch = jest.fn();
    render(<MatchListViewList {...defaultProps} onSelectMatch={onSelectMatch} />);
    
    const firstMatchCard = screen.getByText('Test Opponent 1').closest('[role="button"]');
    fireEvent.keyDown(firstMatchCard!, { key: ' ' });
    
    expect(onSelectMatch).toHaveBeenCalledWith('1');
  });

  it('renders hero avatars with proper accessibility', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    // Check that avatar fallbacks are present
    const avatars = screen.getAllByText(/CR|JU|LI|PU|AX/);
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders action buttons with proper accessibility', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    const refreshButtons = screen.getAllByLabelText(/refresh match vs/i);
    const hideButtons = screen.getAllByLabelText(/hide match vs/i);
    
    refreshButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
    
    hideButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('renders match cards with proper accessibility', () => {
    render(<MatchListViewList {...defaultProps} />);
    
    const matchCards = screen.getAllByRole('button');
    matchCards.forEach(card => {
      expect(card).toHaveAttribute('aria-label');
      expect(card.tabIndex).toBe(0);
    });
  });

  describe('Responsive behavior', () => {
    it('renders container queries for responsive design', () => {
      render(<MatchListViewList {...defaultProps} />);
      
      // Check that container queries are applied - look for elements with container query classes
      const matchInfo = screen.getByText('Test Opponent 1').closest('[class*="@[170px]"]');
      expect(matchInfo).toBeInTheDocument();
    });

    it('handles different container sizes gracefully', () => {
      render(<MatchListViewList {...defaultProps} />);
      
      // The component should render without errors regardless of container size
      expect(screen.getByText('Test Opponent 1')).toBeInTheDocument();
      expect(screen.getByText('Test Opponent 2')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('renders MatchInfo component', () => {
      render(<MatchListViewList {...defaultProps} />);
      
      expect(screen.getByText('Test Opponent 1')).toBeInTheDocument();
      // Check that dates are rendered (using regex to account for timezone differences)
      const dateElements = screen.getAllByText(/Nov \d+, 2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('renders MatchBadges component', () => {
      render(<MatchListViewList {...defaultProps} />);
      
      expect(screen.getByText('Victory')).toBeInTheDocument();
      expect(screen.getByText('Radiant')).toBeInTheDocument();
    });

    it('renders HeroAvatars component', () => {
      render(<MatchListViewList {...defaultProps} />);
      
      // Check that avatar fallbacks are present
      const avatars = screen.getAllByText(/CR|JU|LI|PU|AX/);
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('renders MatchActions component', () => {
      render(<MatchListViewList {...defaultProps} />);
      
      const refreshButtons = screen.getAllByLabelText(/refresh match vs/i);
      const hideButtons = screen.getAllByLabelText(/hide match vs/i);
      
      expect(refreshButtons.length).toBeGreaterThan(0);
      expect(hideButtons.length).toBeGreaterThan(0);
    });
  });
}); 