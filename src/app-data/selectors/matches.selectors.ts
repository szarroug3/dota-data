// Pure selectors for matches. Keep derivations here; no side-effects.

import type { ID, Match, MatchState } from "../entities/matches/store";
import { indexByScalarKey, indexByArrayKey, getAtPath } from "../entities/matches/indexes";

export interface MatchSummary {
  id: ID;
  // Extend as migration proceeds
}

/** Returns the N most recent match IDs by appearance order. */
export function selectRecentMatchIds(state: MatchState, limit: number): ID[] {
  const count = Math.max(0, Math.min(limit, state.allIds.length));
  // slice returns last count (assumes allIds is append-ordered); reverse for newest-first
  return state.allIds.slice(-count).reverse();
}

/** Projects lightweight summaries for a given list of match IDs. */
export function selectMatchSummaries(state: MatchState, ids: readonly ID[]): MatchSummary[] {
  const output: MatchSummary[] = [];
  for (const id of ids) {
    const matchRecord: Match | undefined = state.byId[id];
    if (matchRecord) output.push({ id });
  }
  return output;
}

/**
 * Build and return an index of match IDs by scalar key at data[path].
 * Example: path ["league_id"] (if using OpenDota-like schema).
 */
export function selectMatchIdsByScalarKeyIndex(
  state: MatchState,
  path: readonly string[]
): Record<string, ID[]> {
  const items = state.allIds.map((id) => state.byId[id]).filter(Boolean) as Match[];
  return indexByScalarKey(items, path);
}

/**
 * Build and return a multi-index of match IDs by items in an array at data[path].
 * Example: path ["players", "account_id"] when players is an array of player objects.
 */
export function selectMatchIdsByArrayKeyIndex(
  state: MatchState,
  path: readonly string[]
): Record<string, ID[]> {
  const items = state.allIds.map((id) => state.byId[id]).filter(Boolean) as Match[];
  return indexByArrayKey(items, path);
}

/**
 * Convenience: given a prebuilt index and a key, return recent-first match IDs (limited).
 */
export function selectRecentMatchesFromIndex(
  state: MatchState,
  index: Record<string, ID[]>,
  key: string | number,
  limit: number
): ID[] {
  const allForKey = index[String(key)] ?? [];
  const count = Math.max(0, Math.min(limit, allForKey.length));
  return allForKey.slice(-count).reverse();
}

/** Filter a provided list of match IDs by a scalar data key's exact value. */
export function selectMatchIdsFilteredByScalar(
  state: MatchState,
  ids: readonly ID[],
  path: readonly string[],
  value: string | number
): ID[] {
  const output: ID[] = [];
  for (const id of ids) {
    const matchRecord = state.byId[id];
    const val = getAtPath(matchRecord?.data, path);
    if (val === value) output.push(id);
  }
  return output;
}

export type SortDirection = "asc" | "desc";

/** Sort a list of match IDs by a numeric data key. Missing or non-numeric values are treated as +∞ for asc and -∞ for desc to keep them at the end. */
export function selectMatchIdsSortedByNumericKey(
  state: MatchState,
  ids: readonly ID[],
  path: readonly string[],
  direction: SortDirection
): ID[] {
  const enriched = ids.map((id) => {
    const matchRecord = state.byId[id];
    const data = (matchRecord?.data ?? {}) as Record<string, unknown>;
    let cur: unknown = data;
    for (const key of path) {
      if (cur && typeof cur === "object" && !Array.isArray(cur) && key in cur) {
        cur = (cur as Record<string, unknown>)[key];
      } else {
        cur = undefined;
        break;
      }
    }
    const num = typeof cur === "number" ? cur : (direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    return { id, num };
  });
  enriched.sort((a, b) => direction === "asc" ? a.num - b.num : b.num - a.num);
  return enriched.map((row) => row.id);
}

/** Apply simple pagination to a list of IDs. */
export function selectPaginatedMatchIds(
  ids: readonly ID[],
  page: number,
  pageSize: number
): ID[] {
  const start = Math.max(0, Math.floor(page) * Math.max(1, Math.floor(pageSize)));
  return ids.slice(start, start + Math.max(1, Math.floor(pageSize)));
}

export function selectVisibleMatches(all: readonly Match[], hidden: readonly ID[]): Match[] {
  if (hidden.length === 0) return all.slice();
  const hiddenSet = new Set(hidden);
  return all.filter(matchRecord => !hiddenSet.has(matchRecord.id));
}


export interface Hero { id: ID; name?: string; localizedName?: string }
export type HeroMap = Record<ID, Hero>;

export function selectPlayedHeroOptions(matches: readonly Match[], heroes: HeroMap): { value: ID; label: string }[] {
  const seen = new Set<ID>();
  const options: { value: ID; label: string }[] = [];
  for (const match of matches) {
    const heroIds = (getAtPath(match.data, ["heroes"]) as unknown[]) || [];
    for (const h of heroIds) {
      if (typeof h === "number" || typeof h === "string") {
        const id = h as ID;
        if (!seen.has(id)) {
          seen.add(id);
          const hero = heroes[id];
          const label = hero?.localizedName || hero?.name || String(id);
          options.push({ value: id, label });
        }
      }
    }
  }
  options.sort((a, b) => a.label.localeCompare(b.label));
  return options;
}
