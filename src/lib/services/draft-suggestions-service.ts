/**
 * Draft suggestions processing service
 * 
 * Handles generating draft recommendations based on player data
 */

import type { OpenDotaPlayerHeroes } from '@/types/opendota';
import heroesData from "../../../public/heroes.json";
import { getPlayerHeroes } from "../api";
import type { DraftSuggestions } from "../types/data-service";
import { logWithTimestamp } from "../utils";

// Aggregated hero stats type
export type HeroStat = {
  hero: string;
  role: string;
  games: number;
  wins: number;
  winRate: number;
};

// Add a type for the heroes.json byId mapping
const heroIdToName: Record<string, string> = (heroesData as { byId: Record<string, string> }).byId;

/**
 * Generate draft suggestions for a team
 */
export async function getDraftSuggestions(
  accountIds: number[]
): Promise<DraftSuggestions | { status: string; signature: string }> {
  try {
    logWithTimestamp('log', `Generating draft suggestions for ${accountIds.length} players`);

    // Fetch hero data for all players
    const heroResults = await Promise.all(accountIds.map(accountId => getPlayerHeroes(accountId)));

    // Filter out error objects
    const validHeroResults = heroResults.filter((result): result is OpenDotaPlayerHeroes[] => Array.isArray(result));

    // Flatten heroResults into a single array of OpenDotaPlayerHeroes
    const allHeroes: OpenDotaPlayerHeroes[] = validHeroResults.flat();
    
    // Analyze team strengths and weaknesses
    const teamStrengths = analyzeTeamStrengths(allHeroes);
    const teamWeaknesses = analyzeTeamWeaknesses(allHeroes);
    
    // Generate phase recommendations
    const phaseRecommendations = generatePhaseRecommendations(allHeroes);
    
    // Generate meta counters
    const metaCounters = generateMetaCounters(allHeroes);
    
    // Generate recent drafts (mock data for now)
    const recentDrafts = generateRecentDrafts();

    return {
      teamStrengths,
      teamWeaknesses,
      phaseRecommendations,
      metaCounters,
      recentDrafts
    };
  } catch (error) {
    logWithTimestamp('error', `Error generating draft suggestions:`, error);
    return { status: 'error', signature: 'Failed to generate draft suggestions' };
  }
}

/**
 * Analyze team strengths based on hero pool
 */
function analyzeTeamStrengths(heroes: OpenDotaPlayerHeroes[]): { carry: string; mid: string; support: string; offlane: string } {
  const heroStats: HeroStat[] = aggregateHeroStats(heroes);
  
  // Find best performing heroes by role
  const carryHeroes = heroStats.filter(h => h.role === 'carry').sort((a, b) => b.winRate - a.winRate);
  const midHeroes = heroStats.filter(h => h.role === 'mid').sort((a, b) => b.winRate - a.winRate);
  const supportHeroes = heroStats.filter(h => h.role === 'support').sort((a, b) => b.winRate - a.winRate);
  const offlaneHeroes = heroStats.filter(h => h.role === 'offlane').sort((a, b) => b.winRate - a.winRate);

  return {
    carry: carryHeroes[0]?.hero || 'No strong carry heroes',
    mid: midHeroes[0]?.hero || 'No strong mid heroes',
    support: supportHeroes[0]?.hero || 'No strong support heroes',
    offlane: offlaneHeroes[0]?.hero || 'No strong offlane heroes'
  };
}

/**
 * Analyze team weaknesses based on hero pool
 */
