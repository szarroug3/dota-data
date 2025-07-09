# Getting Started

This guide will help you set up and run the Dota Data Dashboard for development.

## Prerequisites

- **Node.js 18+**: Required for Next.js 15 and modern JavaScript features
- **pnpm** (recommended) or npm: Package manager
- **Git**: For version control
- **Redis** (optional): For production-like development with caching and rate limiting

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd dota-data

# Install dependencies
pnpm install
```

### 2. Environment Configuration

#### Option A: Vercel Project Setup (Recommended)

If you have access to the Vercel project:

```bash
# Install Vercel CLI if not already installed
pnpm add -g vercel

# Link to the Vercel project
vercel link

# Pull environment variables from Vercel
vercel env pull .env.development.local
```

#### Option B: Manual Setup

If you don't have Vercel access or prefer manual setup:

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the environment file with your settings
nano .env.local
```

**Recommended minimal configuration for development:**

```bash
# Core settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mock mode (recommended for development)
USE_MOCK_API=true
DEBUG_LOGGING=true

# Optional: Redis for production-like development
USE_REDIS=false
```

See [Environment Variables](./environment-variables.md) for detailed configuration options.

### 3. Start Development Server

```bash
# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Development Workflow

### Mock Mode (Default)

The application runs in mock mode by default, which means:

- All external API calls are mocked
- No rate limiting concerns
- Fast, deterministic development
- Mock data is auto-generated as needed

```bash
# Start in mock mode (default)
pnpm dev
```

### Real API Mode

To test with real external APIs:

```bash
# Start with real API calls
USE_MOCK_API=false pnpm dev
```

**Note**: This will make real calls to OpenDota, Dotabuff, etc. Be mindful of rate limits.

### Generating Mock Data

To build up realistic mock data from real API calls:

```bash
# Generate mock data from real API calls
WRITE_REAL_DATA_TO_MOCK=true pnpm dev
```

This will:
- Make real API calls
- Save the responses to mock files
- Create a realistic dataset for development

---

### Quick Troubleshooting FAQ

- **Why am I seeing mock data?**
  - By default, `USE_MOCK_API` is `true`. Set `USE_MOCK_API=false` in your `.env.local` to use real APIs.
- **How do I force real API calls?**
  - Set `USE_MOCK_API=false` and restart the dev server.
- **How do I regenerate mock data?**
  - Set `WRITE_REAL_DATA_TO_MOCK=true` and run the app with real APIs enabled.
- **Why am I rate limited?**
  - Check your rate limit environment variables and see the [Rate Limiting Layer](../architecture/rate-limiting-layer.md).
- **Why is my data not updating?**
  - Try using the `force` parameter in API calls or clear your cache.
- **How do I reset my environment?**
  - Delete your `.env.local` and copy from `.env.example` to start fresh, or pull fresh environment variables from Vercel with `vercel env pull .env.development.local`.

## Available Scripts

### Development

```bash
# Start development server
pnpm dev

# Start with specific environment variables
USE_MOCK_API=false pnpm dev

# Start with real data generation
WRITE_REAL_DATA_TO_MOCK=true pnpm dev
```

### Testing

```bash
# Run tests in mock mode (default)
pnpm test

# Run tests with real API calls
USE_MOCK_API=false pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### API Documentation

```bash
# Generate OpenAPI spec
pnpm generate:openapi

# View Swagger UI (if Docker is available)
make swagger-docker-ip
```

**Note:** The `make swagger-docker-ip` command requires Docker to be installed and running. If Docker is not available, you can view the generated OpenAPI spec directly in the `/api/openapi` endpoint.

## Development Features

### Hot Reloading

The development server includes:
- **Fast Refresh**: React component hot reloading
- **TypeScript**: Real-time type checking
- **ESLint**: Live linting feedback
- **Tailwind CSS**: Hot reloading for styles

### Mock Data System

The mock data system provides:
- **Auto-generation**: Mock data is created automatically
- **Realistic data**: Based on actual API responses
- **Persistent storage**: Mock data is saved to files
- **Development isolation**: No external dependencies

### Error Handling

Development includes comprehensive error handling:
- **Rate limit simulation**: Mock rate limiting for testing
- **Network error simulation**: Test error scenarios
- **Graceful degradation**: Fallback to mock data
- **Detailed logging**: Helpful error messages

## Common Development Tasks

### Adding a New API Endpoint

1. Create the route file in `src/app/api/`
2. Add JSDoc comments for OpenAPI documentation
3. Implement the endpoint following the [Backend Data Flow](./architecture/backend-data-flow.md)
4. Add tests in `src/tests/app/api/`

### Adding a New Component

1. Create the component in `src/components/`
2. Add TypeScript types in `src/types/components/`
3. Add tests in `src/tests/components/`
4. Follow the [Component Structure & Organization](#component-structure--organization) guidelines

### Adding a New Context

1. Create the context in `src/contexts/`
2. Add types in `src/types/contexts/`
3. Add tests in `src/tests/contexts/`
4. Follow the [Contexts](#contexts) architecture guidelines

### Adding a New Page

1. Create the page in `src/app/` following Next.js App Router conventions
2. Add any required components in `src/components/`
3. Update sidebar navigation in `src/components/layout/Sidebar.tsx`
4. Follow the [Universal Requirements](#universal-requirements-all-pages) guidelines
4. Follow the [Component Structure](./architecture/frontend-architecture.md#component-structure)

### Adding a New Context

1. Create the context in `src/contexts/`
2. Add types in `src/types/contexts/`
3. Add tests in `src/tests/contexts/`
4. Follow the [Contexts section](./architecture/frontend-architecture.md#contexts)

### Testing New Features

```bash
# Test specific file
pnpm test src/tests/components/MyComponent.test.tsx

# Test with real APIs
USE_MOCK_API=false pnpm test src/tests/api/my-endpoint.test.ts

# Test with coverage
pnpm test:coverage src/tests/components/MyComponent.test.tsx
```

## Troubleshooting

### Common Issues

#### Missing Mock Data
```bash
# Enable mock data generation
WRITE_REAL_DATA_TO_MOCK=true pnpm dev
```

#### Rate Limit Errors
- Check logs for rate limiting events
- Adjust limits in [Rate Limiting Layer](./architecture/rate-limiting-layer.md)
- Use mock mode for development

#### Redis Connection Issues
- App will fall back to memory-based rate limiting
- Check Redis configuration in environment variables
- Use mock mode if Redis is unavailable

#### TypeScript Errors
```bash
# Run type checking
pnpm type-check

# Fix auto-fixable issues
pnpm lint --fix
```

#### Build Errors
```bash
# Clean and rebuild
rm -rf .next
pnpm build
```

### Getting Help

1. **Check the logs**: Look for error messages in the terminal
2. **Review documentation**: See the [Architecture docs](./architecture/)
3. **Check environment variables**: Ensure proper configuration
4. **Use mock mode**: Switch to mock mode for isolated testing

## Next Steps

- Read the [Architecture Documentation](./architecture/) for detailed technical information
- Review [Environment Variables](./environment-variables.md) for configuration options
- Check the [Testing Guide](./testing.md) for testing strategies
- See the [Implementation Plan](./implementation/implementation-plan.md) for the complete rebuild plan 