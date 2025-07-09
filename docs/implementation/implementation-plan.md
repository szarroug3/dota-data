# Implementation Plan

> **How to use this plan:**
> - Follow each phase in order, completing all checklist items before moving to the next phase.
> - See the linked documentation for detailed requirements, architecture, and best practices.
> - Mark each item as complete as you go to track progress.

This document outlines the complete rebuild of the Dota Data application, following the [modern architecture](./architecture/) and ensuring linter-clean, fully-typed, and well-tested code.

## Implementation Goals

- **Linter-clean**: No ESLint errors or warnings
- **Fully typed**: No `any` or `unknown` types, proper TypeScript usage (see [Type Organization](./architecture/type-organization.md))
- **Unit tested**: Everything that needs testing has comprehensive tests
- **Modern architecture**: [QStash queueing](./architecture/queueing-layer.md), [Redis caching](./architecture/caching-layer.md), [distributed rate limiting](./architecture/rate-limiting-layer.md)
- **Clean separation**: Backend/frontend separation, proper component structure (see [Project Structure](./architecture/project-structure.md))

## Phase 1: Foundation Layer (Backend Infrastructure)

### 1.1 Core Types and Interfaces
**Purpose**: Define all TypeScript types and interfaces for the application. This ensures type safety across the entire codebase and prevents runtime errors.

**Why needed**: The application uses multiple external APIs and complex data structures. Proper typing ensures consistency and catch errors at compile time.

**Checklist:**
- [ ] Create `src/types/api.ts` - API response types, request types
- [ ] Create `src/types/cache.ts` - Cache-related types
- [ ] Create `src/types/queue.ts` - Queue-related types
- [ ] Create `src/types/rate-limit.ts` - Rate limiting types
- [ ] Create `src/types/external-apis.ts` - OpenDota, Dotabuff, etc. types
- [ ] Add JSDoc comments for complex types
- [ ] Add unit tests for type validation

**Related docs**: [Type Organization](./architecture/type-organization.md), [Backend Data Flow](./architecture/backend-data-flow.md)

### 1.2 Caching Layer
**Purpose**: Implement Redis-first caching with memory fallback to improve performance and reduce external API calls.

**Why needed**: External APIs have rate limits and can be slow. Caching reduces redundant requests and improves user experience.

**Checklist:**
- [ ] Create `src/lib/cache-service.ts` - Main cache service with automatic backend selection
- [ ] Create `src/lib/cache-backends/redis.ts` - Redis backend implementation
- [ ] Create `src/lib/cache-backends/memory.ts` - Memory backend implementation
- [ ] Create `src/lib/utils/cache-keys.ts` - Cache key generation utilities
- [ ] Create `src/tests/lib/cache-service.test.ts` - Comprehensive cache tests
- [ ] Create `src/tests/lib/cache-backends/redis.test.ts` - Redis backend tests
- [ ] Create `src/tests/lib/cache-backends/memory.test.ts` - Memory backend tests

**Related docs**: [Caching Layer](./architecture/caching-layer.md), [Backend Data Flow](./architecture/backend-data-flow.md)

### 1.3 Rate Limiting Layer
**Purpose**: Implement distributed rate limiting to respect external API limits and prevent abuse.

**Why needed**: External APIs (OpenDota, Dotabuff, etc.) have rate limits. Exceeding these can result in blocks or 429 errors.

**Checklist:**
- [ ] Create `src/lib/rate-limiter.ts` - Main rate limiting service
- [ ] Create `src/lib/rate-limit-backends/redis.ts` - Redis-backed implementation
- [ ] Create `src/lib/rate-limit-backends/memory.ts` - Memory implementation
- [ ] Create `src/lib/types/rate-limit.ts` - Rate limiting types
- [ ] Create `src/tests/lib/rate-limiter.test.ts` - Rate limiter tests
- [ ] Create `src/tests/lib/rate-limit-backends/redis.test.ts` - Redis rate limit tests
- [ ] Create `src/tests/lib/rate-limit-backends/memory.test.ts` - Memory rate limit tests

