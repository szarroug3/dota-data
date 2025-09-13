import { NextRequest } from 'next/server';

import { GET } from '@/app/api/teams/[id]/route';
import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
import { DotabuffTeam } from '@/types/external-apis';

// Mock external dependencies
jest.mock('@/lib/api/dotabuff/teams', () => ({
  fetchDotabuffTeam: jest.fn()
}));

const mockFetchDotabuffTeam = fetchDotabuffTeam as jest.MockedFunction<typeof fetchDotabuffTeam>;

const mockTeam: DotabuffTeam = {
  id: '9517508',
  name: 'Team Spirit',
  matches: {
    8054301932: {
      matchId: 8054301932,
      result: 'won',
      duration: 2400,
      opponentName: 'Team Liquid',
      leagueId: '16435',
      startTime: 1640995200
    }
  }
};

describe('Teams API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/teams/{id}', () => {
    describe('Success Cases', () => {
      it('should return team data successfully', async () => {
        mockFetchDotabuffTeam.mockResolvedValueOnce(mockTeam);
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockTeam);
        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', false);
      });

      it('should handle force refresh parameter', async () => {
        mockFetchDotabuffTeam.mockResolvedValueOnce(mockTeam);
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?force=true');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });

        expect(response.status).toBe(200);
        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', true);
      });
    });

    describe('Error Cases', () => {
      it('should handle rate limiting errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValueOnce(new Error('Rate limited by Dotabuff API'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data).toEqual({
          error: 'Rate limited by Dotabuff API',
          status: 429,
          details: 'Too many requests to Dotabuff API. Please try again later.'
        });
      });

      it('should handle data not found errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValueOnce(new Error('Data Not Found'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({
          error: 'Data Not Found',
          status: 404,
          details: 'Team with ID 9517508 could not be found.'
        });
      });

      it('should handle invalid team data errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValueOnce(new Error('Invalid team data'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(422);
        expect(data).toEqual({
          error: 'Invalid team data',
          status: 422,
          details: 'Team data is invalid or corrupted.'
        });
      });

      it('should handle unexpected errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValueOnce(new Error('Unexpected error'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          error: 'Failed to process team',
          status: 500,
          details: 'Unexpected error'
        });
      });

      it('should handle non-Error exceptions', async () => {
        mockFetchDotabuffTeam.mockRejectedValueOnce('String error');
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: Promise.resolve({ id: '9517508' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          error: 'Failed to process team',
          status: 500,
          details: 'Unknown error occurred'
        });
      });
    });
  });
}); 