function analyzeTeamWeaknesses(heroes: OpenDotaPlayerHeroes[]): string[] {
  const weaknesses: string[] = [];
  const heroStats: HeroStat[] = aggregateHeroStats(heroes);
  
  // Check for role gaps
  const roles = ['carry', 'mid', 'support', 'offlane'];
  for (const role of roles) {
    const roleHeroes = heroStats.filter(h => h.role === role);
    if (roleHeroes.length === 0) {
      weaknesses.push(`No ${role} heroes in pool`);
    } else if (roleHeroes.length < 3) {
      weaknesses.push(`Limited ${role} hero pool`);
    }
  }
  
  // Check for low win rate heroes
  const lowWinRateHeroes = heroStats.filter(h => h.winRate < 45 && h.games >= 5);
  if (lowWinRateHeroes.length > 0) {
    weaknesses.push('Several heroes with low win rates');
  }
  
  // Check for lack of meta heroes
  const metaHeroes = ['Anti-Mage', 'Invoker', 'Crystal Maiden', 'Axe'];
  const hasMetaHeroes = metaHeroes.some(metaHero => 
    heroStats.some(h => h.hero.toLowerCase().includes(metaHero.toLowerCase()))
  );
  if (!hasMetaHeroes) {
    weaknesses.push('Limited meta hero coverage');
  }
  
  return weaknesses;
}

interface PhaseRecommendation {
  title: string;
  description: string;
  heroes: Array<{
    name: string;
    role: string;
    reason: string;
    synergy: string[];
    counters: string[];
    pickPriority: string;
    winRate: number;
    games: number;
  }>;
}

/**
 * Generate phase-specific draft recommendations
 */
function generatePhaseRecommendations(heroes: OpenDotaPlayerHeroes[]): {
  first: PhaseRecommendation;
  second: PhaseRecommendation;
  third: PhaseRecommendation;
} {
  const heroStats: HeroStat[] = aggregateHeroStats(heroes);
  
  return {
    first: generatePhaseHeroes(heroStats, 'first'),
    second: generatePhaseHeroes(heroStats, 'second'),
    third: generatePhaseHeroes(heroStats, 'third')
  };
}

/**
 * Generate heroes for a specific draft phase
 */