**Related docs**: [Rate Limiting Layer](./architecture/rate-limiting-layer.md), [Environment Variables](../development/environment-variables.md#rate-limiting-configuration)

### 1.4 Queueing Layer
**Purpose**: Implement background job processing with QStash for handling heavy operations without blocking the user.

**Why needed**: Some operations (like match parsing) are time-consuming. Queueing allows immediate responses while processing happens in the background.

**Checklist:**
- [ ] Create `src/lib/request-queue.ts` - Main queueing service
- [ ] Create `src/lib/queue-backends/qstash.ts` - QStash backend implementation
- [ ] Create `src/lib/queue-backends/memory.ts` - Memory fallback implementation
- [ ] Create `src/lib/types/queue.ts` - Queue-related types
- [ ] Create `src/tests/lib/request-queue.test.ts` - Queue service tests
- [ ] Create `src/tests/lib/queue-backends/qstash.test.ts` - QStash tests
- [ ] Create `src/tests/lib/queue-backends/memory.test.ts` - Memory queue tests

**Related docs**: [Queueing Layer](./architecture/queueing-layer.md), [Backend Data Flow](./architecture/backend-data-flow.md)

### 1.5 Logging Infrastructure
**Purpose**: Implement centralized logging for both frontend and backend to aid in debugging and monitoring.

**Why needed**: The application has complex data flows and external API interactions. Proper logging helps identify issues and monitor performance.

**Checklist:**
- [ ] Create `src/lib/utils/backend-logger.ts` - Backend logging utility (file logging to logs/server.log)
- [ ] Create `src/tests/lib/utils/backend-logger.test.ts` - Backend logger tests
- [ ] Update all existing code to use centralized logging utilities
- [ ] Ensure logging respects `DEBUG_LOGGING` and `LOG_LEVEL` environment variables

**Related docs**: [Environment Variables](../development/environment-variables.md#logging-configuration), [Frontend Architecture](./architecture/frontend-architecture.md#centralized-logging)

### 1.6 External Service Icons
**Purpose**: Create custom SVG icons for external services and implement user preference system for external links.

**Why needed**: Users have preferences for external sites (OpenDota vs Dotabuff). Custom icons provide consistent branding and better UX.

**Checklist:**
- [ ] Create `src/components/icons/ExternalSiteIcons.tsx` - Custom SVG icons for external services
- [ ] Import icons from backup: OpenDota, Dotabuff, Stratz, Dota2ProTracker
- [ ] Create `src/tests/components/icons/ExternalSiteIcons.test.tsx` - Icon component tests
- [ ] Update all external links to use custom icons consistently
- [ ] Implement user preference system for external site links (OpenDota vs Dotabuff)

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#external-service-icons-and-links)

### 1.7 Documentation Cleanup
**Purpose**: Clean up documentation by removing redundancy and improving organization.

**Why needed**: Documentation should be clear, concise, and well-organized for new contributors.

**Checklist:**
- [ ] Move all code block comments with links outside of code blocks
- [ ] Remove redundant one-sentence explanations across all docs
- [ ] Ensure all documentation cross-references are accurate
- [ ] Update implementation plan with any new requirements discovered during development

**Related docs**: All architecture and development documentation

## Phase 2: API Layer (Backend Services)

### 2.1 External API Services
**Purpose**: Create type-safe API clients for all external services (OpenDota, Dotabuff, Dota2ProTracker).

**Why needed**: External APIs provide the core data for the application. Proper clients ensure reliable data fetching with error handling.

**Checklist:**
- [ ] Create `src/lib/api/opendota/heroes.ts` - OpenDota heroes API
- [ ] Create `src/lib/api/opendota/matches.ts` - OpenDota matches API
- [ ] Create `src/lib/api/opendota/players.ts` - OpenDota players API
- [ ] Create `src/lib/api/dotabuff/teams.ts` - Dotabuff teams API
- [ ] Create `src/lib/api/dotabuff/leagues.ts` - Dotabuff leagues API
- [ ] Create `src/lib/api/services/hero-utils.ts` - Hero utility functions
- [ ] Create `src/tests/lib/api/opendota/heroes.test.ts` - OpenDota tests
- [ ] Create `src/tests/lib/api/dotabuff/teams.test.ts` - Dotabuff tests

**Related docs**: [Backend Data Flow](./architecture/backend-data-flow.md), [Endpoint Summary](./architecture/endpoint-summary.md)

### 2.2 Data Processing Services
**Purpose**: Transform raw API data into frontend-friendly formats with proper validation and error handling.

**Why needed**: External APIs return raw data that needs processing, validation, and transformation for frontend consumption.

**Checklist:**
- [ ] Create `src/lib/services/match-processor.ts` - Match data processing
- [ ] Create `src/lib/services/player-processor.ts` - Player data processing
- [ ] Create `src/lib/services/team-processor.ts` - Team data processing
- [ ] Create `src/lib/services/hero-processor.ts` - Hero data processing
- [ ] Create `src/tests/lib/services/match-processor.test.ts` - Match processor tests
- [ ] Create `src/tests/lib/services/player-processor.test.ts` - Player processor tests

**Related docs**: [Backend Data Flow](./architecture/backend-data-flow.md), [Type Organization](./architecture/type-organization.md)

### 2.3 API Route Handlers
**Purpose**: Create thin API route handlers that delegate to services and handle HTTP concerns.

**Why needed**: Next.js API routes need to handle HTTP requests, responses, and errors while delegating business logic to services.

**Checklist:**
- [ ] Create `src/app/api/heroes/route.ts` - Heroes endpoint
- [ ] Create `src/app/api/teams/[id]/route.ts` - Team endpoint
- [ ] Create `src/app/api/players/[id]/route.ts` - Player endpoint
- [ ] Create `src/app/api/matches/[id]/route.ts` - Match endpoint
- [ ] Create `src/app/api/matches/[id]/parse/route.ts` - Match parsing endpoint
- [ ] Create `src/app/api/leagues/[id]/route.ts` - League endpoint
- [ ] Create `src/app/api/cache/invalidate/route.ts` - Cache invalidation endpoint
- [ ] Create `src/tests/app/api/heroes.test.ts` - API route tests
- [ ] Create `src/tests/app/api/teams.test.ts` - Team API tests

**Related docs**: [Backend Data Flow](./architecture/backend-data-flow.md), [Endpoint Summary](./architecture/endpoint-summary.md)

## Phase 3: Frontend Infrastructure

### 3.1 Core Types and Interfaces
**Purpose**: Define TypeScript types for frontend components, contexts, and hooks.

**Why needed**: Frontend components need proper typing for props, state, and data structures to ensure type safety.

**Checklist:**
- [ ] Create `src/types/contexts/team-context-value.ts` - Team context types
- [ ] Create `src/types/contexts/match-context-value.ts` - Match context types
- [ ] Create `src/types/contexts/player-context-value.ts` - Player context types
- [ ] Create `src/types/contexts/hero-context-value.ts` - Hero context types
- [ ] Create `src/types/components/match-card.ts` - Match card component types
- [ ] Create `src/types/components/player-stats.ts` - Player stats component types
- [ ] Create `src/types/hooks/use-team-data.ts` - Team data hook types

**Related docs**: [Type Organization](./architecture/type-organization.md), [Frontend Architecture](./architecture/frontend-architecture.md)

### 3.2 Context Providers
**Purpose**: Create React context providers for global state management and data fetching.

**Why needed**: The application needs to share data across components efficiently without prop drilling.

**Checklist:**
- [ ] Create `src/contexts/team-context.tsx` - Team data context
- [ ] Create `src/contexts/match-context.tsx` - Match data context
- [ ] Create `src/contexts/player-context.tsx` - Player data context
- [ ] Create `src/contexts/hero-context.tsx` - Hero data context
- [ ] Create `src/contexts/config-context.tsx` - Configuration context
- [ ] Create `src/tests/contexts/team-context.test.tsx` - Team context tests
- [ ] Create `src/tests/contexts/match-context.test.tsx` - Match context tests

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#contexts)

### 3.3 Custom Hooks
**Purpose**: Create reusable hooks for data fetching, state management, and business logic.

**Why needed**: Hooks provide reusable logic and help separate concerns between data fetching and UI components.

**Checklist:**
- [ ] Create `src/hooks/use-team-data.ts` - Team data fetching hook
- [ ] Create `src/hooks/use-match-data.ts` - Match data fetching hook
- [ ] Create `src/hooks/use-player-data.ts` - Player data fetching hook
- [ ] Create `src/hooks/use-hero-data.ts` - Hero data fetching hook
- [ ] Create `src/hooks/use-cache-management.ts` - Cache management hook
- [ ] Create `src/tests/hooks/use-team-data.test.ts` - Team data hook tests
- [ ] Create `src/tests/hooks/use-match-data.test.ts` - Match data hook tests

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#custom-hooks)

## Phase 4: UI Components

### 4.1 Layout Components
**Purpose**: Create reusable layout components for consistent page structure and navigation.

**Why needed**: Layout components provide consistent structure across all pages and handle common UI patterns.

**Checklist:**
- [ ] Create `src/components/layout/sidebar.tsx` - Navigation sidebar
- [ ] Create `src/components/layout/header.tsx` - Page header
- [ ] Create `src/components/layout/loading-skeleton.tsx` - Loading skeleton
- [ ] Create `src/components/layout/error-boundary.tsx` - Error boundary
- [ ] Create `src/tests/components/layout/sidebar.test.tsx` - Sidebar tests
- [ ] Create `src/tests/components/layout/loading-skeleton.test.tsx` - Loading tests

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#layout-components)

### 4.2 Page Components
**Purpose**: Create page-level components that orchestrate data fetching and layout.

**Why needed**: Each page needs its own component to handle page-specific logic and data requirements.

**Checklist:**
- [ ] Create `src/components/dashboard/dashboard-page.tsx` - Dashboard page
- [ ] Create `src/components/team-management/team-management-page.tsx` - Team management
- [ ] Create `src/components/match-history/match-history-page.tsx` - Match history
- [ ] Create `src/components/player-stats/player-stats-page.tsx` - Player stats
- [ ] Create `src/components/draft-suggestions/draft-suggestions-page.tsx` - Draft suggestions
- [ ] Create `src/components/team-analysis/team-analysis-page.tsx` - Team analysis
- [ ] Create `src/tests/components/dashboard/dashboard-page.test.tsx` - Dashboard tests
- [ ] Create `src/tests/components/team-management/team-management-page.test.tsx` - Team management tests

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#pages)

### 4.3 Feature Components
**Purpose**: Create reusable feature components for specific functionality.

**Why needed**: Feature components encapsulate specific functionality and can be reused across different pages.

**Checklist:**
- [ ] Create `src/components/match/match-card.tsx` - Match card component
- [ ] Create `src/components/match/match-details.tsx` - Match details component
- [ ] Create `src/components/player/player-stats-table.tsx` - Player stats table
- [ ] Create `src/components/hero/hero-suggestions-list.tsx` - Hero suggestions
- [ ] Create `src/components/team/team-overview-stats.tsx` - Team overview stats
- [ ] Create `src/tests/components/match/match-card.test.tsx` - Match card tests
- [ ] Create `src/tests/components/player/player-stats-table.test.tsx` - Player stats tests

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#component-structure)

## Phase 5: Pages and Routing

### 5.1 Next.js App Router Pages
**Purpose**: Create Next.js pages that use the app router and integrate with the component system.

**Why needed**: Next.js pages provide routing and server-side rendering capabilities.

**Checklist:**
- [ ] Create `src/app/page.tsx` - Home page (redirects to dashboard)
- [ ] Create `src/app/dashboard/page.tsx` - Dashboard page
- [ ] Create `src/app/team-management/page.tsx` - Team management page
- [ ] Create `src/app/match-history/page.tsx` - Match history page
- [ ] Create `src/app/player-stats/page.tsx` - Player stats page
- [ ] Create `src/app/draft-suggestions/page.tsx` - Draft suggestions page
- [ ] Create `src/app/team-analysis/page.tsx` - Team analysis page
- [ ] Create `src/app/layout.tsx` - Root layout with providers
- [ ] Create `src/tests/app/dashboard.test.tsx` - Dashboard page tests
- [ ] Create `src/tests/app/team-management.test.tsx` - Team management page tests

**Related docs**: [Frontend Architecture](./architecture/frontend-architecture.md#pages), [Project Structure](./architecture/project-structure.md)

## Phase 6: Testing and Quality Assurance

### 6.1 Test Infrastructure
**Purpose**: Set up comprehensive testing infrastructure for all components and utilities.

**Why needed**: Testing ensures code quality, prevents regressions, and provides confidence in changes.

**Checklist:**
- [ ] Create `jest.setup.js` - Jest setup configuration
- [ ] Create `src/tests/utils/test-utils.tsx` - Test utilities and helpers
- [ ] Create `src/tests/mocks/api-mocks.ts` - API mocking utilities
- [ ] Create `src/tests/mocks/context-mocks.ts` - Context mocking utilities
- [ ] Create `src/tests/fixtures/test-data.ts` - Test data fixtures

**Related docs**: [Testing Guide](../development/testing.md)

### 6.2 Linting and Type Checking
**Purpose**: Set up linting and type checking to ensure code quality and consistency.

**Why needed**: Linting and type checking catch errors early and enforce consistent coding standards.

**Checklist:**
- [ ] Create `eslint.config.mjs` - ESLint configuration
- [ ] Create `tsconfig.json` - TypeScript configuration
- [ ] Create `.prettierrc` - Prettier configuration
- [ ] Create `src/types/global.d.ts` - Global type declarations

**Related docs**: [Getting Started](../development/getting-started.md)

## Success Criteria

- ✅ **Zero linter errors or warnings** (see [Universal Requirements](./architecture/frontend-architecture.md#universal-requirements))
- ✅ **100% TypeScript coverage with no `any` or `unknown`** (see [Type Organization](./architecture/type-organization.md#type-safety-improvements-2024-06))
- ✅ **90%+ test coverage** (see [Universal Requirements](./architecture/frontend-architecture.md#universal-requirements))
- ✅ **All components accessible and responsive** (see [Universal Requirements](./architecture/frontend-architecture.md#universal-requirements))
- ✅ **Modern architecture implemented** ([QStash](./architecture/queueing-layer.md), [Redis](./architecture/caching-layer.md), [distributed rate limiting](./architecture/rate-limiting-layer.md))
- ✅ **Clean separation of concerns** (see [Project Structure](./architecture/project-structure.md) and [Frontend Architecture](./architecture/frontend-architecture.md#component-structure))
- ✅ **Comprehensive error handling** throughout the application (see [Universal Requirements](./architecture/frontend-architecture.md#universal-requirements)) 