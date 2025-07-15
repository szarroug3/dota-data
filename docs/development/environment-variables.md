# Environment Variables

This document describes all environment variables used by the Dota Scout Assistant.

## Quick Setup

### Option A: Vercel Project Setup (Recommended)

If you have access to the Vercel project:

```bash
# Install Vercel CLI if not already installed
pnpm add -g vercel

# Link to the Vercel project
vercel link

# Pull environment variables from Vercel
vercel env pull .env.development.local
```

### Option B: Manual Setup

If you don't have Vercel access or prefer manual setup:

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

## Core Configuration

### Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | `development` | Environment mode (development/production) |
| `NEXT_PUBLIC_APP_URL` | string | `http://localhost:3000` | Public app URL |

### Mock Mode Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `USE_MOCK_API` | boolean | `true` | Enable/disable all external API mocking |
| `USE_MOCK_OPENDOTA` | boolean | `true` | Mock OpenDota API calls |
| `USE_MOCK_DOTABUFF` | boolean | `true` | Mock Dotabuff API calls |
| `USE_MOCK_STRATZ` | boolean | `true` | Mock Stratz API calls |
| `USE_MOCK_D2PT` | boolean | `true` | Mock Dota2ProTracker API calls |
| `WRITE_REAL_DATA_TO_MOCK` | boolean | `false` | Save real API responses to mock files |
| `MOCK_RATE_LIMIT` | number | `60` | Mock rate limit (requests per minute) |

## Logging Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEBUG_LOGGING` | boolean | `false` | Enable detailed debug logging (frontend console, backend file) |
| `LOG_LEVEL` | string | `info` | Logging level (debug, info, warn, error) |
| `LOG_FILE_PATH` | string | `logs/server.log` | Backend log file path (server-side only) |

**Note:** `DEBUG_LOGGING` enables detailed logging for development. When enabled:
- **Frontend**: Detailed console logging for data fetching, state changes, and errors
- **Backend**: Detailed file logging to `logs/server.log` for API calls, rate limiting, and errors
- **Performance**: May impact performance in production, use only for debugging

## Redis Configuration (Optional)

Redis is used for distributed caching and rate limiting in production.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REDIS_URL` | string | - | Redis connection string |
| `UPSTASH_REDIS_REST_URL` | string | - | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | string | - | Upstash Redis REST token |
| `USE_REDIS` | boolean | `false` | Enable Redis for caching and rate limiting |

### Redis Setup

#### Local Redis (Development)
```bash
# Install Redis locally
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server

# Set environment variable
REDIS_URL=redis://localhost:6379
```

#### Upstash Redis (Production)
1. Create account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the REST URL and token to your environment variables

## QStash Configuration (Optional)

QStash is used for background job processing in production.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `QSTASH_TOKEN` | string | - | QStash authentication token |
| `QSTASH_CURRENT_SIGNING_KEY` | string | - | QStash current signing key |
| `QSTASH_NEXT_SIGNING_KEY` | string | - | QStash next signing key |
| `USE_QSTASH` | boolean | `false` | Enable QStash for background jobs |

### QStash Setup

1. Create account at [qstash.upstash.com](https://qstash.upstash.com)
2. Create a new project
3. Copy the token and signing keys to your environment variables

## Rate Limiting Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMIT_OPENDOTA` | number | `60` | OpenDota requests per minute |
| `RATE_LIMIT_DOTABUFF` | number | `60` | Dotabuff requests per minute |
| `RATE_LIMIT_STRATZ` | number | `20` | Stratz requests per minute |
| `RATE_LIMIT_D2PT` | number | `30` | Dota2ProTracker requests per minute |
| `RATE_LIMIT_WINDOW` | number | `60` | Rate limit window in seconds |

**Note:** Updated limits based on testing and external API behavior:
- **Dotabuff**: Increased from 30 to 60 requests/minute (1 req/sec) for better performance
- **D2PT**: Increased from 10 to 30 requests/minute (1 req/2sec) based on site analysis

## External API Configuration

### OpenDota
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENDOTA_API_KEY` | string | - | OpenDota API key (optional, for higher rate limits) |
| `OPENDOTA_API_BASE_URL` | string | `https://api.opendota.com/api` | OpenDota API base URL |
| `OPENDOTA_API_TIMEOUT` | number | `10000` | API timeout in milliseconds |

