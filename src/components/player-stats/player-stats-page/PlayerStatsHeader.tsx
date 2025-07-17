import React from 'react';

import type { Team } from '@/types/contexts/team-types';

interface PlayerStatsHeaderProps {
  activeTeam: Team | null;
  activeTeamId: string;
}

export const PlayerStatsHeader: React.FC<PlayerStatsHeaderProps> = ({ activeTeam, activeTeamId }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
      Player Statistics for {activeTeam?.name || `Team ${activeTeamId}`}
    </h2>
    <p className="text-muted-foreground dark:text-muted-foreground">
      Analyze individual player performance and statistics for your selected team.
    </p>
  </div>
); 