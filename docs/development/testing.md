# Testing Guide

This guide covers testing strategies, commands, and best practices for the Dota Scout Assistant.

## Testing Overview

The project uses a comprehensive testing strategy with:

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **Mock Data System**: Deterministic, fast testing
- **TypeScript**: Type checking during tests
- **Coverage Reporting**: Track test coverage

## Test Structure

```
src/tests/
├── app/                    # API route tests
│   ├── api/               # API endpoint tests
│   └── pages/             # Page component tests
├── components/             # Component tests
│   ├── layout/            # Layout component tests
│   ├── match/             # Match component tests
│   └── team/              # Team component tests
├── contexts/              # Context provider tests
├── hooks/                 # Custom hook tests
├── lib/                   # Library function tests
│   ├── api/               # API service tests
│   ├── cache-backends/    # Cache backend tests
│   └── services/          # Service function tests
├── mocks/                 # Mock utilities
├── fixtures/              # Test data fixtures
└── utils/                 # Test utilities
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/tests/components/MyComponent.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="should render"
```

### Environment-Specific Testing

```bash
# Test in mock mode (default)
pnpm test

# Test with real API calls
USE_MOCK_API=false pnpm test

# Test with mock data generation
WRITE_REAL_DATA_TO_MOCK=true pnpm test

# Test with specific environment
NODE_ENV=test pnpm test
```

### Test Modes

#### Mock Mode (Default)
- All external API calls are mocked
- Fast, deterministic tests
- No rate limiting concerns
- Uses generated mock data
- See [Environment Variables](./environment-variables.md) for how to enable/disable mock mode.

#### Real API Mode
- Makes real external API calls
- Tests actual API integration
- Respects rate limits
- Slower but more realistic

## Test Categories

### Unit Tests

Test individual functions and components in isolation.

```bash
# Test specific component
pnpm test src/tests/components/MyComponent.test.tsx

# Test specific function
pnpm test src/tests/lib/utils/format.test.ts
```

### Integration Tests

Test how components work together.

```bash
# Test API routes
pnpm test src/tests/app/api/

# Test page components
pnpm test src/tests/app/pages/
```

### End-to-End Tests

Test complete user workflows.

```bash
# Test complete flows
pnpm test:e2e

# Test specific user journey
pnpm test:e2e --testNamePattern="team management"
```

## Writing Tests

### Component Tests

```tsx
// src/tests/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### API Route Tests

```tsx
// src/tests/app/api/teams.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/teams/[id]/route';

describe('/api/teams/[id]', () => {
  it('should return team data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { force: false },
      query: { id: '123' }
    });

    await POST(req, { params: { id: '123' } });
    
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('team');
  });
});
```

### Hook Tests

```tsx
// src/tests/hooks/useTeamData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTeamData } from '@/hooks/useTeamData';

describe('useTeamData', () => {
  it('should fetch team data', async () => {
    const { result } = renderHook(() => useTeamData('123'));

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.loading).toBe(false);
  });
});
```

## Mock Data System

### Using Mock Data

```tsx
// Tests automatically use mock data
import { render, screen } from '@testing-library/react';
import { TeamList } from '@/components/team/TeamList';

describe('TeamList', () => {
  it('should display teams', () => {
    render(<TeamList />);
    
    // Mock data is automatically loaded
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });
});
```

### Generating Mock Data

```bash
# Generate mock data from real APIs
WRITE_REAL_DATA_TO_MOCK=true pnpm test

# Generate specific mock data
WRITE_REAL_DATA_TO_MOCK=true pnpm test --testNamePattern="team data"
```

### Custom Mock Data

```tsx
// src/tests/fixtures/custom-team-data.ts
export const customTeamData = {
  id: 'custom-123',
  name: 'Custom Team',
  players: [
    { id: '1', name: 'Player 1' },
    { id: '2', name: 'Player 2' }
  ]
};

// In test
import { customTeamData } from '@/tests/fixtures/custom-team-data';
jest.mock('@/lib/api/teams', () => ({
  getTeam: jest.fn().mockResolvedValue(customTeamData)
}));
```

## Test Utilities

### Common Test Utilities

```tsx
// src/tests/utils/test-utils.tsx
import { render } from '@testing-library/react';
import { Providers } from '@/providers';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: Providers });
};

export const mockApiResponse = (data: any) => {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
};
```

### Mock API Responses

```tsx
// src/tests/mocks/api-mocks.ts
export const mockTeamData = {
  id: '123',
  name: 'Test Team',
  players: []
};

export const mockMatchData = {
  id: '456',
  radiant_win: true,
  players: []
};

// Use in tests
jest.mock('@/lib/api/teams', () => ({
  getTeam: jest.fn().mockResolvedValue(mockTeamData)
}));
```

## Coverage Reporting

### Coverage Commands

```bash
# Generate coverage report
pnpm test:coverage

# Generate coverage for specific files
pnpm test:coverage src/tests/components/

# Generate HTML coverage report
pnpm test:coverage --coverageReporters=html
```

### Coverage Targets

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Coverage Configuration

```json
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/mocks/**'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    }
  }
};
```

## Testing Best Practices

### Component Testing

1. **Test user interactions**: Focus on what users do, not implementation details
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test accessibility**: Ensure components work with screen readers
4. **Test error states**: Verify error handling and user feedback

### API Testing

1. **Test happy path**: Verify successful API calls
2. **Test error handling**: Verify error responses and retry logic
3. **Test rate limiting**: Verify rate limit handling
4. **Test caching**: Verify cache hit/miss scenarios

### Mock Testing

1. **Use realistic data**: Mock data should resemble real API responses
2. **Test edge cases**: Include error scenarios and edge cases
3. **Keep mocks simple**: Avoid complex mock logic
4. **Update mocks regularly**: Keep mock data current with API changes

## Debugging Tests

### Debug Commands

```bash
# Run tests in debug mode
pnpm test:debug

# Run specific test in debug mode
pnpm test:debug --testNamePattern="MyComponent"

# Run tests with verbose output
pnpm test --verbose
```

### Common Debugging Techniques

```tsx
// Add debug logging
console.log('Test data:', data);

// Use screen.debug() to see rendered output
screen.debug();

// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:coverage
      - run: pnpm lint
      - run: pnpm type-check
```

- **CI logs**: You can view logs for each job and step in the GitHub Actions tab for your repository. Click on a failed job to see detailed output and error messages.
- **Debugging failing jobs**: Look for stack traces, failed assertions, or missing environment variables in the logs. Re-run jobs with SSH or add debug logging as needed.

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm lint && pnpm test",
      "pre-push": "pnpm test:coverage"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Tests Failing Intermittently
```bash
# Increase timeout
pnpm test --testTimeout=10000

# Run tests in isolation
pnpm test --runInBand
```

#### Mock Data Issues
```bash
# Regenerate mock data
WRITE_REAL_DATA_TO_MOCK=true pnpm test

# Clear mock cache
rm -rf mock-data/
```

#### TypeScript Errors in Tests
```bash
# Check types
pnpm type-check

# Fix auto-fixable issues
pnpm lint --fix
```

#### Slow Tests
```bash
# Run tests in parallel
pnpm test --maxWorkers=4

# Run only changed files
pnpm test --onlyChanged
```

### Getting Help

1. **Check test logs**: Look for error messages and stack traces
2. **Review mock data**: Ensure mock data is realistic and complete
3. **Check environment**: Verify test environment variables
4. **Use debug mode**: Run tests with debug logging enabled 