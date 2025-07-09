# Type Organization

This document describes the organization and usage of TypeScript types in the Dota Data codebase. This type organization supports the modern architecture with [QStash-based queueing](./queueing-layer.md), [Redis-first caching](./caching-layer.md), and [distributed rate limiting](./rate-limiting-layer.md).

## Contexts
- All context value types are defined in `src/types/contexts/`.
- Contexts import their types from this directory and expose only the minimal API.

## Hooks
- All custom hook return types are defined in `src/types/hooks/` or colocated with the hook.
- Hooks return fully typed objects, never `any` or `unknown`.

## Component Props
- All component props are defined in `src/types/components/` or colocated with the component.
- All props are fully typed and minimal.

## Centralized Imports
- All types are imported from `src/types/` or subdirectories, never defined inline in components or hooks.
- This ensures type safety, reusability, and maintainability across the codebase. 

## Type Safety Improvements (2024-06)

- All usages of `any` and `unknown` in backend and shared types have been replaced with specific, strongly-typed interfaces or generics.
- `BatchMatchData` is now defined as `MatchData & { error?: boolean }`, ensuring batch match results are always strongly typed.
- The `MockDatabase` class is now generic (`MockDatabase<T = object>`), allowing for type-safe mock storage in tests and development.
- All data-fetching hooks and match-related types now use canonical types (`MatchData`, `MatchDisplayData`, `OpenDotaMatch`, etc.) from the appropriate files in `src/types/` and `src/lib/hooks/types/`.
- This ensures full TypeScript safety and linter compliance across backend and shared code.
- **All new types should be added to the appropriate subfolder in `src/types/` (e.g., `contexts/`, `components/`, `hooks/`). Inline types in components or hooks are discouraged for maintainability and consistency.**

## Related Documentation

- **[Frontend Architecture](./frontend-architecture.md):** Complete frontend architecture including type usage patterns
- **[Project Structure](./project-structure.md):** Recommended folder structure for type organization
- **[Backend Data Flow](./backend-data-flow.md):** Backend data flow including type integration
- **[Caching Layer](./caching-layer.md):** Cache-related types and interfaces
- **[Rate Limiting Layer](./rate-limiting-layer.md):** Rate limiting types and interfaces
- **[Queueing Layer](./queueing-layer.md):** Queue-related types and interfaces 