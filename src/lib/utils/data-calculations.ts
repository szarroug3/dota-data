/**
 * Utility functions for data calculations used in the data service layer
 */

/**
 * Calculate KDA (Kills + Assists / Deaths)
 */
export function calculateKDA(kills: number, deaths: number, assists: number): number {
  return deaths === 0 ? kills + assists : (kills + assists) / deaths;
}

/**
 * Calculate win rate as a percentage
 */
export function calculateWinRate(wins: number, total: number): number {
  return total > 0 ? (wins / total) * 100 : 0;
}

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
 * Get hero image URL
 */
export function getHeroImage(heroName: string): string {
  const displayName = getHeroDisplayName(heroName);
  return `/heroes/${displayName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
}

/**
 * Calculate trend direction based on current vs previous value
 */
export function calculateTrendDirection(current: number, previous: number): "up" | "down" | "neutral" {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

/**
 * Calculate trend percentage change
 */
export function calculateTrendPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format trend description
 */
export function formatTrendDescription(metric: string, current: number, previous: number): string {
  const direction = calculateTrendDirection(current, previous);
  const percentage = Math.abs(calculateTrendPercentage(current, previous));
  
  if (direction === "neutral") return `${metric} remains stable`;
  
  const change = direction === "up" ? "increased" : "decreased";
  return `${metric} ${change} by ${percentage.toFixed(1)}%`;
} 