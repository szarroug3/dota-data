# Dota Data Dashboard

A comprehensive dashboard for analyzing Dota 2 team and player data, with support for multiple data sources including OpenDota, Dotabuff, Stratz, and Dota2ProTracker.

## Features

- Team management and analysis
- Player statistics and performance tracking
- Match history with detailed insights
- Draft suggestions and meta analysis
- Real-time data fetching with rate limiting
- Caching system for improved performance

## Environment Variables

### Mock API Configuration

For development and testing, you can use mock data instead of real API calls:

- `USE_MOCK_API=true` - Mock all API services
- `USE_MOCK_OPENDOTA=true` - Mock only OpenDota API calls
- `USE_MOCK_DOTABUFF=true` - Mock only Dotabuff API calls  
- `USE_MOCK_STRATZ=true` - Mock only Stratz API calls
- `USE_MOCK_D2PT=true` - Mock only Dota2ProTracker API calls
- `MOCK_RATE_LIMIT=1000` - Set requests per minute for mock APIs (default: 1000)

You can combine these to mock specific services while using real APIs for others. For example:
- `USE_MOCK_OPENDOTA=true` - Use mock data for OpenDota, real APIs for everything else
- `USE_MOCK_API=true` - Use mock data for all services
- `USE_MOCK_API=true MOCK_RATE_LIMIT=600` - Use mock data with 600 requests per minute

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

## Data Sources

- **OpenDota**: Match details, player statistics, hero data
- **Dotabuff**: Team information, league data
- **Stratz**: Advanced analytics and insights
- **Dota2ProTracker**: Professional player data

## Architecture

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Redis caching with Upstash
- Rate limiting for API protection

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
