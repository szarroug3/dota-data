import { createResource } from './suspenseResource';

const matchResourceCache = new Map<string, ReturnType<typeof createResource>>();

export function useSuspenseMatchData(matchId: string) {
  if (!matchId) throw new Error("Missing matchId");
  const key = matchId;
  let resource = matchResourceCache.get(key);
  if (!resource) {
    resource = createResource(async () => {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to fetch match");
      return res.json();
    });
    matchResourceCache.set(key, resource);
  }
  return resource.read();
} 