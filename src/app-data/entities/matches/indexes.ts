export type ID = number | string;
export type Key = string | number;

/** Safely drill into an object by a path, returning unknown. */
export function getAtPath(obj: unknown, path: readonly string[]): unknown {
  let current: unknown = obj;
  for (const segment of path) {
    if (current && typeof current === "object" && !Array.isArray(current) && (segment in (current as Record<string, unknown>))) {
      current = (current as Record<string, unknown>)[segment as keyof typeof current];
    } else {
      return undefined;
    }
  }
  return current;
}

/** Build an index by scalar value at data[path]. */
export function indexByScalarKey<T extends { id: ID; data?: unknown }>(
  items: readonly T[],
  path: readonly string[]
): Record<Key, ID[]> {
  const out: Record<string, ID[]> = {};
  for (const item of items) {
    const value = getAtPath(item.data, path);
    if (typeof value === "string" || typeof value === "number") {
      const k = String(value);
      (out[k] ||= []).push(item.id);
    }
  }
  return out;
}

/** Build a multi-index where data[path] is an array of scalar values. */
export function indexByArrayKey<T extends { id: ID; data?: unknown }>(
  items: readonly T[],
  path: readonly string[]
): Record<Key, ID[]> {
  const out: Record<string, ID[]> = {};
  for (const item of items) {
    const value = getAtPath(item.data, path);
    if (Array.isArray(value)) {
      for (const element of value) {
        if (typeof element === "string" || typeof element === "number") {
          const k = String(element);
          (out[k] ||= []).push(item.id);
        }
      }
    }
  }
  return out;
}
