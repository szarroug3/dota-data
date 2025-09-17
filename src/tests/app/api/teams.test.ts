import { NextRequest } from 'next/server';

import { GET } from '@/app/api/teams/[id]/route';
import { fetchSteamTeam } from '@/lib/api/steam/teams';

// Mock external dependencies
jest.mock('@/lib/api/steam/teams', () => ({
  fetchSteamTeam: jest.fn(),
}));

const mockFetchSteamTeam = fetchSteamTeam as jest.MockedFunction<typeof fetchSteamTeam>;

const mockTeam = {
  id: '9517508',
  name: 'Team Spirit',
};

describe('Teams API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/teams/{id}', () => {
    describe('Success Cases', () => {
      it('should return team data successfully', async () => {
        mockFetchSteamTeam.mockResolvedValueOnce(mockTeam as any);
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockTeam);
        expect(mockFetchSteamTeam).toHaveBeenCalledWith('9517508', false);
      });

      it('should handle force refresh parameter', async () => {
        mockFetchSteamTeam.mockResolvedValueOnce(mockTeam as any);
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?force=true');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });

        expect(response.status).toBe(200);
        expect(mockFetchSteamTeam).toHaveBeenCalledWith('9517508', true);
      });
    });

    describe('Error Cases', () => {
      it('should handle rate limiting errors', async () => {
        mockFetchSteamTeam.mockRejectedValueOnce(new Error('Rate limited by Steam API'));

        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data).toEqual({
          error: 'Rate limited by Steam API',
          status: 429,
          details: 'Too many requests to Steam API. Please try again later.',
        });
      });

      it('should handle data not found errors', async () => {
        mockFetchSteamTeam.mockRejectedValueOnce(new Error('Data Not Found'));

        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({
          error: 'Data Not Found',
          status: 404,
          details: 'Team with ID 9517508 could not be found.',
        });
      });

      it('should handle invalid team data errors', async () => {
        mockFetchSteamTeam.mockRejectedValueOnce(new Error('Invalid team data'));

        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data).toEqual({
          error: 'Invalid team data',
          status: 422,
          details: 'Team data is invalid or corrupted.',
        });
      });

      it('should handle unexpected errors', async () => {
        mockFetchSteamTeam.mockRejectedValueOnce(new Error('Unexpected error'));

        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          error: 'Failed to process team',
          status: 500,
          details: 'Unexpected error',
        });
      });

      it('should handle non-Error exceptions', async () => {
        mockFetchSteamTeam.mockRejectedValueOnce('String error');

        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          error: 'Failed to process team',
          status: 500,
          details: 'Unknown error occurred',
        });
      });
    });
  });
});
