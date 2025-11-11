import { GET } from '@/app/api/projects/[projectId]/surveys/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyAssignment: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/projects/[projectId]/surveys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if projectId is missing', async () => {
    const req = new Request('http://localhost/api/projects/surveys', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Project ID is required');
  });

  it('should return list of survey assignments with criteria', async () => {
    const mockAssignments = [
      {
        id: 'assignment1',
        projectId: 'project1',
        createdAt: new Date('2024-01-01'),
        survey: {
          id: 'survey1',
          title: 'Survey 1',
          description: 'Description 1',
          creatorId: 'instructor1',
          criteria: [
            { id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 },
            { id: 'criterion2', label: 'Teamwork', minRating: 1, maxRating: 5, order: 2 },
          ],
        },
      },
      {
        id: 'assignment2',
        projectId: 'project1',
        createdAt: new Date('2024-01-02'),
        survey: {
          id: 'survey2',
          title: 'Survey 2',
          description: 'Description 2',
          creatorId: 'instructor1',
          criteria: [
            { id: 'criterion3', label: 'Leadership', minRating: 1, maxRating: 5, order: 1 },
          ],
        },
      },
    ];

    (prisma.surveyAssignment.findMany as jest.Mock).mockResolvedValue(mockAssignments);

    const req = new Request('http://localhost/api/projects/project1/surveys', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assignments).toHaveLength(2);
    expect(data.assignments[0].survey.criteria).toHaveLength(2);
    expect(data.assignments[1].survey.criteria).toHaveLength(1);
    expect(prisma.surveyAssignment.findMany).toHaveBeenCalledWith({
      where: { projectId: 'project1' },
      orderBy: { createdAt: 'desc' },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
            description: true,
            creatorId: true,
            criteria: {
              select: {
                id: true,
                label: true,
                minRating: true,
                maxRating: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  });

  it('should return empty array if no surveys exist', async () => {
    (prisma.surveyAssignment.findMany as jest.Mock).mockResolvedValue([]);

    const req = new Request('http://localhost/api/projects/project1/surveys', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assignments).toHaveLength(0);
  });

  it('should handle fallback when SurveyCriterion table does not exist', async () => {
    const mockError = {
      code: 'P2021',
      message: 'Table "SurveyCriterion" does not exist',
    };

    const mockAssignments = [
      {
        id: 'assignment1',
        projectId: 'project1',
        createdAt: new Date('2024-01-01'),
        survey: {
          id: 'survey1',
          title: 'Survey 1',
          description: 'Description 1',
          creatorId: 'instructor1',
        },
      },
    ];

    (prisma.surveyAssignment.findMany as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockAssignments);

    const req = new Request('http://localhost/api/projects/project1/surveys', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.assignments).toHaveLength(1);
    expect(data.assignments[0].survey.criteria).toBeUndefined();
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyAssignment.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/projects/project1/surveys', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

