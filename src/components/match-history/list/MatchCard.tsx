/**
 * Match Card Component
 * 
 * Stateless component for displaying individual match information.
 * Uses shadcn components for consistent styling.
 */

import { AlertCircle, Clock, Loader2, Sword, Users } from 'lucide-react';
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
// HELPER FUNCTIONS
// ============================================================================

const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

// Helper to get match display name
const getMatchDisplayName = (match: Match): string => {
  if (match.isLoading) {
    return `Loading ${match.id}`;
  }
  
  // For now, show team IDs until we have proper team names
  return `Match ${match.id}`;
};

// Helper to get player count
const getPlayerCount = (match: Match): number => {
  if (match.isLoading) return 0;
  return (match.players.radiant?.length || 0) + (match.players.dire?.length || 0);
};

// Helper to get hero count
const getHeroCount = (match: Match): number => {
  if (match.isLoading) return 0;
  const radiantHeroes = match.players.radiant?.length || 0;
  const direHeroes = match.players.dire?.length || 0;
  return radiantHeroes + direHeroes;
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
  const isLoading = match.isLoading || false;
  const hasError = Boolean(match.error);
  const matchName = getMatchDisplayName(match);
  const playerCount = getPlayerCount(match);
  const heroCount = getHeroCount(match);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${hasError ? 'border-destructive' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {matchName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading
              </Badge>
            )}
            {hasError && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
            {!isLoading && !hasError && (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${getResultColor(match, activeTeamSide)}`}
              >
                {getResultText(match, activeTeamSide)}
              </div>
            )}
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
                {playerCount} Players
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {heroCount} Heroes
              </span>
            </div>
          </div>

          {/* Error Message */}
          {hasError && (
            <div className="text-xs text-destructive">
              {match.error}
            </div>
          )}

          {/* Hero Tags - Show when data is loaded */}
          {!isLoading && !hasError && match.players.radiant?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.players.radiant.slice(0, 3).map((player, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {player.hero?.name || `Hero ${index + 1}`}
                </Badge>
              ))}
              {match.players.radiant.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.players.radiant.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 