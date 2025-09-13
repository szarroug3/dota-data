import React from 'react';

import { Button } from '@/components/ui/button';
import { DotabuffIcon, OpenDotaIcon } from '@/frontend/shared/icons/ExternalSiteIcons';
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

  return (
    <Button
      variant="ghost"
      size={size}
      className={className}
      asChild
    >
      <a
        href={siteConfig.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={siteConfig.ariaLabel}
        title={siteConfig.label}
        onClick={(e) => e.stopPropagation()}
      >
        <IconComponent className="w-4 h-4" />
      </a>
    </Button>
  );
};


