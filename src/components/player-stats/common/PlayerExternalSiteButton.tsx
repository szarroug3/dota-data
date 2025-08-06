import React from 'react';

import { DotabuffIcon, OpenDotaIcon } from '@/components/icons/ExternalSiteIcons';
import { Button } from '@/components/ui/button';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';

interface PlayerExternalSiteButtonProps {
  playerId: number;
  preferredSite: PreferredExternalSite;
  className?: string;
  size?: 'sm' | 'default';
}

export const PlayerExternalSiteButton: React.FC<PlayerExternalSiteButtonProps> = ({
  playerId,
  preferredSite,
  className = '',
  size = 'default'
}) => {
  const getSiteConfig = (site: PreferredExternalSite) => {
    switch (site) {
      case 'dotabuff':
        return {
          url: `https://www.dotabuff.com/players/${playerId}`,
          icon: DotabuffIcon,
          label: 'View on Dotabuff',
          ariaLabel: 'Open player on Dotabuff'
        };
      case 'opendota':
        return {
          url: `https://www.opendota.com/players/${playerId}`,
          icon: OpenDotaIcon,
          label: 'View on OpenDota',
          ariaLabel: 'Open player on OpenDota'
        };
      default:
        return {
          url: `https://www.dotabuff.com/players/${playerId}`,
          icon: DotabuffIcon,
          label: 'View on Dotabuff',
          ariaLabel: 'Open player on Dotabuff'
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