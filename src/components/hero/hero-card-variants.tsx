/**
 * Hero Card Variants
 * 
 * Different display modes for hero cards (list, grid, detailed)
 */

import React from 'react';

import { HeroCardVariantProps } from '@/types/components/hero-card';

import { HeroImage, HeroMetaBadge, HeroRoles } from './hero-card-sub-components';
import {
    getAttributeColor,
    getAttributeIcon,
    getComplexityStars,
    getWinRateColor
} from './hero-card-utils';

export const ListHeroCard: React.FC<HeroCardVariantProps> = ({
  hero,
  meta,
  isSelected,
  onSelect,
  onHide,
  onViewDetails,
  showStats,
  showMeta,
  showRole,
  className
}) => {
  const handleSelect = () => { if (onSelect) onSelect(hero.id); };
  const handleHide = (e: React.MouseEvent) => { e.stopPropagation(); if (onHide) onHide(hero.id); };
  const handleViewDetails = (e: React.MouseEvent) => { e.stopPropagation(); if (onViewDetails) onViewDetails(hero.id); };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HeroImage hero={hero} mode="list" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{hero.localizedName}</h3>
              <span className={`text-sm ${getAttributeColor(hero.primaryAttribute)}`}>
                {getAttributeIcon(hero.primaryAttribute)}
              </span>
            </div>
            {showRole && <HeroRoles roles={hero.roles} compact={true} />}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {showStats && (
            <div className="text-right">
              <div className={`text-sm font-medium ${getWinRateColor(meta.winRate)}`}>{meta.winRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">WR</div>
            </div>
          )}
          
          {showMeta && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{meta.pickRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pick</div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {onViewDetails && (
              <button onClick={handleViewDetails} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="View hero details" tabIndex={0}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onHide && (
              <button onClick={handleHide} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Hide hero" tabIndex={0}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GridHeroCard: React.FC<HeroCardVariantProps> = ({
  hero,
  meta,
  isSelected,
  onSelect,
  onHide,
  onViewDetails,
  showStats,
  showMeta,
  showRole,
  className
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(hero.id);
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHide) onHide(hero.id);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) onViewDetails(hero.id);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <HeroImage hero={hero} mode="grid" />
        <div className="flex items-center space-x-1">
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              aria-label="View hero details"
              tabIndex={0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {onHide && (
            <button
              onClick={handleHide}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              aria-label="Hide hero"
              tabIndex={0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {hero.localizedName}
          </h3>
          <span className={`text-sm ${getAttributeColor(hero.primaryAttribute)}`}>
            {getAttributeIcon(hero.primaryAttribute)}
          </span>
        </div>
        
        {showMeta && <HeroMetaBadge meta={meta} />}
        
        {showStats && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-center">
              <div className={`text-sm font-medium ${getWinRateColor(meta.winRate)}`}>
                {meta.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {meta.pickRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pick Rate</div>
            </div>
          </div>
        )}
        
        {showRole && (
          <div className="mt-3">
            <HeroRoles roles={hero.roles} compact={true} />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component to reduce complexity in DetailedHeroCard
const DetailedHeroHeader: React.FC<{
  hero: HeroCardVariantProps['hero'];
  meta: HeroCardVariantProps['meta'];
  showMeta?: boolean;
  onViewDetails?: (heroId: string) => void;
  onHide?: (heroId: string) => void;
}> = ({ hero, meta, showMeta = true, onViewDetails, onHide }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center space-x-4">
      <HeroImage hero={hero} mode="detailed" />
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {hero.localizedName}
          </h3>
          <span className={`text-lg ${getAttributeColor(hero.primaryAttribute)}`}>
            {getAttributeIcon(hero.primaryAttribute)}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{hero.attackType}</span>
          <span>•</span>
          <span>{getComplexityStars(hero.complexity)}</span>
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-2">
      {showMeta && <HeroMetaBadge meta={meta} />}
      {onViewDetails && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(hero.id);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="View hero details"
          tabIndex={0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
      {onHide && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHide(hero.id);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Hide hero"
          tabIndex={0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

// Helper component to reduce complexity in DetailedHeroCard
const DetailedHeroStats: React.FC<{
  meta: HeroCardVariantProps['meta'];
}> = ({ meta }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className={`text-lg font-bold ${getWinRateColor(meta.winRate)}`}>
        {meta.winRate.toFixed(1)}%
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
    </div>
    
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {meta.pickRate.toFixed(1)}%
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">Pick Rate</div>
    </div>
    
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {meta.banRate.toFixed(1)}%
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">Ban Rate</div>
    </div>
    
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        #{meta.popularityRank}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">Popularity</div>
    </div>
  </div>
);

export const DetailedHeroCard: React.FC<HeroCardVariantProps> = ({
  hero,
  meta,
  isSelected,
  onSelect,
  onHide,
  onViewDetails,
  showStats,
  showMeta,
  showRole,
  className
}) => {
  const handleSelect = () => {
    if (onSelect) onSelect(hero.id);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <DetailedHeroHeader
        hero={hero}
        meta={meta}
        showMeta={showMeta}
        onViewDetails={onViewDetails}
        onHide={onHide}
      />

      {showRole && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles</h4>
          <HeroRoles roles={hero.roles} />
        </div>
      )}

      {showStats && <DetailedHeroStats meta={meta} />}

      {showMeta && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Meta Score: <span className="font-medium text-gray-900 dark:text-white">{meta.metaScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">📈</span>
              <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                {meta.trend}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 