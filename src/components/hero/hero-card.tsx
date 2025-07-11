import React from 'react';

/**
 * Hero Card Component
 * 
 * A reusable component for displaying hero information, statistics, images, roles,
 * and meta information with support for different display modes.
 */

import {
    HeroCardListProps,
    HeroCardProps,
    HeroCardSkeletonProps,
    HeroCardVariantProps
} from '@/types/components/hero-card';

import {
    generateMockHeroInfo,
    generateMockHeroMeta,
    generateMockHeroStats
} from './hero-card-utils';
import {
    DetailedHeroCard,
    GridHeroCard,
    ListHeroCard
} from './hero-card-variants';

// Helper function to get hero card component based on mode
const getHeroCardComponent = (mode: string, cardProps: HeroCardVariantProps) => {
  switch (mode) {
    case 'list':
      return <ListHeroCard {...cardProps} />;
    case 'detailed':
      return <DetailedHeroCard {...cardProps} />;
    default:
      return <GridHeroCard {...cardProps} />;
  }
};

// Helper function to get container classes based on mode
const getContainerClasses = (mode: string, className: string) => {
  const baseClasses = mode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
    : 'space-y-3';
  return `${baseClasses} ${className}`;
};

export const HeroCard: React.FC<HeroCardProps> = ({
  heroId,
  isSelected = false,
  isHidden = false,
  onSelect,
  onHide,
  onViewDetails,
  mode = 'grid',
  showStats = true,
  showMeta = true,
  showRole = true,
  className = ''
}) => {
  // Don't render if hero is hidden
  if (isHidden) {
    return null;
  }

  // Mock data - in real app, this would come from API/context
  const hero = generateMockHeroInfo(heroId);
  const meta = generateMockHeroMeta();
  const stats = generateMockHeroStats();

  const commonProps: HeroCardVariantProps = {
    heroId,
    hero,
    meta,
    stats,
    isSelected,
    onSelect,
    onHide,
    onViewDetails,
    showStats,
    showMeta,
    showRole,
    className
  };

  return getHeroCardComponent(mode, commonProps);
};

/**
 * Hero Card Skeleton Component
 * 
 * Loading skeleton for hero cards
 */
export const HeroCardSkeleton: React.FC<HeroCardSkeletonProps> = ({ 
  mode = 'grid', 
  className = '' 
}) => {
  const baseClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse ${className}`;

  if (mode === 'list') {
    return (
      <div data-testid="list-hero-card" className={`${baseClasses} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-1">
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'detailed') {
    return (
      <div data-testid="detailed-hero-card" className={`${baseClasses} p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-2">
              <div className="w-40 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-12 h-5 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="grid-hero-card" className={`${baseClasses} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
        <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hero Card List Component
 * 
 * A list/grid wrapper for multiple hero cards
 */
export const HeroCardList: React.FC<HeroCardListProps> = ({
  heroIds,
  selectedHeroId,
  hiddenHeroIds = [],
  onSelectHero,
  onHideHero,
  onViewDetails,
  mode = 'grid',
  showStats = true,
  showMeta = true,
  showRole = true,
  className = ''
}) => {
  if (!heroIds || heroIds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No heroes found
      </div>
    );
  }

  const containerClasses = getContainerClasses(mode, className);

  return (
    <div className={containerClasses}>
      {heroIds.map((heroId) => (
        <HeroCard
          key={heroId}
          heroId={heroId}
          isSelected={selectedHeroId === heroId}
          isHidden={hiddenHeroIds.includes(heroId)}
          onSelect={onSelectHero}
          onHide={onHideHero}
          onViewDetails={onViewDetails}
          mode={mode}
          showStats={showStats}
          showMeta={showMeta}
          showRole={showRole}
        />
      ))}
    </div>
  );
}; 