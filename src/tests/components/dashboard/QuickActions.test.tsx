import { fireEvent, render, screen } from '@testing-library/react';

import { QuickActions } from '@/components/dashboard/QuickActions';

// Mock console.log to test the action handlers
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('QuickActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should render the quick actions section', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('Add Match')).toBeInTheDocument();
    expect(screen.getByText('Team Analysis')).toBeInTheDocument();
    expect(screen.getByText('Draft Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Player Stats')).toBeInTheDocument();
    expect(screen.getByText('Match History')).toBeInTheDocument();
  });

  it('should render action button descriptions', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('Add a new match to track')).toBeInTheDocument();
    expect(screen.getByText('View detailed team performance')).toBeInTheDocument();
    expect(screen.getByText('Get meta insights and recommendations')).toBeInTheDocument();
    expect(screen.getByText('View individual player performance')).toBeInTheDocument();
    expect(screen.getByText('Browse all team matches')).toBeInTheDocument();
  });

  it('should render action button icons', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('➕')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('📜')).toBeInTheDocument();
  });

  it('should handle add match action', () => {
    render(<QuickActions />);
    
    const addMatchButton = screen.getByText('Add Match').closest('button');
    expect(addMatchButton).toBeInTheDocument();
    
    // Test that button is clickable without error
    expect(() => fireEvent.click(addMatchButton!)).not.toThrow();
  });

  it('should handle team analysis action', () => {
    render(<QuickActions />);
    
    const analysisButton = screen.getByText('Team Analysis').closest('button');
    expect(analysisButton).toBeInTheDocument();
    
    // Test that button is clickable without error
    expect(() => fireEvent.click(analysisButton!)).not.toThrow();
  });

  it('should handle draft suggestions action', () => {
    render(<QuickActions />);
    
    const draftButton = screen.getByText('Draft Suggestions').closest('button');
    expect(draftButton).toBeInTheDocument();
    
    // Test that button is clickable without error
    expect(() => fireEvent.click(draftButton!)).not.toThrow();
  });

  it('should handle player stats action', () => {
    render(<QuickActions />);
    
    const statsButton = screen.getByText('Player Stats').closest('button');
    expect(statsButton).toBeInTheDocument();
    
    // Test that button is clickable without error
    expect(() => fireEvent.click(statsButton!)).not.toThrow();
  });

  it('should handle match history action', () => {
    render(<QuickActions />);
    
    const historyButton = screen.getByText('Match History').closest('button');
    expect(historyButton).toBeInTheDocument();
    
    // Test that button is clickable without error
    expect(() => fireEvent.click(historyButton!)).not.toThrow();
  });

  it('should have primary styling for add match button', () => {
    render(<QuickActions />);
    
    const addMatchButton = screen.getByText('Add Match').closest('button');
    expect(addMatchButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'border-blue-600');
  });

  it('should have secondary styling for other buttons', () => {
    render(<QuickActions />);
    
    const analysisButton = screen.getByText('Team Analysis').closest('button');
    expect(analysisButton).toHaveClass('bg-gray-50', 'dark:bg-gray-700', 'hover:bg-gray-100', 'dark:hover:bg-gray-600');
  });

  it('should render with proper container styling', () => {
    render(<QuickActions />);
    
    const container = screen.getByText('Quick Actions').closest('div');
    expect(container).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-md', 'p-6');
  });
}); 