function generatePhaseHeroes(heroStats: HeroStat[], phase: string): PhaseRecommendation {
  const phaseHeroes = heroStats
    .filter(h => h.games >= 3 && h.winRate >= 50)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5)
    .map(hero => ({
      name: hero.hero,
      role: hero.role,
      reason: `${hero.winRate.toFixed(1)}% win rate in ${hero.games} games`,
      synergy: generateSynergies(hero.hero),
      counters: generateCounters(hero.hero),
      pickPriority: determinePickPriority(hero, phase),
      winRate: hero.winRate,
      games: hero.games
    }));

  return {
    title: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase Recommendations`,
    description: `Top performing heroes for ${phase} phase picks`,
    heroes: phaseHeroes
  };
}

/**
 * Generate meta counters
 */
function generateMetaCounters(heroes: OpenDotaPlayerHeroes[]): Array<{ hero: string; counter: string; reason: string; effectiveness: string }> {
  logWithTimestamp('log', `[DraftSuggestionsService] Generating meta counters for ${JSON.stringify(heroes)}`)
  const metaCounters = [
    { hero: 'Anti-Mage', counter: 'Crystal Maiden', reason: 'Mana burn vs high mana pool', effectiveness: 'High' },
    { hero: 'Invoker', counter: 'Silencer', reason: 'Silence prevents spell casting', effectiveness: 'Medium' },
    { hero: 'Axe', counter: 'Drow Ranger', reason: 'Berserker Call vs ranged carry', effectiveness: 'High' },
    { hero: 'Crystal Maiden', counter: 'Anti-Mage', reason: 'Low mana pool vulnerable to burn', effectiveness: 'High' }
  ];
  
  return metaCounters;
}

/**
 * Generate recent drafts (mock data)
 */
function generateRecentDrafts() {
  return [
    {
      date: '2024-01-15',
      opponent: 'Team Alpha',
      result: 'Win',
      picks: ['Anti-Mage', 'Invoker', 'Axe', 'Crystal Maiden', 'Lion'],
      bans: ['Phantom Assassin', 'Storm Spirit', 'Tidehunter'],
      notes: 'Strong late game composition'
    },
    {
      date: '2024-01-10',
      opponent: 'Team Beta',
      result: 'Loss',
      picks: ['Juggernaut', 'Shadow Fiend', 'Bristleback', 'Witch Doctor', 'Rubick'],
      bans: ['Anti-Mage', 'Invoker', 'Axe'],
      notes: 'Early game pressure was too much'
    }
  ];
}

function getOrCreateHeroStat(heroMap: Map<number, HeroStat>, heroId: number, heroName: string, games: number, wins: number): HeroStat {
  const existing = heroMap.get(heroId);
  if (existing) {
    existing.games += games;
    existing.wins += wins;
    return existing;
  } else {
    const stat: HeroStat = {
      hero: heroName,
      role: determineHeroRole(heroName),
      games: games,
      wins: wins,
      winRate: 0
    };
    heroMap.set(heroId, stat);
    return stat;
  }
}

/**
 * Aggregate hero statistics across all players
 */
function aggregateHeroStats(heroes: OpenDotaPlayerHeroes[]): HeroStat[] {
  const heroMap = new Map<number, HeroStat>();
  for (const hero of heroes) {
    const heroId = hero.hero_id;
    const heroName = heroIdToName[heroId.toString()] || heroId.toString();
    getOrCreateHeroStat(heroMap, heroId, heroName, hero.games || 0, hero.win || 0);
  }
  for (const stat of heroMap.values()) {
    stat.winRate = stat.games > 0 ? (stat.wins / stat.games) * 100 : 0;
  }
  return Array.from(heroMap.values());
}

/**
 * Determine hero role based on name
 */
function determineHeroRole(heroName: string): string {
  const carryHeroes = ['Anti-Mage', 'Phantom Assassin', 'Juggernaut', 'Luna', 'Medusa'];
  const midHeroes = ['Invoker', 'Shadow Fiend', 'Storm Spirit', 'Queen of Pain', 'Lina'];
  const supportHeroes = ['Crystal Maiden', 'Lion', 'Witch Doctor', 'Rubick', 'Shadow Shaman'];
  const offlaneHeroes = ['Axe', 'Bristleback', 'Tidehunter', 'Dark Seer', 'Batrider'];
  
  if (carryHeroes.includes(heroName)) return 'carry';
  if (midHeroes.includes(heroName)) return 'mid';
  if (supportHeroes.includes(heroName)) return 'support';
  if (offlaneHeroes.includes(heroName)) return 'offlane';
  
  return 'flex';
}

/**
 * Generate synergies for a hero
 */
function generateSynergies(heroName: string): string[] {
  const synergies: Record<string, string[]> = {
    'Anti-Mage': ['Crystal Maiden', 'Lion', 'Shadow Shaman'],
    'Invoker': ['Crystal Maiden', 'Lion', 'Rubick'],
    'Axe': ['Crystal Maiden', 'Witch Doctor', 'Shadow Shaman'],
    'Crystal Maiden': ['Anti-Mage', 'Invoker', 'Axe']
  };
  
  return synergies[heroName] || ['Flexible pick'];
}

/**
 * Generate counters for a hero
 */
function generateCounters(heroName: string): string[] {
  const counters: Record<string, string[]> = {
    'Anti-Mage': ['Crystal Maiden', 'Lion', 'Shadow Shaman'],
    'Invoker': ['Silencer', 'Anti-Mage', 'Storm Spirit'],
    'Axe': ['Drow Ranger', 'Sniper', 'Luna'],
    'Crystal Maiden': ['Anti-Mage', 'Storm Spirit', 'Queen of Pain']
  };
  
  return counters[heroName] || ['Standard counters'];
}

/**
 * Determine pick priority for a hero
 */
function determinePickPriority(hero: HeroStat, phase: string): string {
  if (phase === 'first') {
    return hero.winRate >= 60 ? 'High' : 'Medium';
  } else if (phase === 'second') {
    return hero.winRate >= 55 ? 'High' : 'Medium';
  } else {
    return hero.winRate >= 50 ? 'Medium' : 'Low';
  }
} 