### Dotabuff
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DOTABUFF_BASE_URL` | string | `https://www.dotabuff.com` | Dotabuff base URL |
| `DOTABUFF_REQUEST_DELAY` | number | `1000` | Delay between requests in milliseconds |

### Dota2ProTracker
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `D2PT_BASE_URL` | string | `https://dota2protracker.com` | D2PT base URL |
| `D2PT_REQUEST_DELAY` | number | `2000` | Delay between requests in milliseconds |

## Testing Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TEST_MOCK_MODE` | boolean | `true` | Use mock mode for tests |
| `TEST_TIMEOUT` | number | `10000` | Test timeout in milliseconds |

## Configuration Examples

### Minimal Development Setup
```bash
# .env.local
USE_MOCK_API=true
WRITE_REAL_DATA_TO_MOCK=true
DEBUG_LOGGING=true
```

### Full Development Setup (with Redis)
```bash
# .env.local
USE_MOCK_API=false
WRITE_REAL_DATA_TO_MOCK=true
USE_REDIS=true
REDIS_URL=redis://localhost:6379
RATE_LIMIT_OPENDOTA=60
RATE_LIMIT_DOTABUFF=60
RATE_LIMIT_D2PT=30
DEBUG_LOGGING=true
```

### Production Setup
```bash
# .env.production
USE_MOCK_API=false
USE_REDIS=true
USE_QSTASH=true
REDIS_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_URL=your-upstash-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key
DEBUG_LOGGING=false
```

## Validation

The application validates environment variables on startup:

```bash
# Check environment configuration
pnpm validate:env

# Start with validation
pnpm dev --validate-env
```

If a required environment variable is missing, the application will print an error and may refuse to start, or will fall back to a safe default if possible. Always check your terminal output for missing or misconfigured variables.

---

## Common Mistakes / FAQ

- **I set `USE_MOCK_API=false` but still see mock data.**
  - Check if you have any of the more specific mock variables (e.g., `USE_MOCK_OPENDOTA`, `USE_MOCK_DOTABUFF`) set to `true`.
  - Make sure to restart the dev server after changing environment variables.
- **I set a rate limit variable but it doesn't seem to apply.**
  - Double-check the variable name and value. See the [Rate Limiting Layer](../architecture/rate-limiting-layer.md) for details.
- **I get errors about missing Redis or QStash variables.**
  - If you are not using Redis or QStash, set `USE_REDIS=false` and/or `USE_QSTASH=false`.
- **My environment changes aren't taking effect.**
  - Restart the dev server after any changes to `.env.local` or other env files.
- **How do I see what environment variables are set?**
  - Print them with `printenv | grep YOUR_VAR` or log `process.env` in your code.
- **Debug logging isn't working.**
  - Set `DEBUG_LOGGING=true` and check console (frontend) or `logs/server.log` (backend).
- **I'm getting too much debug output.**
  - Set `DEBUG_LOGGING=false` or adjust `LOG_LEVEL` to reduce verbosity.

## Troubleshooting

### Common Issues

#### Redis Connection Errors
```bash
# Check Redis connection
redis-cli ping

# Use memory fallback
USE_REDIS=false pnpm dev
```

#### QStash Configuration Errors
```bash
# Disable QStash for development
USE_QSTASH=false pnpm dev
```

#### Rate Limit Issues
```bash
# Increase rate limits for development
RATE_LIMIT_OPENDOTA=120 pnpm dev
RATE_LIMIT_DOTABUFF=90 pnpm dev
RATE_LIMIT_D2PT=60 pnpm dev
```

#### Mock Data Issues
```bash
# Regenerate mock data
WRITE_REAL_DATA_TO_MOCK=true pnpm dev
```

#### Logging Issues
```bash
# Enable debug logging
DEBUG_LOGGING=true pnpm dev

# Check backend logs
tail -f logs/server.log
```

## Security Notes

- Never commit `.env.local` or `.env.production` to version control
- Use different Redis/QStash instances for development and production
- Rotate API keys and tokens regularly
- Use environment-specific rate limits
- Monitor API usage and adjust limits as needed