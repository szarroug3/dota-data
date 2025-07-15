# Dota Scout Assistant

A modern, full-stack dashboard for analyzing Dota 2 team and player data, specifically designed for amateur league players to improve their drafting and team performance. Built with Next.js, TypeScript, and a robust backend architecture.

## Features

- **[Team Management & Analysis](./docs/architecture/frontend-architecture.md#team-management-page)**: Import teams from Dotabuff with automatic match and player data queueing
- **[Player Statistics & Performance Tracking](./docs/architecture/frontend-architecture.md#player-stats-page)**: Comprehensive player analytics with background data fetching
- **[Match History with Detailed Insights](./docs/architecture/frontend-architecture.md#match-history-page)**: Complete match analysis with draft information and player stats
- **[Draft Suggestions and Meta Analysis](./docs/architecture/frontend-architecture.md#draft-suggestions-page)**: AI-powered draft recommendations based on team performance and amateur league meta
- **[Real-time Data Fetching](./docs/architecture/backend-data-flow.md)**: Intelligent queueing system with rate limiting and background processing
- **[Advanced Caching System](./docs/architecture/caching-layer.md)**: Redis-based caching with mock support for development
- **[Hybrid Loading Pattern](./docs/architecture/frontend-architecture.md#hydration-strategy)**: Immediate responses when cached, background loading for heavy operations
- **[Serverless-Optimized](./docs/architecture/project-structure.md)**: Designed for Vercel free tier with distributed rate limiting and queueing

## Quick Start

See [docs/development/getting-started.md](./docs/development/getting-started.md) for detailed setup instructions.

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Architecture Overview

### Modern Stack
- **Next.js 15 with App Router**: Modern React framework with server-side rendering
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Redis Caching**: Upstash Redis for production caching with memory fallback
- **Distributed Rate Limiting**: Redis-backed rate limiting across all serverless instances
- **QStash Queueing**: Robust background job processing with QStash
- **Mock Data Support**: Comprehensive mocking system for development and testing

### Data Flow
1. **API Route Handler**: Receives request and checks cache
2. **Cache Service**: Returns data if available, or queues background job
3. **Background Processing**: Queue processor handles external API calls with rate limiting
4. **Mock Data Layer**: Supports development with mock data generation
5. **Cache Update**: All returned data is cached for future requests

## Data Sources

- **OpenDota**: Match details, player statistics, hero data
- **Dotabuff**: Team information, league data, amateur and professional player data
- **Dota2ProTracker**: Professional player data, meta insights for amateur leagues

See [Rate Limiting Layer](./docs/architecture/rate-limiting-layer.md) for more info on external API usage and limits.

## Documentation

### Architecture
- **[Frontend Architecture](./docs/architecture/frontend-architecture.md)**: Complete frontend architecture with component structure and requirements
- **[Backend Data Flow](./docs/architecture/backend-data-flow.md)**: Backend data flow and API patterns
- **[Caching Layer](./docs/architecture/caching-layer.md)**: Redis-first caching with memory fallback
- **[Rate Limiting Layer](./docs/architecture/rate-limiting-layer.md)**: Distributed rate limiting across serverless instances
- **[Queueing Layer](./docs/architecture/queueing-layer.md)**: QStash-based background job processing
- **[Project Structure](./docs/architecture/project-structure.md)**: Recommended file and folder organization
- **[Type Organization](./docs/architecture/type-organization.md)**: TypeScript type organization and safety

### Development
- **[Getting Started](./docs/development/getting-started.md)**: Complete setup and development guide
- **[Environment Variables](./docs/development/environment-variables.md)**: All environment variables and configuration
- **[Testing Guide](./docs/development/testing.md)**: Testing strategies and commands

### Implementation
- **[Development Guide](./docs/development/getting-started.md)**: Complete setup and development guide
- **[Testing Guide](./docs/development/testing.md)**: Testing strategies and commands

## API Documentation

This project uses [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) to generate the OpenAPI spec from JSDoc comments in the API route files. To update the OpenAPI spec:

```sh
pnpm generate:openapi
```

You can view the documentation in Swagger UI by running:

```sh
make swagger-docker-ip
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

This project uses Vercel for auto-deployment and hosting:

- **Vercel**: Auto-deployment and hosting of the Next.js application
- **Upstash Redis**: Distributed caching and rate limiting
- **QStash**: Background job processing and queueing

For deployment configuration, see [Environment Variables](./docs/development/environment-variables.md).
