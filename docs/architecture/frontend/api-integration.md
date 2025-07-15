# Frontend API Integration Guide

This document provides comprehensive guidance for integrating the Dota 2 Data Dashboard API endpoints into the frontend application, including data fetching patterns, error handling, and state management.

## Overview

The frontend uses React contexts and custom hooks to manage API interactions, providing a clean separation between data fetching and UI components. All API calls go through the caching, rate limiting, and queueing layers automatically.

## Base Configuration

### API Base URL

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

### Common Headers

```typescript
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

## Data Fetching Patterns

### 1. Context-Based Data Fetching

The frontend uses React contexts to manage API data and state:

```typescript
// src/contexts/ApiContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface ApiContextType {
  heroes: Hero[];
  players: Player[];
  teams: Team[];
  matches: Match[];
  loading: boolean;
  error: string | null;
  fetchHeroes: (params?: HeroParams) => Promise<void>;
  fetchPlayer: (id: number, params?: PlayerParams) => Promise<void>;
  fetchTeam: (id: number, params?: TeamParams) => Promise<void>;
  fetchMatch: (id: number, params?: MatchParams) => Promise<void>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};
```

### 2. Custom Hooks for Specific Endpoints

Create specialized hooks for each API endpoint:

```typescript
// src/hooks/useHeroes.ts
import { useState, useEffect } from 'react';

interface HeroParams {
  complexity?: string;
  role?: string;
  primaryAttribute?: string;
  tier?: string;
  force?: boolean;
}

export const useHeroes = (params: HeroParams = {}) => {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });

        const response = await fetch(`${API_BASE_URL}/heroes?${queryParams}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setHeroes(data.heroes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch heroes');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroes();
  }, [params]);

  return { heroes, loading, error };
};
```

### 3. Player Data Hook

```typescript
// src/hooks/usePlayer.ts
import { useState, useEffect } from 'react';

interface PlayerParams {
  view?: 'overview' | 'detailed' | 'matches';
  includeMatches?: boolean;
  includeHeroes?: boolean;
  includeRecent?: boolean;
  force?: boolean;
}

export const usePlayer = (id: number, params: PlayerParams = {}) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });

        const response = await fetch(`${API_BASE_URL}/players/${id}?${queryParams}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Player not found');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch player');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayer();
    }
  }, [id, params]);

  return { player, loading, error };
};
```

### 4. Team Data Hook

```typescript
// src/hooks/useTeam.ts
import { useState, useEffect } from 'react';

interface TeamParams {
  view?: 'overview' | 'detailed' | 'matches';
  includeMatches?: boolean;
  includeRoster?: boolean;
  force?: boolean;
}

export const useTeam = (id: number, params: TeamParams = {}) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });

        const response = await fetch(`${API_BASE_URL}/teams/${id}?${queryParams}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Team not found');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTeam(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTeam();
    }
  }, [id, params]);

  return { team, loading, error };
};
```

### 5. Match Data Hook

```typescript
// src/hooks/useMatch.ts
import { useState, useEffect } from 'react';

interface MatchParams {
  view?: 'overview' | 'detailed' | 'players';
  parsed?: boolean;
  force?: boolean;
}

export const useMatch = (id: number, params: MatchParams = {}) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });

        const response = await fetch(`${API_BASE_URL}/matches/${id}?${queryParams}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Match not found');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMatch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch match');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMatch();
    }
  }, [id, params]);

  return { match, loading, error };
};
```

### 6. Match Parsing Hook

```typescript
// src/hooks/useMatchParse.ts
import { useState } from 'react';

interface ParseParams {
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
}

