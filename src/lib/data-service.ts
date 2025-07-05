/**
 * Data service layer - Main entry point
 * 
 * This file serves as the main entry point for all data service operations.
 * It delegates to specialized service modules for different data types.
 */

// Export types
export type {
    DraftSuggestions, MatchHistory, MetaInsights, PlayerStats, TeamAnalysis
} from './types/data-service';

// Export utility functions
export {
    calculateKDA, calculateTrendDirection,
    calculateTrendPercentage, calculateWinRate, formatTrendDescription, getHeroDisplayName,
    getHeroImage
} from './utils/data-calculations';

// Export hero utilities
export {
    areHeroNamesEqual, getHeroDisplayNameFromId,
    getHeroImageFromId,
    isValidHeroName,
    normalizeHeroName
} from './services/hero-utils-service';

// Export main service functions
export { getDraftSuggestions } from './services/draft-suggestions-service';

export { getMetaInsights } from './services/meta-insights-service';
export { getPlayerStats } from './services/player-stats-service';
export { getTeamAnalysis } from './services/team-analysis-service';

