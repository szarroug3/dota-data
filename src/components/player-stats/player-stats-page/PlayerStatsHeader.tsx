import React from 'react';

import type { Team } from '@/types/contexts/team-context-value';

interface PlayerStatsHeaderProps {
  activeTeam: Team | null;
  activeTeamId: string;
}

export const PlayerStatsHeader: React.FC<PlayerStatsHeaderProps> = ({ activeTeam, activeTeamId }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Player Statistics for {activeTeam?.name || `Team ${activeTeamId}`}
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Analyze individual player performance and statistics for your selected team.
    </p>
  </div>
); 