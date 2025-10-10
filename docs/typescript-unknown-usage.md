# TypeScript `unknown` Type Usage Guidelines

## Overview

The `unknown` type is now allowed in this codebase, but should be used responsibly and only in specific, well-justified cases. This document outlines when and how to use `unknown` appropriately.

## When to Use `unknown`

### ✅ Legitimate Use Cases

#### 1. **Logging Data**

```typescript
// ✅ GOOD: Logging data can be literally anything
interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  timestamp: string;
  data?: unknown; // Can be objects, primitives, errors, etc.
}
```

#### 2. **External API Responses (Before Validation)**

```typescript
// ✅ GOOD: External APIs return unpredictable data
const response: unknown = await fetch('/external-api');
const validatedData = MySchema.parse(response);
```

#### 3. **Type Narrowing Intermediate Steps**

```typescript
// ✅ GOOD: Safer than direct type assertions
const data = response as unknown as MyType;
// Then validate with type guards or runtime checks
if (isValidMyType(data)) {
  // Now data is properly typed
}
```

#### 4. **Generic Utility Functions**

```typescript
// ✅ GOOD: When you truly don't know the type
function deepClone<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
```

### ❌ Avoid These Patterns

#### 1. **Default Fallback When You Haven't Created Types**

```typescript
// ❌ BAD: Create proper types instead
interface UserData {
  name: string;
  email: unknown; // Should be string
}

// ✅ GOOD: Create proper types
interface UserData {
  name: string;
  email: string;
}
```

#### 2. **Lazy Type Definitions**

```typescript
// ❌ BAD: Don't use unknown to avoid defining types
function processData(data: unknown) {
  // This should have a proper interface
}

// ✅ GOOD: Define proper types
interface ProcessedData {
  id: number;
  value: string;
  metadata: Record<string, unknown>; // Only if truly dynamic
}
```

#### 3. **Avoiding Type Work**

```typescript
// ❌ BAD: Using unknown to avoid proper typing
const result: unknown = complexFunction();

// ✅ GOOD: Type the function properly
const result: ComplexResult = complexFunction();
```

## Best Practices

### 1. **Always Narrow Types**

```typescript
// ✅ GOOD: Narrow unknown to specific types
function processApiResponse(response: unknown): ProcessedData {
  if (typeof response === 'object' && response !== null) {
    const data = response as Record<string, unknown>;
    return {
      id: data.id as number,
      name: data.name as string,
    };
  }
  throw new Error('Invalid response format');
}
```

### 2. **Use Type Guards**

```typescript
// ✅ GOOD: Create type guards for unknown data
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as any).id === 'number' &&
    typeof (data as any).name === 'string'
  );
}
```

### 3. **Document Why You're Using `unknown`**

```typescript
// ✅ GOOD: Document the reason
const externalApiResponse: unknown = await fetchData();
// Using unknown because the external API can return different shapes
// depending on the endpoint and version
```

## Migration Strategy

When you encounter `unknown` in the codebase:

1. **Ask**: "Could this be a more specific type?"
2. **If yes**: Create proper types and interfaces
3. **If no**: Document why `unknown` is necessary
4. **Always**: Add proper type narrowing/validation

## Examples from This Codebase

### Logger (Appropriate Usage)

```typescript
// src/lib/logger.ts
interface LogEntry {
  data?: unknown; // ✅ Appropriate - logging data is truly dynamic
}
```

### External API Schemas (Appropriate Usage)

```typescript
// Zod schemas with catchall
.catchall(z.unknown()) // ✅ Appropriate - external APIs are unpredictable
```

### Type Assertions (Should Be Improved)

```typescript
// Current pattern - should be improved
const matches = transformedTeam.matches as Record<string, TeamMatchParticipation>;

// Better pattern
const matches = transformedTeam.matches as unknown as Record<string, TeamMatchParticipation>;
// Then validate with type guards
```

## Enforcement

While `unknown` is now allowed, the following practices are encouraged:

1. **Code Reviews**: Always question `unknown` usage
2. **Documentation**: Comment why `unknown` is necessary
3. **Type Narrowing**: Always narrow `unknown` to specific types
4. **Alternative First**: Consider if a more specific type is possible

Remember: `unknown` should be the exception, not the rule. When in doubt, create proper types.
