# Backend API Route Type Updates

This document tracks the updates made to backend API routes to use centralized types.

## Updated API Routes

### 1. `src/app/api/teams/[id]/matches/route.ts`
- **Added**: `import { TeamApiResponse } from '@/types/contexts';`
- **Used**: `result as TeamApiResponse` for type-safe response handling
- **Purpose**: Uses centralized `TeamApiResponse` type for API response consistency

### 2. `src/app/api/matches/[id]/route.ts`
- **Added**: `import { MatchRequestOptions } from '@/types/contexts';`
- **Used**: `body as MatchRequestOptions & { force?: boolean }` for type-safe request parsing
- **Purpose**: Uses centralized `MatchRequestOptions` type for request validation

### 3. `src/app/api/players/[id]/stats/route.ts`
- **Added**: `import { PlayerRequestParams } from '@/types/contexts';`
- **Note**: Currently commented that this API doesn't use PlayerRequestParams since it doesn't need name/role
- **Purpose**: Ready for future extension with centralized `PlayerRequestParams` type

## Benefits of Backend Updates

### 1. **Consistency with Frontend**
- API routes now use the same type definitions as React contexts
- Ensures request/response structures match between frontend and backend
- Reduces type mismatches and runtime errors

### 2. **Type Safety**
- TypeScript can properly validate API request/response structures
- Better IntelliSense for API development
- Catch type errors at compile time

### 3. **Maintainability**
- Changes to shared types automatically propagate to both frontend and backend
- Single source of truth for API-related types
- Easier to update API contracts

## Type Usage Guidelines

### For API Routes
```typescript
// Import shared types from contexts
import { TeamApiResponse, MatchRequestOptions, PlayerRequestParams } from '@/types/contexts';

// Use for request/response handling
interface RequestBody extends MatchRequestOptions {
  force?: boolean;
}
```

### For Service Functions
```typescript
// Import domain types for internal processing
import { Team, Player, Match } from '@/types/team';
import { PlayerStats } from '@/lib/types/data-service';

// Use for data processing and transformation
```

## Future Considerations

1. **API Response Validation**: Consider adding runtime validation for API responses
2. **OpenAPI Integration**: Ensure OpenAPI schemas match the centralized types
3. **Error Types**: Consider creating centralized error response types
4. **Request Validation**: Add middleware for request body validation using shared types 