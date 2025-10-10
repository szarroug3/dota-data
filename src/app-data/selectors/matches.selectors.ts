// Pure selectors for matches.

import type { ID } from "../entities/matches/indexes";
import { indexByScalarKey, indexByArrayKey, getAtPath } from "../entities/matches/indexes";

export interface Match {
  id: ID;
  data?: unknown;
}

export interface MatchState {
  byId: Record<ID, Match>;
  allIds: ID[];
}

export interface MatchSummary {
  id: ID;
}

/** N most recent match IDs (newest first). */
export function selectRecentMatchIds(state: MatchState, limit: number): ID[] {
  const count = Math.max(0, Math.min(limit, state.allIds.length));
  return state.allIds.slice(-count).reverse();
}

/** Project summaries for given IDs. */
export function selectMatchSummaries(state: MatchState, ids: readonly ID[]): MatchSummary[] {
  const output: MatchSummary[] = [];
  for (const id of ids) {
    const record = state.byId[id];
    if (record) output.push({ id });
  }
  return output;
}

export function selectMatchIdsByScalarKeyIndex(
  state: MatchState,
  path: readonly string[]
): Record<string, ID[]> {
  const items = state.allIds.map((id) => state.byId[id]).filter(Boolean) as Match[];
  return indexByScalarKey(items, path);
}

export function selectMatchIdsByArrayKeyIndex(
  state: MatchState,
  path: readonly string[]
): Record<string, ID[]> {
  const items = state.allIds.map((id) => state.byId[id]).filter(Boolean) as Match[];
  return indexByArrayKey(items, path);
}

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

export function selectMatchIdsFilteredByScalar(
  state: MatchState,
  ids: readonly ID[],
  path: readonly string[],
  value: string | number
): ID[] {
  const output: ID[] = [];
  for (const id of ids) {
    const record = state.byId[id];
    const val = getAtPath(record?.data, path);
    if (val === value) output.push(id);
  }
  return output;
}

export type SortDirection = "asc" | "desc";

export function selectMatchIdsSortedByNumericKey(
  state: MatchState,
  ids: readonly ID[],
  path: readonly string[],
  direction: SortDirection
): ID[] {
  const enriched = ids.map((id) => {
    const record = state.byId[id];
    const value = getAtPath(record?.data, path);
    const num = typeof value === "number"
      ? value
      : (direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    return { id, num };
  });
  enriched.sort((a, b) => direction === "asc" ? a.num - b.num : b.num - a.num);
  return enriched.map((row) => row.id);
}

export function selectPaginatedMatchIds(
  ids: readonly ID[],
  page: number,
  pageSize: number
): ID[] {
  const start = Math.max(0, Math.floor(page) * Math.max(1, Math.floor(pageSize)));
  return ids.slice(start, start + Math.max(1, Math.floor(pageSize)));
}
