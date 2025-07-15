import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export interface SkeletonProps {
  type?: 'text' | 'avatar' | 'button' | 'card';
  lines?: number;
  className?: string;
}

export interface ProgressIndicatorsProps {
  type: 'spinner' | 'progress-bar' | 'skeleton';
  spinnerProps?: SpinnerProps;
  progressBarProps?: ProgressBarProps;
  skeletonProps?: SkeletonProps;
  className?: string;
}

// Progress Bar Component
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className = ''
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-600';
      case 'warning':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      case 'default':
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-muted-foreground dark:text-muted-foreground">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-muted dark:bg-muted rounded-full ${getSizeClasses()}`}>
        <div
          className={`${getVariantClasses()} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
};

// Spinner Component
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-destructive';
      case 'default':
      default:
        return 'text-muted-foreground dark:text-muted-foreground';
    }
  };

  return (
    <div
      className={`animate-spin ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Skeleton Component
export const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  lines = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, index) => (
              <div
                key={index}
                className="h-4 bg-muted dark:bg-muted rounded animate-pulse"
                style={{
                  width: `${Math.random() * 40 + 60}%`
                }}
              />
            ))}
          </div>
        );
      case 'avatar':
        return (
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-muted dark:bg-muted rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted dark:bg-muted rounded animate-pulse" style={{ width: '60%' }} />
              <div className="h-3 bg-muted dark:bg-muted rounded animate-pulse" style={{ width: '40%' }} />
            </div>
          </div>
        );
      case 'button':
        return (
          <div className="h-10 bg-muted dark:bg-muted rounded animate-pulse" style={{ width: '120px' }} />
        );
      case 'card':
        return (
          <div className="bg-card dark:bg-card rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted dark:bg-muted rounded animate-pulse" style={{ width: '70%' }} />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-4 bg-muted dark:bg-muted rounded animate-pulse"
                    style={{
                      width: `${Math.random() * 30 + 70}%`
                    }}
                  />
                ))}
              </div>
              <div className="flex space-x-2 pt-4">
                <div className="h-8 bg-muted dark:bg-muted rounded animate-pulse" style={{ width: '80px' }} />
                <div className="h-8 bg-muted dark:bg-muted rounded animate-pulse" style={{ width: '60px' }} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

// Main Progress Indicators Component
export const ProgressIndicators: React.FC<ProgressIndicatorsProps> = ({
  type,
  spinnerProps,
  progressBarProps,
  skeletonProps,
  className = ''
}) => {
  const renderComponent = () => {
    switch (type) {
      case 'spinner':
        return <Spinner {...spinnerProps} />;
      case 'progress-bar':
        return progressBarProps ? (
          <ProgressBar {...progressBarProps} progress={progressBarProps?.progress || 0} />
        ) : null;
      case 'skeleton':
        return <Skeleton {...skeletonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderComponent()}
    </div>
  );
};

// Convenience components for common use cases
export const LoadingSpinner: React.FC<SpinnerProps> = (props) => (
  <div className="flex justify-center items-center p-4">
    <Spinner {...props} />
  </div>
);

export const LoadingCard: React.FC<SkeletonProps> = (props) => (
  <Skeleton type="card" {...props} />
);

export const LoadingText: React.FC<SkeletonProps> = (props) => (
  <Skeleton type="text" {...props} />
);

export const LoadingAvatar: React.FC<SkeletonProps> = (props) => (
  <Skeleton type="avatar" {...props} />
);

export const LoadingButton: React.FC<SkeletonProps> = (props) => (
  <Skeleton type="button" {...props} />
); 