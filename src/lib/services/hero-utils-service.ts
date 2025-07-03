/**
 * Hero utilities service
 * 
 * Handles hero-related operations and transformations
 */

import { getHeroDisplayName } from "../utils/data-calculations";

/**
 * Get hero display name from internal name
 */
export function getHeroDisplayName(heroName: string): string {
  return heroName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get hero display name from hero ID
 */
export async function getHeroDisplayNameFromId(heroId: number): Promise<string> {
  // This would typically fetch from a hero database
  // For now, return a placeholder
  return `Hero_${heroId}`;
}

/**
 * Get hero image URL
 */
export function getHeroImage(heroName: string): string {
  const displayName = getHeroDisplayName(heroName);
  return `/heroes/${displayName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
}

/**
 * Get hero image URL from hero ID
 */
export async function getHeroImageFromId(heroId: number): Promise<string> {
  const heroName = await getHeroDisplayNameFromId(heroId);
  return getHeroImage(heroName);
}

/**
 * Validate hero name
 */
export function isValidHeroName(heroName: string): boolean {
  if (!heroName || typeof heroName !== 'string') {
    return false;
  }
  
  // Basic validation - hero names should contain letters and possibly underscores
  const heroNamePattern = /^[a-zA-Z_]+$/;
  return heroNamePattern.test(heroName);
}

/**
 * Normalize hero name for consistent comparison
 */
export function normalizeHeroName(heroName: string): string {
  return heroName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Compare two hero names for equality
 */
export function areHeroNamesEqual(name1: string, name2: string): boolean {
  return normalizeHeroName(name1) === normalizeHeroName(name2);
} 