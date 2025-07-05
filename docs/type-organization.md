# Type Organization

This document explains how types are organized in the Dota Data application to ensure consistency and reusability between API routes and React contexts.

## Overview

Types are organized into a centralized structure to avoid duplication and ensure consistency between:
- API routes (`src/app/api/`)
- React contexts (`src/contexts/`)
- Data services (`src/lib/`)

## Type Organization Structure

### 1. Core Domain Types (`src/types/`)

**`src/types/team.ts`**
- `Player` - Player information with optional fields
- `Match` - Match data structure
- `Team` - Team data structure with required core fields

**`src/types/opendota.ts`**
- OpenDota API response types
- Used for external API integration

### 2. Context Types (`src/types/contexts.ts`)

Centralized location for all React context type definitions:

- `DataFetchingContextType` - Data fetching state management
- `MatchDataContextType` - Match data caching and loading
- `PlayerDataContextType` - Player data caching and loading
- `TeamDataContextType` - Team data caching and loading
- `SidebarContextType` - UI state management
- `TeamContextType` - Team management and operations

### 3. Service Types (`src/lib/types/`)

**`src/lib/types/data-service.ts`**
- `PlayerStats` - Player statistics data
- `MatchHistory` - Match history data
- `DraftSuggestions` - Draft recommendation data
- `TeamAnalysis` - Team analysis data
- `MetaInsights` - Meta game insights

### 4. Service-Specific Types

**`src/lib/services/match-history-service.ts`**
- `Match` - Detailed match data with player stats (different from `types/team.ts` Match)
- Used for processing OpenDota match data into application format

**Note**: Some services have their own type definitions when they represent different concepts than the core domain types. For example:
- `types/team.ts` `Match` = Team's match record (simplified)
- `match-history-service.ts` `Match` = Detailed match data with player statistics

## Benefits of This Organization

### 1. Single Source of Truth
- Each type is defined once and imported where needed
- No duplicate type definitions across files
- Consistent type usage across the application

### 2. API-Context Consistency
- API routes and contexts use the same type definitions
- Ensures data structures match between frontend and backend
- Reduces type mismatches and runtime errors

### 3. Maintainability
- Changes to types only need to be made in one place
- Clear separation of concerns between domain types and context types
- Easy to find and update type definitions

### 4. Type Safety
- TypeScript can properly infer types across the application
- Better IntelliSense and autocomplete
- Catch type errors at compile time

## Usage Guidelines

### For API Routes
```typescript
import { Team, Player, Match } from '../../types/team';
import { PlayerStats } from '../../lib/types/data-service';

// Use shared types for request/response handling
```

### For React Contexts
```typescript
import { TeamContextType, PlayerDataContextType } from '../types/contexts';
import { Team, Player } from '../types/team';

// Use centralized context types
```

### For Components
```typescript
import { Team, Player } from '../types/team';
import { PlayerStats } from '../lib/types/data-service';

// Import specific types as needed
```

## Migration Notes

### Before
- Types were scattered across context files
- Duplicate type definitions
- Inconsistent type usage between API and contexts

### After
- Centralized type definitions
- Single source of truth for each type
- Consistent usage across the application
- Better type safety and maintainability

## Future Considerations

1. **API Response Types**: Consider creating dedicated API response types if they differ significantly from domain types
2. **Validation**: Add runtime validation for API responses to ensure type safety
3. **Documentation**: Keep this document updated as new types are added
4. **Testing**: Add type tests to ensure API responses match expected types 