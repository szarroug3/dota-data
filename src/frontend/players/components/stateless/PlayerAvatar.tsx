import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Player } from '@/frontend/lib/app-data-types';
import type { PreferredExternalSite } from '@/types/contexts/config-context-value';

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
  return player.profile?.avatarfull || player.profile?.avatar || '';
}

function AvatarImageMaybe({ src, alt }: { src: string; alt: string }) {
  if (!src || src.trim().length === 0) return null;
  return <AvatarImage src={src} alt={alt} className="object-cover object-center" />;
}

function AvatarContent({
  width,
  height,
  className,
  imageSrc,
  personaname,
  fallbackText,
}: {
  width: string;
  height: string;
  className: string;
  imageSrc: string;
  personaname: string;
  fallbackText: string;
}) {
  return (
    <Avatar
      className={`${width} ${height} border border-background cursor-pointer hover:border-primary transition-colors ${className}`}
    >
      <AvatarImageMaybe src={imageSrc} alt={personaname} />
      <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
    </Avatar>
  );
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  avatarSize,
  showLink = true,
  className = '',
  preferredSite,
}) => {
  const { width, height } = avatarSize;
  const personaname = player.profile.personaname;
  const fallbackText = player.error ? '?' : getFallbackTextFromName(personaname);
  const playerUrl = resolvePlayerUrl(player.accountId, preferredSite);
  const imageSrc = resolveImageSrc(player);

  const avatarContent = (
    <AvatarContent
      width={width}
      height={height}
      className={className}
      imageSrc={imageSrc}
      personaname={personaname}
      fallbackText={fallbackText}
    />
  );

  if (!showLink) {
    return avatarContent;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(playerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="p-0 h-auto w-auto"
      aria-label={`View ${personaname} on ${preferredSite ?? 'dotabuff'}`}
      title={`View ${personaname} on ${preferredSite ?? 'dotabuff'}`}
    >
      {avatarContent}
    </Button>
  );
};
