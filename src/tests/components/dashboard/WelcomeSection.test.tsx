import { fireEvent, render, screen } from '@testing-library/react';

import { WelcomeSection } from '@/components/dashboard/WelcomeSection';

// Mock the useTeamData hook
jest.mock('@/hooks/use-team-data', () => ({
  useTeamData: () => ({
    teams: [],
    addTeam: jest.fn()
  })
}));

describe('WelcomeSection', () => {
  beforeEach(() => {
    // Clear console.log mock
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the welcome header', () => {
    render(<WelcomeSection />);
    
    expect(screen.getByText('Welcome to Dota Data Analysis')).toBeInTheDocument();
    expect(screen.getByText('Track your team\'s performance, analyze matches, and get draft suggestions')).toBeInTheDocument();
  });

  it('should render the get started card', () => {
    render(<WelcomeSection />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Add your first team to start analyzing performance, tracking matches, and getting draft suggestions.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Your First Team' })).toBeInTheDocument();
  });

  it('should handle add first team button click', () => {
    render(<WelcomeSection />);
    
    const addButton = screen.getByRole('button', { name: 'Add Your First Team' });
    fireEvent.click(addButton);
    
    expect(console.log).toHaveBeenCalledWith('Navigate to team management');
  });

  it('should render all feature preview cards', () => {
    render(<WelcomeSection />);
    
    expect(screen.getByText('Match History')).toBeInTheDocument();
    expect(screen.getByText('Player Performance')).toBeInTheDocument();
    expect(screen.getByText('Draft Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Team Analytics')).toBeInTheDocument();
  });

  it('should render feature card descriptions', () => {
    render(<WelcomeSection />);
    
    expect(screen.getByText('Analyze your team\'s match performance with detailed statistics and insights.')).toBeInTheDocument();
    expect(screen.getByText('Track individual player statistics and hero performance across matches.')).toBeInTheDocument();
    expect(screen.getByText('Get meta insights and draft recommendations based on current trends.')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive team performance analytics and trend analysis.')).toBeInTheDocument();
  });

  it('should render feature card icons', () => {
    render(<WelcomeSection />);
    
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    render(<WelcomeSection />);
    
    const container = screen.getByText('Welcome to Dota Data Analysis').closest('.max-w-4xl');
    expect(container).toBeInTheDocument();
    
    const getStartedCard = screen.getByText('Get Started').closest('.bg-white');
    expect(getStartedCard).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-lg');
    
    const featureGrid = screen.getByText('📊').closest('.grid');
    expect(featureGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-6');
  });

  it('should render the add team button with proper styling', () => {
    render(<WelcomeSection />);
    
    const addButton = screen.getByRole('button', { name: 'Add Your First Team' });
    expect(addButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white', 'font-medium', 'py-3', 'px-6', 'rounded-lg', 'transition-colors');
  });
});

describe('FeatureCard', () => {
  it('should render feature card with proper props', () => {
    render(<WelcomeSection />);
    
    const matchHistoryCard = screen.getByText('Match History').closest('.bg-white');
    expect(matchHistoryCard).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-md', 'p-6', 'hover:shadow-lg', 'transition-shadow');
  });

  it('should render feature card with icon, title, and description', () => {
    render(<WelcomeSection />);
    
    // Check that each feature card has all required elements
    const cards = screen.getAllByText(/📊|👤|🎯|📈/);
    expect(cards).toHaveLength(4);
    
    const titles = screen.getAllByText(/Match History|Player Performance|Draft Suggestions|Team Analytics/);
    expect(titles).toHaveLength(4);
  });
}); 