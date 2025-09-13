import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'text' | 'avatar';
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'text',
  lines = 3,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-card dark:bg-card rounded-lg border border-border dark:border-border p-4 ${className}`} data-testid="loading-skeleton">
            <div className="animate-pulse">
              <div className="h-4 bg-muted dark:bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-muted dark:bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted dark:bg-muted rounded w-2/3"></div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`space-y-3 ${className}`} data-testid="loading-skeleton">
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-muted dark:bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className={`space-y-2 ${className}`} data-testid="loading-skeleton">
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-4">
                <div className="h-4 bg-muted dark:bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted dark:bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted dark:bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted dark:bg-muted rounded w-1/6"></div>
              </div>
            ))}
          </div>
        );

      case 'avatar':
        return (
          <div className={`animate-pulse ${className}`} data-testid="loading-skeleton">
            <div className="h-10 w-10 bg-muted dark:bg-muted rounded-full"></div>
          </div>
        );

      case 'text':
      default:
        return (
          <div className={`space-y-2 ${className}`} data-testid="loading-skeleton">
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className={`h-4 bg-muted dark:bg-muted rounded ${
                  index === lines - 1 ? 'w-3/4' : 'w-full'
                }`}></div>
              </div>
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

// Specialized skeleton components for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton type="card" className={className} />
);

export const ListSkeleton: React.FC<{ lines?: number; className?: string }> = ({ lines, className }) => (
  <LoadingSkeleton type="list" lines={lines} className={className} />
);

export const TableSkeleton: React.FC<{ lines?: number; className?: string }> = ({ lines, className }) => (
  <LoadingSkeleton type="table" lines={lines} className={className} />
);

export const AvatarSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton type="avatar" className={className} />
); 