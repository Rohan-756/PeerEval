import { POST } from '@/app/api/surveys/assign/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findFirst: jest.fn(),
    },
    survey: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    surveyCriterion: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    surveyAssignment: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/surveys/assign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/surveys/assign', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Survey' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should return 403 if project not found or not owned by instructor', async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/assign', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        creatorId: 'instructor1',
        title: 'Test Survey',
        deadline: new Date().toISOString(),
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Project not found or not owned by instructor');
  });

  it('should create survey and assignment successfully', async () => {
    const mockProject = { id: 'project1' };
    const mockSurvey = {
      id: 'survey1',
      title: 'Test Survey',
      description: 'Test Description',
      creatorId: 'instructor1',
    };
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      surveyId: 'survey1',
      deadline: new Date(),
      survey: mockSurvey,
    };

    (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);
    (prisma.survey.create as jest.Mock).mockResolvedValue(mockSurvey);
    (prisma.surveyCriterion.createMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.surveyCriterion.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.surveyAssignment.create as jest.Mock).mockResolvedValue(mockAssignment);

    const req = new Request('http://localhost/api/surveys/assign', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        creatorId: 'instructor1',
        title: 'Test Survey',
        description: 'Test Description',
        deadline: new Date().toISOString(),
        criteria: [],
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.survey).toEqual(mockSurvey);
    expect(data.assignment).toBeDefined();
  });

  it('should create survey with criteria', async () => {
    const mockProject = { id: 'project1' };
    const mockSurvey = {
      id: 'survey1',
      title: 'Test Survey',
      creatorId: 'instructor1',
    };
    const mockCriteria = [
      { id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 },
    ];
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      surveyId: 'survey1',
      deadline: new Date(),
      survey: mockSurvey,
    };

    (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);
    (prisma.survey.create as jest.Mock).mockResolvedValue(mockSurvey);
    (prisma.surveyCriterion.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.surveyCriterion.findMany as jest.Mock).mockResolvedValue(mockCriteria);
    (prisma.surveyAssignment.create as jest.Mock).mockResolvedValue(mockAssignment);

    const req = new Request('http://localhost/api/surveys/assign', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        creatorId: 'instructor1',
        title: 'Test Survey',
        deadline: new Date().toISOString(),
        criteria: [
          { label: 'Communication', minRating: 1, maxRating: 5 },
        ],
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(prisma.surveyCriterion.createMany).toHaveBeenCalled();
  });

  it('should return 500 on internal server error', async () => {
    (prisma.project.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assign', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        creatorId: 'instructor1',
        title: 'Test Survey',
        deadline: new Date().toISOString(),
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

