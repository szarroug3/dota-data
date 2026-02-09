/**
 * Hero Summary Operations for AppData
 *
 * Handles sorting and filtering operations for hero summary data.
 * Extracted to reduce app-data.ts file size.
 */

import type { HeroSummaryEntry } from '@/frontend/lib/app-data/app-data-types';

export type HeroSummarySortField = 'name' | 'count' | 'winRate';
export type HeroSummarySortDirection = 'asc' | 'desc';

/**
 * Sort hero summary entries by the specified field and direction
 *
 * @param heroes - Array of hero summary entries to sort
 * @param sortField - Field to sort by ('name', 'count', or 'winRate')
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @returns New sorted array (does not modify original)
 */
export function sortHeroSummaryEntries(
  heroes: HeroSummaryEntry[],
  sortField: HeroSummarySortField,
  sortDirection: HeroSummarySortDirection,
): HeroSummaryEntry[] {
  return [...heroes].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.heroName.localeCompare(b.heroName);
        break;
      case 'count':
        comparison = a.count - b.count;
        break;
      case 'winRate':
        comparison = a.winRate - b.winRate;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter hero summary entries to only include high-performing heroes
 *
 * @param heroes - Array of hero summary entries to filter
 * @param highPerformingHeroIds - Set of hero IDs that are high-performing
 * @returns Filtered array containing only high-performing heroes
 */
export function filterHeroSummaryByHighPerformers(
  heroes: HeroSummaryEntry[],
  highPerformingHeroIds: Set<string>,
): HeroSummaryEntry[] {
  return heroes.filter((hero) => highPerformingHeroIds.has(hero.heroId));
}
