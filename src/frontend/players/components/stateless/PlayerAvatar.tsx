import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';
import type { Player } from '@/types/contexts/player-context-value';

interface PlayerAvatarProps {
  player: Player;
  avatarSize: { width: string; height: string };
  showLink?: boolean;
  className?: string;
  preferredSite?: PreferredExternalSite;
}

function getFallbackTextFromName(nameRaw: string): string {
  const name = nameRaw || '';
  if (!name) return '?';
  const words = name.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function resolvePlayerUrl(accountId: number, site?: PreferredExternalSite): string {
  if (site === 'opendota') return `https://www.opendota.com/players/${accountId}`;
  return `https://www.dotabuff.com/players/${accountId}`;
}

function resolveImageSrc(player: Player): string {
  return (
    player.profile.profile.avatarfull || player.profile.profile.avatarmedium || player.profile.profile.avatar || ''
  );
}

function AvatarImageMaybe({ src, alt }: { src: string; alt: string }) {
  if (!src || src.trim().length === 0) return null;
  return <AvatarImage src={src} alt={alt} className="object-cover object-center" />;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  avatarSize,
  showLink = true,
  className = '',
  preferredSite,
}) => {
  const { width, height } = avatarSize;

  const fallbackText = player.error ? '?' : getFallbackTextFromName(player.profile.profile.personaname || '');
  const playerUrl = resolvePlayerUrl(player.profile.profile.account_id, preferredSite);
  const imageSrc = resolveImageSrc(player);
  const onClick = showLink
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(playerUrl, '_blank', 'noopener,noreferrer');
      }
    : undefined;

  const avatarContent = (
    <Avatar
      className={`${width} ${height} border border-background cursor-pointer hover:border-primary transition-colors ${className}`}
    >
      <AvatarImageMaybe src={imageSrc} alt={player.profile.profile.personaname || 'Player'} />
      <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
    </Avatar>
  );

  if (showLink) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="p-0 h-auto w-auto"
        aria-label={`View ${player.profile.profile.personaname} on ${preferredSite ?? 'dotabuff'}`}
        title={`View ${player.profile.profile.personaname} on ${preferredSite ?? 'dotabuff'}`}
      >
        {avatarContent}
      </Button>
    );
  }

  return avatarContent;
};
