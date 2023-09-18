'use server';

import { Heroes } from '@/types/hero';
import { PartialMatch } from '@/types/match';

import { fetchOpenDotaMatchInfo } from './api';
import { fetchFromCacheOrApi } from './common';

const getOpenDotaMatchInfo = async (
  matchId: number,
  heroes: Heroes
): Promise<PartialMatch | null> => {
  const cacheKey = `openDotaMatchInfo_${matchId}`;

  return fetchFromCacheOrApi(
    cacheKey,
    () => fetchOpenDotaMatchInfo(matchId),
    false
  ).then((matchInfo) => {
    if (!matchInfo) {
      throw new Error(`Couldn't get match info for ${matchId}.`);
    }

    const processedMatchInfo: PartialMatch = {
      matchId: matchId,
    };

    return processedMatchInfo;
  });
};

export { getOpenDotaMatchInfo };
