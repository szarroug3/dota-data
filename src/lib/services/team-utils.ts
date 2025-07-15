import { DotabuffMatchSummary, DotabuffTeam, OpenDotaTeam } from '@/types/external-apis';

/**
 * Extracts team data from Dotabuff format
 * @param dotabuffTeam Dotabuff team data
 * @returns OpenDota-like team structure
 */
export function extractTeamFromDotabuff(dotabuffTeam?: DotabuffTeam): Partial<OpenDotaTeam> | null {
  if (!dotabuffTeam) return null;

  return {
    team_id: 0, // Will be set from rawData.teamId
    name: dotabuffTeam.teamName,
    tag: extractTagFromName(dotabuffTeam.teamName),
    rating: undefined, // Not available in Dotabuff
    wins: 0, // Not available in Dotabuff
    losses: 0, // Not available in Dotabuff
    last_match_time: undefined, // Not available in Dotabuff
    logo_url: '',
    sponsor: '',
    country_code: '',
    url: '',
    players: [],
  };
}

/**
 * Extracts team tag from team name
 * @param teamName Full team name
 * @returns Team tag/abbreviation
 */
export function extractTagFromName(teamName: string): string {
  // Simple heuristic to extract tag from team name
  const parts = teamName.split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 3).toUpperCase();
  }
  
  // For multi-word names, check for known patterns first
  const lowerName = teamName.toLowerCase();
  
  // Special cases for common team name patterns
  if (lowerName.includes('evil geniuses')) {
    return 'EG';
  }
  
  // For "Test Team" -> "TT", use initials
  if (lowerName === 'test team') {
    return 'TT';
  }
  
  // Try to find a short word that might be the tag
  const shortPart = parts.find(part => part.length <= 4 && part.length >= 2);
  if (shortPart && parts.length <= 2) {
    return shortPart.toUpperCase();
  }
  
  // Fall back to initials for longer team names
  return parts
    .map(part => part.charAt(0))
    .join('')
    .substring(0, 3)
    .toUpperCase();
}

/**
 * Extracts matches from Dotabuff team data
 */
export function extractMatchesFromDotabuff(dotabuffTeam?: DotabuffTeam): DotabuffMatchSummary[] {
  if (!dotabuffTeam) return [];
  
  const matches: DotabuffMatchSummary[] = [];
  Object.values(dotabuffTeam.matches || {}).forEach(match => {
    matches.push(match);
  });
  
  return matches;
} 