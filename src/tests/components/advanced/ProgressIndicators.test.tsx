import { render, screen } from '@testing-library/react';

import {
    LoadingAvatar,
    LoadingButton,
    LoadingCard,
    LoadingSpinner,
    LoadingText,
    ProgressBar,
    ProgressIndicators,
    Skeleton,
    Spinner
} from '@/components/advanced/ProgressIndicators';

describe('ProgressIndicators', () => {
  describe('ProgressBar', () => {
    it('should render progress bar with correct progress', () => {
      render(<ProgressBar progress={75} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should clamp progress values between 0 and 100', () => {
      const { rerender } = render(<ProgressBar progress={150} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

      rerender(<ProgressBar progress={-25} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('should render progress bar with label when showLabel is true', () => {
      render(
        <ProgressBar 
          progress={60} 
          showLabel={true} 
          label="Upload Progress"
        />
      );

      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('should not render label when showLabel is false', () => {
      render(
        <ProgressBar 
          progress={60} 
          showLabel={false} 
          label="Upload Progress"
        />
      );

      expect(screen.queryByText('Upload Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('60%')).not.toBeInTheDocument();
    });

    it('should apply different size classes', () => {
      const { rerender } = render(<ProgressBar progress={50} size="sm" />);
      expect(screen.getByRole('progressbar').parentElement).toHaveClass('h-1');

      rerender(<ProgressBar progress={50} size="md" />);
      expect(screen.getByRole('progressbar').parentElement).toHaveClass('h-2');

      rerender(<ProgressBar progress={50} size="lg" />);
      expect(screen.getByRole('progressbar').parentElement).toHaveClass('h-3');
    });

    it('should apply different variant classes', () => {
      const { rerender } = render(<ProgressBar progress={50} variant="success" />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-green-600');

      rerender(<ProgressBar progress={50} variant="warning" />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-600');

      rerender(<ProgressBar progress={50} variant="error" />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-red-600');

      rerender(<ProgressBar progress={50} variant="default" />);
      expect(screen.getByRole('progressbar')).toHaveClass('bg-blue-600');
    });

    it('should apply custom className', () => {
      render(<ProgressBar progress={50} className="custom-progress" />);
      const progressBar = screen.getByRole('progressbar');
      const container = progressBar.parentElement?.parentElement;
      expect(container).toHaveClass('custom-progress');
    });
  });

  describe('Spinner', () => {
    it('should render spinner with correct size', () => {
      const { rerender } = render(<Spinner size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('w-4', 'h-4');

      rerender(<Spinner size="md" />);
      expect(screen.getByRole('status')).toHaveClass('w-6', 'h-6');

      rerender(<Spinner size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8');
    });

    it('should apply different variant classes', () => {
      const { rerender } = render(<Spinner variant="primary" />);
      expect(screen.getByRole('status')).toHaveClass('text-primary');

      rerender(<Spinner variant="success" />);
      expect(screen.getByRole('status')).toHaveClass('text-success');

      rerender(<Spinner variant="warning" />);
      expect(screen.getByRole('status')).toHaveClass('text-yellow-600');

      rerender(<Spinner variant="error" />);
      expect(screen.getByRole('status')).toHaveClass('text-destructive');

      rerender(<Spinner variant="default" />);
      expect(screen.getByRole('status')).toHaveClass('text-muted-foreground');
    });

    it('should have proper accessibility attributes', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should apply custom className', () => {
      render(<Spinner className="custom-spinner" />);
      expect(screen.getByRole('status')).toHaveClass('custom-spinner');
    });

    it('should have animation class', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveClass('animate-spin');
    });
  });

  describe('Skeleton', () => {
    it('should render text skeleton by default', () => {
      render(<Skeleton />);

      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render multiple lines when specified', () => {
      render(<Skeleton lines={3} />);

      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThanOrEqual(3);
    });

    it('should render avatar skeleton', () => {
      render(<Skeleton type="avatar" />);

      const avatarElement = document.querySelector('.w-10.h-10.rounded-full');
      expect(avatarElement).toBeInTheDocument();
    });

    it('should render button skeleton', () => {
      render(<Skeleton type="button" />);

      const buttonElement = document.querySelector('.h-10');
      expect(buttonElement).toBeInTheDocument();
    });

    it('should render card skeleton', () => {
      render(<Skeleton type="card" />);

      const cardElement = document.querySelector('.bg-card.dark\\:bg-card.rounded-lg.shadow');
      expect(cardElement).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-skeleton" />);
      expect(document.querySelector('.custom-skeleton')).toBeInTheDocument();
    });
  });

  describe('Main ProgressIndicators Component', () => {
    it('should render spinner when type is spinner', () => {
      render(
        <ProgressIndicators
          type="spinner"
          spinnerProps={{ size: 'md', variant: 'primary' }}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('text-primary');
    });

    it('should render progress bar when type is progress-bar', () => {
      render(
        <ProgressIndicators
          type="progress-bar"
          progressBarProps={{ progress: 75, showLabel: true, label: 'Test Progress' }}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Test Progress')).toBeInTheDocument();
    });

    it('should render skeleton when type is skeleton', () => {
      render(
        <ProgressIndicators
          type="skeleton"
          skeletonProps={{ type: 'text', lines: 2 }}
        />
      );

      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should apply custom className', () => {
      render(
        <ProgressIndicators
          type="spinner"
          className="custom-indicators"
        />
      );

      expect(screen.getByRole('status').parentElement).toHaveClass('custom-indicators');
    });
  });

  describe('Convenience Components', () => {
    it('should render LoadingSpinner with centered layout', () => {
      render(<LoadingSpinner size="lg" variant="primary" />);

      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('flex', 'justify-center', 'items-center', 'p-4');
      expect(screen.getByRole('status')).toHaveClass('w-8', 'h-8', 'text-primary');
    });

    it('should render LoadingCard with card skeleton', () => {
      render(<LoadingCard lines={4} />);

      const cardElement = document.querySelector('.bg-card.dark\\:bg-card.rounded-lg.shadow');
      expect(cardElement).toBeInTheDocument();
    });

    it('should render LoadingText with text skeleton', () => {
      render(<LoadingText lines={3} />);

      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render LoadingAvatar with avatar skeleton', () => {
      render(<LoadingAvatar />);

      const avatarElement = document.querySelector('.w-10.h-10.rounded-full');
      expect(avatarElement).toBeInTheDocument();
    });

    it('should render LoadingButton with button skeleton', () => {
      render(<LoadingButton />);

      const buttonElement = document.querySelector('.h-10');
      expect(buttonElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for progress bar', () => {
      render(<ProgressBar progress={50} label="Test Progress" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Test Progress');
    });

    it('should have proper ARIA attributes for spinner', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for skeleton', () => {
      render(<Skeleton type="text" />);

      const skeletonElements = document.querySelectorAll('.dark\\:bg-muted');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode classes for spinner', () => {
      render(<Spinner variant="default" />);

      expect(screen.getByRole('status')).toHaveClass('dark:text-muted-foreground');
    });
  });

  describe('Animation', () => {
    it('should have animation classes for skeleton', () => {
      render(<Skeleton />);

      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should have animation classes for spinner', () => {
      render(<Spinner />);

      expect(screen.getByRole('status')).toHaveClass('animate-spin');
    });

    it('should have transition classes for progress bar', () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByRole('progressbar')).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for progress bar', () => {
      render(<ProgressBar progress={50} />);

      const progressBar = screen.getByRole('progressbar').parentElement;
      expect(progressBar).toHaveClass('w-full');
    });

    it('should have responsive classes for spinner container', () => {
      render(<LoadingSpinner />);

      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('flex', 'justify-center', 'items-center');
    });
  });
}); 