'use client';

import { useSearchParams } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, Suspense } from 'react';

import type { Team } from '@/frontend/lib/app-data-types';

type ActiveTeam = { teamId: number; leagueId: number } | null;

export type Serializable = string | number | boolean | null | Serializable[] | { [key: string]: Serializable } | Team;

export interface SharePayload {
  teams: Record<string, Serializable>;
  activeTeam: ActiveTeam;
  globalManualMatches: number[];
  globalManualPlayers: number[];
}

interface ShareContextValue {
  isShareMode: boolean;
  shareKey: string | null;
  payload: SharePayload | null;
  setPayload: (payload: SharePayload) => void;
  createShare: (partial: Partial<SharePayload>) => Promise<string | null>;
}

const ShareContext = createContext<ShareContextValue | undefined>(undefined);
const defaultShareContext: ShareContextValue = {
  isShareMode: false,
  shareKey: null,
  payload: null,
  setPayload: () => {},
  createShare: async () => null,
};

// Type guard for SharePayload validation
function isSharePayload(data: unknown): data is SharePayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'teams' in data &&
    'activeTeam' in data &&
    'globalManualMatches' in data &&
    'globalManualPlayers' in data &&
    typeof (data as Record<string, unknown>).teams === 'object' &&
    Array.isArray((data as Record<string, unknown>).globalManualMatches) &&
    Array.isArray((data as Record<string, unknown>).globalManualPlayers)
  );
}

async function fetchSharePayload(key: string): Promise<SharePayload | null> {
  try {
    const res = await fetch(`/api/share/${encodeURIComponent(key)}`);
    if (!res.ok) return null;

    // Use unknown intermediate step for safer type narrowing
    const responseData: unknown = await res.json();
    const shareData = responseData as unknown as SharePayload;

    // Validate the response structure
    if (!isSharePayload(shareData)) {
      console.warn(`Invalid share payload structure for key ${key}`);
      return null;
    }

    return shareData;
  } catch (e) {
    console.error('Failed to fetch share payload', e);
    return null;
  }
}

async function postSharePayload(key: string | null, data: SharePayload): Promise<string | null> {
  try {
    const res = await fetch(`/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key || undefined, data }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { key: string };
    return json.key;
  } catch (e) {
    console.error('Failed to post share payload', e);
    return null;
  }
}

const ShareProviderContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchParams = useSearchParams();
  const urlKey = useMemo(() => searchParams.get('config'), [searchParams]);

  const [shareKey, setShareKey] = useState<string | null>(null);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  const isShareMode = Boolean(urlKey);

  useEffect(() => {
    setShareKey(urlKey);
  }, [urlKey]);

  useEffect(() => {
    let cancelled = false;
    if (urlKey) {
      fetchSharePayload(urlKey).then((data) => {
        if (!cancelled) setPayload((prev) => (prev ? prev : data));
      });
    } else {
      setPayload(null);
    }
    return () => {
      cancelled = true;
    };
  }, [urlKey]);

  const buildMergedPayload = useCallback(
    (partial: Partial<SharePayload>): SharePayload => ({
      teams: payload?.teams || {},
      activeTeam: payload?.activeTeam || null,
      globalManualMatches: payload?.globalManualMatches || [],
      globalManualPlayers: payload?.globalManualPlayers || [],
      ...partial,
    }),
    [payload],
  );

  const createShare = useCallback(
    async (partial: Partial<SharePayload>): Promise<string | null> => {
      const merged = buildMergedPayload(partial);
      const key = await postSharePayload(null, merged);
      if (key) {
        setPayload(merged);
      }
      return key;
    },
    [buildMergedPayload],
  );

  const value: ShareContextValue = {
    isShareMode,
    shareKey,
    payload,
    setPayload,
    createShare,
  };

  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
};

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<ShareContext.Provider value={defaultShareContext}>{children}</ShareContext.Provider>}>
      <ShareProviderContent>{children}</ShareProviderContent>
    </Suspense>
  );
};

export function useShareContext(): ShareContextValue {
  const ctx = useContext(ShareContext);
  if (!ctx) return defaultShareContext;
  return ctx;
}
