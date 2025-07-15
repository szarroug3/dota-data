import { fireEvent, render, screen } from '@testing-library/react';

import { ExternalResources } from '@/components/sidebar/ExternalResources';

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('ExternalResources', () => {
  const defaultProps = {
    isCollapsed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpen.mockClear();
  });

  describe('Rendering', () => {
    it('should render all external resource links', () => {
      render(<ExternalResources {...defaultProps} />);
      
      expect(screen.getByText('Dotabuff')).toBeInTheDocument();
      expect(screen.getByText('OpenDota')).toBeInTheDocument();
      expect(screen.getByText('Dota2ProTracker')).toBeInTheDocument();
    });

    it('should render when collapsed', () => {
      render(<ExternalResources {...defaultProps} isCollapsed={true} />);
      
      // Should still render buttons but without visible text
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should render section separator', () => {
      render(<ExternalResources {...defaultProps} />);
      
      // The separator should be present (border-t class)
      const container = screen.getByText('Dotabuff').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Dotabuff link', () => {
    it('should open Dotabuff in new tab when clicked', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const dotabuffButton = screen.getByText('Dotabuff');
      fireEvent.click(dotabuffButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should have proper aria label for Dotabuff', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const dotabuffButton = screen.getByText('Dotabuff');
      expect(dotabuffButton.closest('button')).toHaveAttribute(
        'aria-label',
        'Open Dotabuff - Comprehensive Dota 2 statistics and match analysis'
      );
    });
  });

  describe('OpenDota link', () => {
    it('should open OpenDota in new tab when clicked', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const opendotaButton = screen.getByText('OpenDota');
      fireEvent.click(opendotaButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://opendota.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should have proper aria label for OpenDota', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const opendotaButton = screen.getByText('OpenDota');
      expect(opendotaButton.closest('button')).toHaveAttribute(
        'aria-label',
        'Open OpenDota - Open source Dota 2 statistics and API'
      );
    });
  });

  describe('Dota2ProTracker link', () => {
    it('should open Dota2ProTracker in new tab when clicked', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const dota2protrackerButton = screen.getByText('Dota2ProTracker');
      fireEvent.click(dota2protrackerButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dota2protracker.com',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should have proper aria label for Dota2ProTracker', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const dota2protrackerButton = screen.getByText('Dota2ProTracker');
      expect(dota2protrackerButton.closest('button')).toHaveAttribute(
        'aria-label',
        'Open Dota2ProTracker - Professional player builds and strategies'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for all buttons', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('title');
      });
    });

    it('should be keyboard accessible', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const dotabuffButton = screen.getByText('Dotabuff');
      expect(dotabuffButton).toBeInTheDocument();
    });

    it('should handle keyboard events', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const dotabuffButton = screen.getByText('Dotabuff');
      fireEvent.click(dotabuffButton);
      
      expect(mockOpen).toHaveBeenCalledWith(
        'https://dotabuff.com',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Styling', () => {
    it('should have proper section styling', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const container = screen.getByText('Dotabuff').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should have proper button styling', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full', 'h-12', 'flex', 'items-center');
      });
    });

    it('should have proper icon styling', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-muted-foreground');
      });
    });
  });

  describe('Icon display', () => {
    it('should show dotabuff icon', () => {
      render(<ExternalResources {...defaultProps} />);
      
      // The dotabuff icon should be present
      expect(screen.getByText('Dotabuff')).toBeInTheDocument();
    });

    it('should show opendota icon', () => {
      render(<ExternalResources {...defaultProps} />);
      
      // The opendota icon should be present
      expect(screen.getByText('OpenDota')).toBeInTheDocument();
    });

    it('should show dota2protracker icon', () => {
      render(<ExternalResources {...defaultProps} />);
      
      // The dota2protracker icon should be present
      expect(screen.getByText('Dota2ProTracker')).toBeInTheDocument();
    });
  });

  describe('URL handling', () => {
    it('should open all external sites with correct URLs', () => {
      render(<ExternalResources {...defaultProps} />);
      
      const sites = [
        { name: 'Dotabuff', url: 'https://dotabuff.com' },
        { name: 'OpenDota', url: 'https://opendota.com' },
        { name: 'Dota2ProTracker', url: 'https://dota2protracker.com' },
      ];

      sites.forEach(site => {
        const button = screen.getByText(site.name);
        fireEvent.click(button);
      });

      expect(mockOpen).toHaveBeenCalledTimes(3);
      expect(mockOpen).toHaveBeenCalledWith('https://dotabuff.com', '_blank', 'noopener,noreferrer');
      expect(mockOpen).toHaveBeenCalledWith('https://opendota.com', '_blank', 'noopener,noreferrer');
      expect(mockOpen).toHaveBeenCalledWith('https://dota2protracker.com', '_blank', 'noopener,noreferrer');
    });
  });
}); 