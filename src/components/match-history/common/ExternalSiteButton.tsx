import React from 'react';

import { DotabuffIcon, OpenDotaIcon } from '@/components/icons/ExternalSiteIcons';
import { Button } from '@/components/ui/button';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';

interface ExternalSiteButtonProps {
  matchId: number;
  preferredSite: PreferredExternalSite;
  className?: string;
  size?: 'sm' | 'default';
}

export const ExternalSiteButton: React.FC<ExternalSiteButtonProps> = ({
  matchId,
  preferredSite,
  className = '',
  size = 'default'
}) => {
  const getSiteConfig = (site: PreferredExternalSite) => {
    switch (site) {
      case 'dotabuff':
        return {
          url: `https://www.dotabuff.com/matches/${matchId}`,
          icon: DotabuffIcon,
          label: 'View on Dotabuff',
          ariaLabel: 'Open match on Dotabuff'
        };
      case 'opendota':
        return {
          url: `https://www.opendota.com/matches/${matchId}`,
          icon: OpenDotaIcon,
          label: 'View on OpenDota',
          ariaLabel: 'Open match on OpenDota'
        };
      default:
        return {
          url: `https://www.dotabuff.com/matches/${matchId}`,
          icon: DotabuffIcon,
          label: 'View on Dotabuff',
          ariaLabel: 'Open match on Dotabuff'
        };
    }
  };

  const siteConfig = getSiteConfig(preferredSite);
  const IconComponent = siteConfig.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    window.open(siteConfig.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className={className}
      aria-label={siteConfig.ariaLabel}
      title={siteConfig.label}
    >
      <IconComponent className="w-4 h-4" />
    </Button>
  );
}; 