/**
 * Match Card Component
 * 
 * Stateless component for displaying individual match information.
 * Uses shadcn components for consistent styling.
 */

import { Clock, Sword, Users } from 'lucide-react';
import React from 'react';


import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

// ============================================================================
// TYPES
// ============================================================================

interface MatchCardProps {
  match: Match;
  isSelected: boolean;
  onSelect: () => void;
  activeTeamSide?: 'radiant' | 'dire'; // Which side the active team played on
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to determine if the active team won
const didActiveTeamWin = (match: Match, activeTeamSide?: 'radiant' | 'dire'): boolean => {
  if (!activeTeamSide) return false;
  return match.result === activeTeamSide;
};

const getResultColor = (match: Match, activeTeamSide?: 'radiant' | 'dire'): string => {
  const teamWon = didActiveTeamWin(match, activeTeamSide);
  return teamWon ? 'bg-green-500' : 'bg-red-500';
};

const getResultText = (match: Match, activeTeamSide?: 'radiant' | 'dire'): string => {
  const teamWon = didActiveTeamWin(match, activeTeamSide);
  return teamWon ? 'W' : 'L';
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isSelected,
  onSelect,
  activeTeamSide
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            vs {match.opponent}
          </CardTitle>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${getResultColor(match, activeTeamSide)}`}
          >
            {getResultText(match, activeTeamSide)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Match Date and Duration */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(match.duration)}</span>
            </div>
          </div>

          {/* Match Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {match.players.length} Players
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {match.heroes.length} Heroes
              </span>
            </div>
          </div>

          {/* Hero Tags */}
          {match.heroes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.heroes.slice(0, 3).map((hero, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {hero}
                </Badge>
              ))}
              {match.heroes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.heroes.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 