# Project Structure

This document describes the recommended folder structure for the Dota Data codebase, ensuring clear separation of concerns and maintainability. This structure supports the modern architecture with [QStash-based queueing](./queueing-layer.md), [Redis-first caching](./caching-layer.md), and [distributed rate limiting](./rate-limiting-layer.md).

## Complete Project Structure

```
src/
├── app/                           # Next.js app router
│   ├── api/                       # API route handlers (thin handlers)
│   │   ├── heroes/                # Heroes endpoint
│   │   ├── teams/                 # Teams endpoint
│   │   ├── players/               # Players endpoint
│   │   ├── matches/               # Matches endpoint
│   │   ├── leagues/               # Leagues endpoint
│   │   └── cache/                 # Cache management endpoint
│   ├── layout.tsx                 # Root layout with providers (TODO: Phase 4.5)
│   └── page.tsx                   # Home page (TODO: Phase 4.5)
├── team-management/               # Team management page (TODO: Phase 4.5)
├── match-history/                 # Match history page (TODO: Phase 4.5)
├── player-stats/                  # Player stats page (TODO: Phase 4.5)
├── draft-suggestions/             # Draft suggestions page (TODO: Phase 4.5)
└── team-analysis/                 # Team analysis page (TODO: Phase 4.5)
├── components/                    # React UI components
│   ├── layout/                    # Layout components (sidebar, header, etc.)
│   ├── dashboard/                 # Dashboard-specific components
│   ├── team-management/           # Team management components
│   ├── match-history/             # Match history components
│   ├── player-stats/              # Player stats components
│   ├── draft-suggestions/         # Draft suggestions components
│   ├── team-analysis/             # Team analysis components
│   ├── match/                     # Match-related components
│   ├── player/                    # Player-related components
│   ├── hero/                      # Hero-related components
│   ├── team/                      # Team-related components
│   └── ui/                        # Reusable UI primitives
├── contexts/                      # React context providers
│   ├── team-context.tsx           # Team data context
│   ├── match-context.tsx          # Match data context
│   ├── player-context.tsx         # Player data context
│   ├── hero-context.tsx           # Hero data context
│   └── config-context.tsx         # Configuration context
├── hooks/                         # React custom hooks
│   ├── use-team-data.ts           # Team data fetching hook
│   ├── use-match-data.ts          # Match data fetching hook
│   ├── use-player-data.ts         # Player data fetching hook
│   ├── use-hero-data.ts           # Hero data fetching hook
│   └── use-cache-management.ts    # Cache management hook
├── lib/                           # Utilities & business logic
│   ├── api/                       # Backend-only logic
│   │   ├── opendota/              # OpenDota API clients
│   │   ├── dotabuff/              # Dotabuff API clients
│   │   └── services/              # Data processing services
│   ├── cache-backends/            # Cache implementations
│   │   ├── redis.ts               # Redis cache backend
│   │   └── memory.ts              # Memory cache backend
│   ├── rate-limit-backends/       # Rate limit implementations
│   │   ├── redis.ts               # Redis rate limit backend
│   │   └── memory.ts              # Memory rate limit backend
│   ├── queue-backends/            # Queue implementations
│   │   ├── qstash.ts              # QStash queue backend
│   │   └── memory.ts              # Memory queue backend
│   ├── server/                    # Backend-only utilities
│   ├── client/                    # Frontend-only utilities
│   └── shared/                    # Shared utilities
├── types/                         # TypeScript type definitions
│   ├── api.ts                     # API response/request types
│   ├── cache.ts                   # Cache-related types
│   ├── queue.ts                   # Queue-related types
│   ├── rate-limit.ts              # Rate limiting types
│   ├── external-apis.ts           # External API types
│   ├── contexts/                  # Context value types
│   ├── components/                # Component prop types
│   └── hooks/                     # Hook return types
└── tests/                         # All test files
    ├── app/                       # Page and API tests
    ├── components/                # Component tests
    ├── contexts/                  # Context tests
    ├── hooks/                     # Hook tests
    ├── lib/                       # Library tests
    ├── utils/                     # Test utilities
    ├── mocks/                     # Mock data and utilities
    └── fixtures/                  # Test data fixtures
```

