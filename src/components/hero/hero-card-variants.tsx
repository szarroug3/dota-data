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
      className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border p-3 cursor-pointer
        hover:shadow-md hover:border-border/50 transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''} ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HeroImage hero={hero} mode="list" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-foreground truncate">{hero.localizedName}</h3>
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
              <div className="text-xs text-muted-foreground">WR</div>
            </div>
          )}
          
          {showMeta && (
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{meta.pickRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Pick</div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {onViewDetails && (
              <button onClick={handleViewDetails} className="text-muted-foreground hover:text-foreground"
                aria-label="View hero details" tabIndex={0}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onHide && (
              <button onClick={handleHide} className="text-muted-foreground hover:text-foreground"
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
      className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 cursor-pointer
        hover:shadow-md hover:border-border/50 transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
        ${className}`}
      onClick={handleSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <HeroImage hero={hero} mode="grid" />
        <div className="flex items-center space-x-1">
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
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
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
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
          <h3 className="font-medium text-foreground">
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
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                {meta.pickRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Pick Rate</div>
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
          <h3 className="text-xl font-bold text-foreground">
            {hero.localizedName}
          </h3>
          <span className={`text-lg ${getAttributeColor(hero.primaryAttribute)}`}>
            {getAttributeIcon(hero.primaryAttribute)}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
          onClick={() => onViewDetails(hero.id)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
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
          onClick={() => onHide(hero.id)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
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
);

// Helper component to reduce complexity in DetailedHeroCard
const DetailedHeroStats: React.FC<{
  meta: HeroCardVariantProps['meta'];
}> = ({ meta }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className={`text-lg font-bold ${getWinRateColor(meta.winRate)}`}>
        {meta.winRate.toFixed(1)}%
      </div>
      <div className="text-sm text-muted-foreground">Win Rate</div>
    </div>
    
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-lg font-bold text-foreground">
        {meta.pickRate.toFixed(1)}%
      </div>
      <div className="text-sm text-muted-foreground">Pick Rate</div>
    </div>
    
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-lg font-bold text-foreground">
        {meta.banRate.toFixed(1)}%
      </div>
      <div className="text-sm text-muted-foreground">Ban Rate</div>
    </div>
    
    <div className="text-center p-3 bg-muted rounded-lg">
      <div className="text-lg font-bold text-foreground">
        #{meta.popularityRank}
      </div>
      <div className="text-sm text-muted-foreground">Popularity</div>
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
      className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 cursor-pointer
        hover:shadow-md hover:border-border/50 transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
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
          <h4 className="text-sm font-medium text-foreground mb-2">Roles</h4>
          <HeroRoles roles={hero.roles} />
        </div>
      )}

      {showStats && <DetailedHeroStats meta={meta} />}

      {showMeta && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Meta Score: <span className="font-medium text-foreground">{meta.metaScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">📈</span>
              <span className="text-sm capitalize text-muted-foreground">
                {meta.trend}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 