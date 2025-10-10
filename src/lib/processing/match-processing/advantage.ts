import type { OpenDotaMatch } from '@/types/external-apis';

export function calculateAdvantageData(matchData: OpenDotaMatch) {
  const times = Array.from({ length: matchData.radiant_gold_adv?.length || 0 }, (_, i) => i * 60);
  const goldAdvantage = matchData.radiant_gold_adv || [];
  const experienceAdvantage = matchData.radiant_xp_adv || [];

  return {
    goldAdvantage: {
      times,
      radiantGold: goldAdvantage,
      direGold: goldAdvantage.map((adv) => -adv),
    },
    experienceAdvantage: {
      times,
      radiantExperience: experienceAdvantage,
      direExperience: experienceAdvantage.map((adv) => -adv),
    },
  };
}