## Folder Purpose Summary

| Folder / Path                | Purpose | Key Contents |
|------------------------------|---------|--------------|
| **src/app/**                 | Next.js app router | API route handlers, layouts, pages |
| ├── api/                     | API route handlers | Thin handlers, import from `lib/api/` |
| ├── layout.tsx               | Root layout | Providers, sidebar, global styles (TODO: Phase 4.5) |
| └── page.tsx                 | Home page | Main dashboard page (TODO: Phase 4.5) |
| **src/app/team-management/** | Team management page | [Team management components](./frontend-architecture.md#team-management-page) (TODO: Phase 4.5) |
| **src/app/match-history/**   | Match history page | [Match history components](./frontend-architecture.md#match-history-page) (TODO: Phase 4.5) |
| **src/app/player-stats/**    | Player stats page | [Player stats components](./frontend-architecture.md#player-stats-page) (TODO: Phase 4.5) |
| **src/app/draft-suggestions/** | Draft suggestions page | [Draft suggestions components](./frontend-architecture.md#draft-suggestions-page) (TODO: Phase 4.5) |
| **src/app/team-analysis/**   | Team analysis page | [Team analysis components](./frontend-architecture.md#team-analysis-page) (TODO: Phase 4.5) |
| **src/components/**          | React UI components | All UI components organized by feature |
| ├── layout/                  | Layout components | [Sidebar, header, etc.](./frontend-architecture.md#layout-components) |
| ├── dashboard/               | Dashboard components | [Dashboard page components](./frontend-architecture.md#dashboard-page) |
| ├── team-management/         | Team management components | [Team management components](./frontend-architecture.md#team-management-page) |
| ├── match-history/           | Match history components | [Match history components](./frontend-architecture.md#match-history-page) |
| ├── player-stats/            | Player stats components | [Player stats components](./frontend-architecture.md#player-stats-page) |
| ├── draft-suggestions/       | Draft suggestions components | [Draft suggestions components](./frontend-architecture.md#draft-suggestions-page) |
| ├── team-analysis/           | Team analysis components | [Team analysis components](./frontend-architecture.md#team-analysis-page) |
| ├── match/                   | Match components | [Match card, match details](./frontend-architecture.md#match-card) |
| ├── player/                  | Player components | [Player stats table](./frontend-architecture.md#player-stats-table) |
| ├── hero/                    | Hero components | [Hero suggestions list](./frontend-architecture.md#hero-suggestions-list) |
| ├── team/                    | Team components | [Team overview stats](./frontend-architecture.md#team-overview-stats) |
| └── ui/                      | UI primitives | Reusable buttons, forms, modals, etc. |
| **src/contexts/**            | React context providers | [Contexts](./frontend-architecture.md#contexts) |
| **src/hooks/**               | React custom hooks | [Custom hooks](./frontend-architecture.md#custom-hooks) and utility hooks |
| **src/lib/**                 | Utilities & business logic | Backend services, infrastructure layers |
| ├── api/                     | Backend-only logic | [External API services](./frontend-architecture.md#external-api-services) and data processing |
| ├── cache-backends/          | Cache implementations | [Redis](./caching-layer.md) and [memory](./caching-layer.md) cache backends |
| ├── rate-limit-backends/     | Rate limit implementations | [Redis](./rate-limiting-layer.md) and [memory](./rate-limiting-layer.md) rate limit backends |
| ├── queue-backends/          | Queue implementations | [QStash](./queueing-layer.md) and [memory](./queueing-layer.md) queue backends |
| ├── server/                  | Backend-only utils | Node.js-only code: logging, file system, etc. |
| ├── client/                  | Frontend-only utils | Browser-only code: localStorage, window, etc. |
| └── shared/                  | Shared utilities | Pure helpers, formatting, math, etc. |
| **src/types/**               | TypeScript types | [Type organization](./type-organization.md) for all type definitions |
| **src/tests/**               | Tests | [Comprehensive test coverage](./frontend-architecture.md#testing-and-quality-assurance) for all components | 