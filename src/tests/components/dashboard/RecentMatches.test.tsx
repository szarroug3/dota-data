import { fireEvent, render, screen } from '@testing-library/react';

import { RecentMatches } from '@/components/dashboard/RecentMatches';

const mockMatches = [
  {
    id: '1',
    opponentTeamName: 'Team Alpha',
    win: true,
    date: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    opponentTeamName: 'Team Beta',
    win: false,
    date: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    opponentTeamName: 'Team Gamma',
    win: true,
    date: '2024-01-13T20:45:00Z'
  },
  {
    id: '4',
    opponentTeamName: 'Team Delta',
    win: false,
    date: '2024-01-12T12:15:00Z'
  },
  {
    id: '5',
    opponentTeamName: 'Team Epsilon',
    win: true,
    date: '2024-01-11T18:00:00Z'
  },
  {
    id: '6',
    opponentTeamName: 'Team Zeta',
    win: false,
    date: '2024-01-10T09:30:00Z'
  }
];

describe('RecentMatches', () => {
  it('should render recent matches with data', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    expect(screen.getByText('Recent Matches')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();
  });

  it('should display win/loss indicators correctly', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    const winIndicators = screen.getAllByText('W');
    const lossIndicators = screen.getAllByText('L');
    
    expect(winIndicators).toHaveLength(3); // 3 wins in mock data
    expect(lossIndicators).toHaveLength(2); // 2 losses in mock data
  });

  it('should apply correct styling for wins', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    const winIndicator = screen.getAllByText('W')[0];
    expect(winIndicator).toHaveClass('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
  });

  it('should apply correct styling for losses', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    const lossIndicator = screen.getAllByText('L')[0];
    expect(lossIndicator).toHaveClass('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
  });

  it('should format dates correctly', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    // Check that dates are formatted as locale strings
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
    expect(screen.getByText('1/14/2024')).toBeInTheDocument();
  });

  it('should limit display to 5 matches', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    // Should show first 5 matches
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    expect(screen.getByText('Team Delta')).toBeInTheDocument();
    expect(screen.getByText('Team Epsilon')).toBeInTheDocument();
    
    // Should not show the 6th match
    expect(screen.queryByText('Team Zeta')).not.toBeInTheDocument();
  });

  it('should render "View All Matches" button', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    expect(screen.getByText('View All Matches')).toBeInTheDocument();
  });

  it('should call onViewAll when "View All Matches" is clicked', () => {
    const mockOnViewAll = jest.fn();
    render(<RecentMatches recentMatches={mockMatches} onViewAll={mockOnViewAll} />);
    
    const viewAllButton = screen.getByText('View All Matches');
    fireEvent.click(viewAllButton);
    
    expect(mockOnViewAll).toHaveBeenCalledTimes(1);
  });

  it('should render empty state when no matches', () => {
    render(<RecentMatches recentMatches={[]} />);
    
    expect(screen.getByText('No matches found. Add your first match to get started!')).toBeInTheDocument();
    expect(screen.getByText('Add Match')).toBeInTheDocument();
  });

  it('should call onAddMatch when "Add Match" is clicked in empty state', () => {
    const mockOnAddMatch = jest.fn();
    render(<RecentMatches recentMatches={[]} onAddMatch={mockOnAddMatch} />);
    
    const addMatchButton = screen.getByText('Add Match');
    fireEvent.click(addMatchButton);
    
    expect(mockOnAddMatch).toHaveBeenCalledTimes(1);
  });

  it('should render empty state when recentMatches is undefined', () => {
    render(<RecentMatches recentMatches={undefined as any} />);
    
    expect(screen.getByText('No matches found. Add your first match to get started!')).toBeInTheDocument();
  });

  it('should render empty state when recentMatches is null', () => {
    render(<RecentMatches recentMatches={null as any} />);
    
    expect(screen.getByText('No matches found. Add your first match to get started!')).toBeInTheDocument();
  });

  it('should render with proper container styling', () => {
    render(<RecentMatches recentMatches={mockMatches} />);
    
    const container = screen.getByText('Recent Matches').closest('div')?.parentElement;
    expect(container).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-md', 'p-6');
  });
}); 