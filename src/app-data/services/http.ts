// Minimal HTTP client wrapper (no runtime wire-up here).
// Exported so ESLint doesn't flag unused; callers import these explicitly later.

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}

export function createHttpClient(fetchImpl: typeof fetch): HttpClient {
  return {
    async get<T>(url: string): Promise<T> {
      const res = await fetchImpl(url);
      if (!res.ok) throw new Error(`GET ${url} failed with ${'{'}res.status{'}'}`);
      return (await res.json()) as T;
    },
    async post<T>(url: string, body: unknown): Promise<T> {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`POST ${url} failed with ${'{'}res.status{'}'}`);
      return (await res.json()) as T;
    },
  };
}
