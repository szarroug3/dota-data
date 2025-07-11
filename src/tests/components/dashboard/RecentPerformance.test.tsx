import { render, screen } from '@testing-library/react';

import { RecentPerformance } from '@/components/dashboard/RecentPerformance';

const mockMatches = [
  { id: '1', win: true },
  { id: '2', win: false },
  { id: '3', win: true },
  { id: '4', win: true },
  { id: '5', win: false },
  { id: '6', win: true }
];

describe('RecentPerformance', () => {
  it('should render win/loss indicators for matches', () => {
    render(<RecentPerformance matches={mockMatches} />);
    
    const winIndicators = screen.getAllByText('W');
    const lossIndicators = screen.getAllByText('L');
    
    expect(winIndicators).toHaveLength(3); // 3 wins in first 5 matches
    expect(lossIndicators).toHaveLength(2); // 2 losses in first 5 matches
  });

  it('should apply correct styling for wins', () => {
    render(<RecentPerformance matches={mockMatches} />);
    
    const winIndicators = screen.getAllByText('W');
    winIndicators.forEach(indicator => {
      expect(indicator).toHaveClass('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
    });
  });

  it('should apply correct styling for losses', () => {
    render(<RecentPerformance matches={mockMatches} />);
    
    const lossIndicators = screen.getAllByText('L');
    lossIndicators.forEach(indicator => {
      expect(indicator).toHaveClass('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
    });
  });

  it('should limit display to 5 matches', () => {
    render(<RecentPerformance matches={mockMatches} />);
    
    const allIndicators = screen.getAllByText(/^[WL]$/);
    expect(allIndicators).toHaveLength(5);
  });

  it('should render empty state when no matches', () => {
    render(<RecentPerformance matches={[]} />);
    
    expect(screen.getByText('No recent matches')).toBeInTheDocument();
  });

  it('should render empty state when matches is undefined', () => {
    render(<RecentPerformance matches={undefined} />);
    
    expect(screen.getByText('No recent matches')).toBeInTheDocument();
  });

  it('should render empty state when matches is null', () => {
    render(<RecentPerformance matches={null as any} />);
    
    expect(screen.getByText('No recent matches')).toBeInTheDocument();
  });

  it('should render with proper styling for match indicators', () => {
    render(<RecentPerformance matches={mockMatches} />);
    
    const indicators = screen.getAllByText(/^[WL]$/);
    indicators.forEach(indicator => {
      expect(indicator).toHaveClass('w-8', 'h-8', 'rounded-full', 'flex', 'items-center', 'justify-center', 'text-xs', 'font-medium');
    });
  });

  it('should render with proper container styling', () => {
    render(<RecentPerformance matches={mockMatches} />);
    
    const container = screen.getAllByText('W')[0].parentElement;
    expect(container).toHaveClass('flex', 'space-x-2');
  });

  it('should render empty state with proper styling', () => {
    render(<RecentPerformance matches={[]} />);
    
    const emptyMessage = screen.getByText('No recent matches');
    expect(emptyMessage).toHaveClass('text-gray-500', 'dark:text-gray-400', 'text-sm');
  });

  it('should handle single match correctly', () => {
    const singleMatch = [{ id: '1', win: true }];
    render(<RecentPerformance matches={singleMatch} />);
    
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.queryByText('L')).not.toBeInTheDocument();
  });

  it('should handle all wins correctly', () => {
    const allWins = [
      { id: '1', win: true },
      { id: '2', win: true },
      { id: '3', win: true }
    ];
    render(<RecentPerformance matches={allWins} />);
    
    const winIndicators = screen.getAllByText('W');
    expect(winIndicators).toHaveLength(3);
    expect(screen.queryByText('L')).not.toBeInTheDocument();
  });

  it('should handle all losses correctly', () => {
    const allLosses = [
      { id: '1', win: false },
      { id: '2', win: false },
      { id: '3', win: false }
    ];
    render(<RecentPerformance matches={allLosses} />);
    
    const lossIndicators = screen.getAllByText('L');
    expect(lossIndicators).toHaveLength(3);
    expect(screen.queryByText('W')).not.toBeInTheDocument();
  });
}); 