export const useMatchParse = () => {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseMatch = async (id: number, params: ParseParams = {}) => {
    try {
      setParsing(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/matches/${id}/parse`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse match';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setParsing(false);
    }
  };

  return { parseMatch, parsing, error };
};
```

## Error Handling

### 1. Standardized Error Handling

```typescript
// src/utils/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (response: Response): never => {
  if (response.status === 404) {
    throw new ApiError('Data not found', 404);
  }
  
  if (response.status === 429) {
    throw new ApiError('Rate limit exceeded', 429);
  }
  
  if (response.status >= 500) {
    throw new ApiError('Server error', response.status);
  }
  
  throw new ApiError('Request failed', response.status);
};
```

### 2. Error Boundary Component

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Loading States

### 1. Loading Component

```typescript
// src/components/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...' 
}) => {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};
```

### 2. Skeleton Loading

```typescript
// src/components/SkeletonLoader.tsx
interface SkeletonLoaderProps {
  type: 'hero-card' | 'player-card' | 'team-card' | 'match-card';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type, 
  count = 1 
}) => {
  return (
    <div className={`skeleton-loader skeleton-loader--${type}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-item">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Component Integration Examples

### 1. Heroes List Component

```typescript
// src/components/heroes/HeroesList.tsx
import { useHeroes } from '@/hooks/useHeroes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

interface HeroesListProps {
  filters?: {
    complexity?: string;
    role?: string;
    primaryAttribute?: string;
    tier?: string;
  };
}

export const HeroesList: React.FC<HeroesListProps> = ({ filters = {} }) => {
  const { heroes, loading, error } = useHeroes(filters);

  if (loading) {
    return <LoadingSpinner message="Loading heroes..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="heroes-list">
      {heroes.map(hero => (
        <HeroCard key={hero.id} hero={hero} />
      ))}
    </div>
  );
};
```

### 2. Player Profile Component

```typescript
// src/components/players/PlayerProfile.tsx
import { usePlayer } from '@/hooks/usePlayer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

interface PlayerProfileProps {
  playerId: number;
  view?: 'overview' | 'detailed' | 'matches';
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ 
  playerId, 
  view = 'overview' 
}) => {
  const { player, loading, error } = usePlayer(playerId, { 
    view, 
    includeMatches: view === 'matches',
    includeHeroes: view === 'detailed'
  });

  if (loading) {
    return <LoadingSpinner message="Loading player data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!player) {
    return <ErrorMessage message="Player not found" />;
  }

  return (
    <div className="player-profile">
      <PlayerHeader player={player} />
      <PlayerStats stats={player.stats} />
      {player.recent_matches && (
        <PlayerMatches matches={player.recent_matches} />
      )}
      {player.heroes && (
        <PlayerHeroes heroes={player.heroes} />
      )}
    </div>
  );
};
```

### 3. Match Details Component

```typescript
// src/components/matches/MatchDetails.tsx
import { useMatch } from '@/hooks/useMatch';
import { useMatchParse } from '@/hooks/useMatchParse';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

interface MatchDetailsProps {
  matchId: number;
  view?: 'overview' | 'detailed' | 'players';
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  matchId, 
  view = 'overview' 
}) => {
  const { match, loading, error } = useMatch(matchId, { view });
  const { parseMatch, parsing } = useMatchParse();

  const handleParseMatch = async () => {
    try {
      await parseMatch(matchId, { priority: 'high' });
      // Optionally refetch match data after parsing
    } catch (error) {
      console.error('Failed to parse match:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading match data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!match) {
    return <ErrorMessage message="Match not found" />;
  }

  return (
    <div className="match-details">
      <MatchHeader match={match.match} />
      <MatchScore match={match.match} />
      <MatchPlayers players={match.players} />
      {match.picks_bans && (
        <MatchDraft picksBans={match.picks_bans} />
      )}
      {match.objectives && (
        <MatchObjectives objectives={match.objectives} />
      )}
      <button 
        onClick={handleParseMatch}
        disabled={parsing}
        className="parse-match-btn"
      >
        {parsing ? 'Parsing...' : 'Parse Match'}
      </button>
    </div>
  );
};
```

## Cache Management

### 1. Cache Invalidation Hook

```typescript
// src/hooks/useCacheInvalidation.ts
import { useState } from 'react';

export const useCacheInvalidation = () => {
  const [invalidating, setInvalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateCache = async (pattern?: string, keys?: string[]) => {
    try {
      setInvalidating(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/cache/invalidate`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ pattern, keys }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invalidate cache';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setInvalidating(false);
    }
  };

  const getCacheStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cache/invalidate`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      throw new Error('Failed to get cache stats');
    }
  };

  return { invalidateCache, getCacheStats, invalidating, error };
};
```

## Rate Limiting

### 1. Rate Limit Monitoring

```typescript
// src/hooks/useRateLimit.ts
import { useState, useEffect } from 'react';

interface RateLimitInfo {
  remaining: number;
  reset_time: number;
}

export const useRateLimit = () => {
  const [rateLimits, setRateLimits] = useState<Record<string, RateLimitInfo>>({});

  const updateRateLimits = (headers: Headers) => {
    const opendotaRemaining = headers.get('X-Rate-Limit-Remaining-Opendota');
    const opendotaReset = headers.get('X-Rate-Limit-Reset-Opendota');
    const dotabuffRemaining = headers.get('X-Rate-Limit-Remaining-Dotabuff');
    const dotabuffReset = headers.get('X-Rate-Limit-Reset-Dotabuff');

    setRateLimits({
      opendota: {
        remaining: parseInt(opendotaRemaining || '0'),
        reset_time: parseInt(opendotaReset || '0'),
      },
      dotabuff: {
        remaining: parseInt(dotabuffRemaining || '0'),
        reset_time: parseInt(dotabuffReset || '0'),
      },
    });
  };

  return { rateLimits, updateRateLimits };
};
```

## Best Practices

### 1. Consistent Error Handling

- Always handle API errors gracefully
- Provide meaningful error messages to users
- Log errors for debugging
- Use error boundaries for component-level error handling

### 2. Loading States

- Show loading indicators for all async operations
- Use skeleton loaders for better UX
- Disable interactive elements during loading

### 3. Data Caching

- Leverage the built-in caching layer
- Use appropriate cache invalidation strategies
- Consider implementing client-side caching for frequently accessed data

### 4. Rate Limiting

- Monitor rate limit headers
- Implement exponential backoff for retries
- Show appropriate messages when rate limits are exceeded

### 5. Type Safety

- Use TypeScript interfaces for all API responses
- Validate API responses at runtime when necessary
- Maintain type consistency across the application

## Related Documentation

- **[Backend API Endpoints](../backend/api-endpoints.md)**: Complete API endpoint documentation
- **[Backend Data Flow](../backend/backend-data-flow.md)**: Backend data flow architecture
- **[Contexts](./contexts.md)**: React context patterns and data management
- **[Hooks](./hooks.md)**: Custom hooks for business logic
- **[Components](./components.md)**: Component architecture and patterns 