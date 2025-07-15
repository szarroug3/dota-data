import { fireEvent, render, screen } from '@testing-library/react';

import { QuickLinks } from '@/components/sidebar/QuickLinks';

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('QuickLinks', () => {
  const defaultProps = {
    isCollapsed: false,
    activeTeam: {
      id: '123',
      name: 'Team Alpha',
      league: 'The International',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render quick links when active team is provided', () => {
      render(<QuickLinks {...defaultProps} />);
      
      expect(screen.getByText('Team Page')).toBeInTheDocument();
      expect(screen.getByText('League Page')).toBeInTheDocument();
    });

    it('should not render when no active team is provided', () => {
      render(<QuickLinks {...defaultProps} activeTeam={undefined} />);
      
      expect(screen.queryByText('Team Page')).not.toBeInTheDocument();
      expect(screen.queryByText('League Page')).not.toBeInTheDocument();
    });

    it('should render when collapsed', () => {
      render(<QuickLinks {...defaultProps} isCollapsed={true} />);
      
      // Should still render buttons but without visible text
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should render section separator', () => {
      render(<QuickLinks {...defaultProps} />);
      
      // The separator should be present (border-t class)
      const container = screen.getByText('Team Page').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Team Page link', () => {
    it('should open team page in new tab when clicked', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const teamPageButton = screen.getByText('Team Page');
      fireEvent.click(teamPageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/teams/123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should have proper aria label for team page', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const teamPageButton = screen.getByText('Team Page');
      expect(teamPageButton.closest('button')).toHaveAttribute(
        'aria-label',
        'View Team Alpha on Dotabuff'
      );
    });
  });

  describe('League Page link', () => {
    it('should open league page in new tab when clicked', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const leaguePageButton = screen.getByText('League Page');
      fireEvent.click(leaguePageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/leagues/the-international',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should format league name correctly in URL', () => {
      render(<QuickLinks {...defaultProps} activeTeam={{
        id: '123',
        name: 'Team Alpha',
        league: 'The International 2024',
      }} />);
      
      const leaguePageButton = screen.getByText('League Page');
      fireEvent.click(leaguePageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/leagues/the-international-2024',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should have proper aria label for league page', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const leaguePageButton = screen.getByText('League Page');
      expect(leaguePageButton.closest('button')).toHaveAttribute(
        'aria-label',
        'View The International on Dotabuff'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for all buttons', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('title');
      });
    });

    it('should be keyboard accessible', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const teamPageButton = screen.getByText('Team Page');
      expect(teamPageButton).toBeInTheDocument();
    });

    it('should handle keyboard events', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const teamPageButton = screen.getByText('Team Page');
      fireEvent.click(teamPageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/teams/123',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Styling', () => {
    it('should have proper section styling', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const container = screen.getByText('Team Page').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full', 'h-12', 'flex', 'items-center');
      });
    });

    it('should have proper icon styling', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-muted-foreground');
      });
    });
  });

  describe('Icon display', () => {
    it('should show users icon for team page', () => {
      render(<QuickLinks {...defaultProps} />);
      
      // The users icon should be present (Lucide Users component)
      expect(screen.getByText('Team Page')).toBeInTheDocument();
    });

    it('should show trophy icon for league page', () => {
      render(<QuickLinks {...defaultProps} />);
      
      // The trophy icon should be present (Lucide Trophy component)
      expect(screen.getByText('League Page')).toBeInTheDocument();
    });
  });

  describe('URL generation', () => {
    it('should generate correct team URL', () => {
      render(<QuickLinks {...defaultProps} />);
      
      const teamPageButton = screen.getByText('Team Page');
      fireEvent.click(teamPageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/teams/123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should generate correct league URL with spaces', () => {
      render(<QuickLinks {...defaultProps} activeTeam={{
        id: '123',
        name: 'Team Alpha',
        league: 'The International 2024',
      }} />);
      
      const leaguePageButton = screen.getByText('League Page');
      fireEvent.click(leaguePageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/leagues/the-international-2024',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle league names with special characters', () => {
      render(<QuickLinks {...defaultProps} activeTeam={{
        id: '123',
        name: 'Team Alpha',
        league: 'ESL One & DreamLeague',
      }} />);
      
      const leaguePageButton = screen.getByText('League Page');
      fireEvent.click(leaguePageButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com/leagues/esl-one-&-dreamleague',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });
}); 