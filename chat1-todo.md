# Backend Code Quality Cleanup TODO

## Overview
Fix linting and code quality issues in backend files while maintaining all tests passing.

## Issues Identified
- 4 import order errors in test files
- 110+ linting warnings in backend files
- TypeScript `any` types throughout backend
- High complexity functions
- Unused variables
- TypeScript type errors

## TODO Items

### 1. Fix Import Order Errors in Test Files
- [x] Fix import order in `src/tests/app/api/heroes.test.ts`
  - [x] Remove empty line within import group
  - [x] Reorder imports: `@/lib/graceful-shutdown`, `@/lib/performance-monitor`, `@/lib/request-tracer` should come before `@/lib/services/hero-processor`
- [x] Run `pnpm lint` to verify import order fixes

### 2. Replace `any` Types with Proper TypeScript Types
- [x] Fix `any` types in `src/app/api/health/route.ts` (4 instances)
- [x] Fix `any` types in `src/lib/error-handler.ts` (6 instances)
- [x] Fix `any` types in `src/lib/graceful-shutdown.ts` (5 instances)
- [x] Fix `any` types in `src/lib/middleware/performance-middleware.ts` (6 instances)
- [ ] Fix `any` types in `src/lib/request-tracer.ts` (9 instances)
- [ ] Fix `any` types in `src/lib/services/processor-optimizer.ts` (5 instances)
- [ ] Fix `any` types in `src/lib/utils/data-transformation.ts` (20+ instances)
- [ ] Fix `any` types in `src/lib/utils/response-formatter.ts` (8 instances)
- [ ] Fix `any` types in `src/lib/utils/validation.ts` (4 instances)
- [ ] Run `pnpm type-check` to verify type fixes

### 3. Remove Unused Variables
- [x] Remove unused variables in `src/app/api/health/route.ts` (startUsage, startTime, request)
- [x] Remove unused variables in `src/app/api/health/simple/route.ts` (request)
- [x] Remove unused variables in `src/app/api/heroes/route.ts` (performanceMetrics)
- [x] Remove unused variables in `src/lib/error-handler.ts` (logEntry)
- [x] Remove unused variables in `src/lib/graceful-shutdown.ts` (tracer)
- [x] Remove unused variables in `src/lib/middleware/performance-middleware.ts` (enableDetailedLogging, slowRequestThreshold, metrics, duration)
- [ ] Remove unused variables in `src/lib/services/processor-optimizer.ts` (cacheHit, stats, processorName)
- [x] Remove unused variables in test files (error variables in heroes.test.ts)
- [x] Run `pnpm lint` to verify unused variable removal

### 4. Refactor High Complexity Functions
- [ ] Refactor `GET` function in `src/app/api/heroes/route.ts` (complexity: 39, lines: 142)
- [ ] Refactor `getSeverityFromCategory` in `src/lib/error-handler.ts` (complexity: 14)
- [ ] Refactor `getRetryableFromCategory` in `src/lib/error-handler.ts` (complexity: 14)
- [ ] Refactor `log` method in `src/lib/error-handler.ts` (complexity: 12)
- [ ] Refactor `handleApiError` in `src/lib/error-handler.ts` (complexity: 14)
- [ ] Refactor `getErrorDetails` in `src/lib/error-handler.ts` (complexity: 12)
- [ ] Refactor `classifyError` in `src/lib/error-handler.ts` (complexity: 19)
- [ ] Refactor async arrow function in `src/lib/middleware/performance-middleware.ts` (complexity: 11)
- [ ] Refactor `validateProcessedTeam` in `src/lib/services/team-processor.ts` (complexity: 11)
- [ ] Refactor `withTimeout` in `src/lib/timeout-manager.ts` (complexity: 11)
- [ ] Refactor `retry` in `src/lib/timeout-manager.ts` (complexity: 12)
- [ ] Refactor `validateQueryParams` in `src/lib/utils/validation.ts` (complexity: 18)
- [ ] Refactor `processed` in `src/lib/utils/response-formatter.ts` (complexity: 12)
- [ ] Refactor `collection` in `src/lib/utils/response-formatter.ts` (complexity: 15)
- [ ] Refactor `async` in `src/lib/utils/response-formatter.ts` (complexity: 14)
- [ ] Run `pnpm lint` to verify complexity reductions

### 5. Improve Error Handling and Logging
- [ ] Review error handling patterns in all backend files
- [ ] Ensure consistent error response formats
- [ ] Improve error logging with proper context
- [ ] Add proper error types instead of `any`

### 6. Code Quality Improvements
- [ ] Review and improve code documentation
- [ ] Ensure consistent naming conventions
- [ ] Optimize performance where possible
- [ ] Add proper JSDoc comments for complex functions

### 7. Quality Assurance
- [ ] Run `pnpm lint` to check all linting issues are resolved
- [ ] Run `pnpm type-check` to verify TypeScript compilation
- [ ] Run `pnpm test` to ensure all backend tests pass
- [ ] Verify no new warnings or errors introduced

### 8. Documentation Updates
- [ ] Update any relevant documentation if API changes are made
- [ ] Update type definitions if needed
- [ ] Document any new error handling patterns

## Success Criteria
- [x] All linting errors resolved (0 errors remaining)
- [ ] All linting warnings resolved (81 warnings remaining)
- [x] All TypeScript compilation errors resolved
- [x] All backend tests passing
- [x] No new issues introduced
- [ ] Code complexity reduced to acceptable levels (ongoing)
- [x] Proper TypeScript types used throughout (for completed files)

## Notes
- Focus only on backend files: `/src/app/api/`, `/src/lib/`, `/src/tests/app/api/`, `/src/tests/lib/`
- Do not modify frontend files
- Maintain backward compatibility where possible
- Follow the backend architecture guidelines from `docs/architecture/backend-data-flow.md` 