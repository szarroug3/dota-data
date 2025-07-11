import { render, screen } from '@testing-library/react';

import {
    Dota2ProTrackerIcon,
    DotabuffIcon,
    OpenDotaIcon,
    StratzIcon
} from '@/components/icons/ExternalSiteIcons';

describe('ExternalSiteIcons', () => {
  describe('DotabuffIcon', () => {
    it('should render with default props', () => {
      render(<DotabuffIcon />);

      const icon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5 h-5');
    });

    it('should apply custom className', () => {
      render(<DotabuffIcon className="custom-icon" />);

      const icon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(icon).toHaveClass('custom-icon');
    });

    it('should have proper accessibility attributes', () => {
      render(<DotabuffIcon />);

      const icon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(icon).toHaveAttribute('role', 'img');
      expect(icon).toHaveAttribute('aria-label', 'Dotabuff icon');
    });

    it('should have proper SVG attributes', () => {
      render(<DotabuffIcon />);

      const icon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('stroke', '#ef4444');
      expect(icon).toHaveAttribute('stroke-width', '1.5');
      expect(icon).toHaveAttribute('stroke-linecap', 'round');
      expect(icon).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('should contain the letter D', () => {
      render(<DotabuffIcon />);

      const icon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(icon).toHaveTextContent('D');
    });
  });

  describe('OpenDotaIcon', () => {
    it('should render with default props', () => {
      render(<OpenDotaIcon />);

      const icon = screen.getByRole('img', { name: 'OpenDota icon' });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5 h-5');
    });

    it('should apply custom className', () => {
      render(<OpenDotaIcon className="custom-icon" />);

      const icon = screen.getByRole('img', { name: 'OpenDota icon' });
      expect(icon).toHaveClass('custom-icon');
    });

    it('should have proper accessibility attributes', () => {
      render(<OpenDotaIcon />);

      const icon = screen.getByRole('img', { name: 'OpenDota icon' });
      expect(icon).toHaveAttribute('role', 'img');
      expect(icon).toHaveAttribute('aria-label', 'OpenDota icon');
    });

    it('should have proper SVG attributes', () => {
      render(<OpenDotaIcon />);

      const icon = screen.getByRole('img', { name: 'OpenDota icon' });
      expect(icon).toHaveAttribute('viewBox', '0 0 20 20');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('stroke-width', '1.5');
      expect(icon).toHaveAttribute('stroke-linecap', 'round');
      expect(icon).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('should have dark mode support', () => {
      render(<OpenDotaIcon />);

      const icon = screen.getByRole('img', { name: 'OpenDota icon' });
      const circle = icon.querySelector('circle');
      expect(circle).toHaveClass('dark:stroke-white');
    });
  });

  describe('StratzIcon', () => {
    it('should render with default props', () => {
      render(<StratzIcon />);

      const icon = screen.getByRole('img', { name: 'Stratz icon' });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5 h-5');
    });

    it('should apply custom className', () => {
      render(<StratzIcon className="custom-icon" />);

      const icon = screen.getByRole('img', { name: 'Stratz icon' });
      expect(icon).toHaveClass('custom-icon');
    });

    it('should have proper accessibility attributes', () => {
      render(<StratzIcon />);

      const icon = screen.getByRole('img', { name: 'Stratz icon' });
      expect(icon).toHaveAttribute('role', 'img');
      expect(icon).toHaveAttribute('aria-label', 'Stratz icon');
    });

    it('should have proper SVG attributes', () => {
      render(<StratzIcon />);

      const icon = screen.getByRole('img', { name: 'Stratz icon' });
      expect(icon).toHaveAttribute('viewBox', '0 0 60 60');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should contain gradient definitions', () => {
      render(<StratzIcon />);

      const icon = screen.getByRole('img', { name: 'Stratz icon' });
      const defs = icon.querySelector('defs');
      expect(defs).toBeInTheDocument();
    });

    it('should contain multiple gradient elements', () => {
      render(<StratzIcon />);

      const icon = screen.getByRole('img', { name: 'Stratz icon' });
      const linearGradients = icon.querySelectorAll('linearGradient');
      expect(linearGradients).toHaveLength(4);
    });
  });

  describe('Dota2ProTrackerIcon', () => {
    it('should render with default props', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5 h-5');
    });

    it('should apply custom className', () => {
      render(<Dota2ProTrackerIcon className="custom-icon" />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      expect(icon).toHaveClass('custom-icon');
    });

    it('should have proper accessibility attributes', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      expect(icon).toHaveAttribute('role', 'img');
      expect(icon).toHaveAttribute('aria-label', 'Dota2ProTracker icon');
    });

    it('should have proper SVG attributes', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
      expect(icon).toHaveAttribute('viewBox', '0 0 32 32');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should contain mask definitions', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      const masks = icon.querySelectorAll('mask');
      expect(masks).toHaveLength(2);
    });

    it('should contain text elements', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      const textElements = icon.querySelectorAll('text');
      expect(textElements).toHaveLength(2);
    });

    it('should contain the number 2', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      expect(icon).toHaveTextContent('2');
    });

    it('should contain the letter T', () => {
      render(<Dota2ProTrackerIcon />);

      const icon = screen.getByRole('img', { name: 'Dota2ProTracker icon' });
      expect(icon).toHaveTextContent('T');
    });
  });

  describe('Icon Consistency', () => {
    it('should have consistent default sizing', () => {
      const { rerender } = render(<DotabuffIcon />);
      expect(screen.getByRole('img', { name: 'Dotabuff icon' })).toHaveClass('w-5 h-5');

      rerender(<OpenDotaIcon />);
      expect(screen.getByRole('img', { name: 'OpenDota icon' })).toHaveClass('w-5 h-5');

      rerender(<StratzIcon />);
      expect(screen.getByRole('img', { name: 'Stratz icon' })).toHaveClass('w-5 h-5');

      rerender(<Dota2ProTrackerIcon />);
      expect(screen.getByRole('img', { name: 'Dota2ProTracker icon' })).toHaveClass('w-5 h-5');
    });

    it('should all have proper role and aria-label attributes', () => {
      const icons = [
        { Component: DotabuffIcon, name: 'Dotabuff icon' },
        { Component: OpenDotaIcon, name: 'OpenDota icon' },
        { Component: StratzIcon, name: 'Stratz icon' },
        { Component: Dota2ProTrackerIcon, name: 'Dota2ProTracker icon' }
      ];

      icons.forEach(({ Component, name }) => {
        render(<Component />);
        const icon = screen.getByRole('img', { name });
        expect(icon).toHaveAttribute('role', 'img');
        expect(icon).toHaveAttribute('aria-label', name);
      });
    });

    it('should all support custom className prop', () => {
      const icons = [
        { Component: DotabuffIcon, name: 'Dotabuff icon' },
        { Component: OpenDotaIcon, name: 'OpenDota icon' },
        { Component: StratzIcon, name: 'Stratz icon' },
        { Component: Dota2ProTrackerIcon, name: 'Dota2ProTracker icon' }
      ];

      icons.forEach(({ Component, name }) => {
        render(<Component className="test-custom-class" />);
        const icon = screen.getByRole('img', { name });
        expect(icon).toHaveClass('test-custom-class');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be screen reader accessible', () => {
      const icons = [
        { Component: DotabuffIcon, name: 'Dotabuff icon' },
        { Component: OpenDotaIcon, name: 'OpenDota icon' },
        { Component: StratzIcon, name: 'Stratz icon' },
        { Component: Dota2ProTrackerIcon, name: 'Dota2ProTracker icon' }
      ];

      icons.forEach(({ Component, name }) => {
        render(<Component />);
        const icon = screen.getByRole('img', { name });
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-label', name);
      });
    });

    it('should have semantic meaning through aria-label', () => {
      const icons = [
        { Component: DotabuffIcon, name: 'Dotabuff icon' },
        { Component: OpenDotaIcon, name: 'OpenDota icon' },
        { Component: StratzIcon, name: 'Stratz icon' },
        { Component: Dota2ProTrackerIcon, name: 'Dota2ProTracker icon' }
      ];

      icons.forEach(({ Component, name }) => {
        render(<Component />);
        const icon = screen.getByRole('img', { name });
        expect(icon).toHaveAttribute('aria-label');
        expect(icon.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Styling', () => {
    it('should have consistent stroke width for line-based icons', () => {
      render(<DotabuffIcon />);
      const dotabuffIcon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(dotabuffIcon).toHaveAttribute('stroke-width', '1.5');

      render(<OpenDotaIcon />);
      const openDotaIcon = screen.getByRole('img', { name: 'OpenDota icon' });
      expect(openDotaIcon).toHaveAttribute('stroke-width', '1.5');
    });

    it('should have proper stroke line properties', () => {
      render(<DotabuffIcon />);
      const dotabuffIcon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(dotabuffIcon).toHaveAttribute('stroke-linecap', 'round');
      expect(dotabuffIcon).toHaveAttribute('stroke-linejoin', 'round');

      render(<OpenDotaIcon />);
      const openDotaIcon = screen.getByRole('img', { name: 'OpenDota icon' });
      expect(openDotaIcon).toHaveAttribute('stroke-linecap', 'round');
      expect(openDotaIcon).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('should have proper fill attribute', () => {
      const icons = [
        { Component: DotabuffIcon, name: 'Dotabuff icon' },
        { Component: OpenDotaIcon, name: 'OpenDota icon' },
        { Component: StratzIcon, name: 'Stratz icon' },
        { Component: Dota2ProTrackerIcon, name: 'Dota2ProTracker icon' }
      ];

      icons.forEach(({ Component, name }) => {
        render(<Component />);
        const icon = screen.getByRole('img', { name });
        expect(icon).toHaveAttribute('fill', 'none');
      });
    });
  });

  describe('Color Schemes', () => {
    it('should use appropriate colors for each service', () => {
      render(<DotabuffIcon />);
      const dotabuffIcon = screen.getByRole('img', { name: 'Dotabuff icon' });
      expect(dotabuffIcon).toHaveAttribute('stroke', '#ef4444');

      render(<OpenDotaIcon />);
      const openDotaIcon = screen.getByRole('img', { name: 'OpenDota icon' });
      // OpenDota uses black stroke on the circle element
      const circle = openDotaIcon.querySelector('circle');
      expect(circle).toHaveAttribute('stroke', '#000');
    });

    it('should support dark mode where applicable', () => {
      render(<OpenDotaIcon />);
      const openDotaIcon = screen.getByRole('img', { name: 'OpenDota icon' });
      const circle = openDotaIcon.querySelector('circle');
      expect(circle).toHaveClass('dark:stroke-white');
    });
  });
}); 