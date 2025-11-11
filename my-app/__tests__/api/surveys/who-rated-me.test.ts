import { GET } from '@/app/api/surveys/[assignmentId]/who-rated-me/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyResponse: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/surveys/[assignmentId]/who-rated-me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if assignmentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/who-rated-me', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and targetStudentId are required');
  });

  it('should return 400 if targetStudentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/assignment1/who-rated-me', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and targetStudentId are required');
  });

  it('should return list of respondents who rated the target student', async () => {
    const mockResponses = [
      {
        respondentId: 'student1',
        respondent: {
          id: 'student1',
          name: 'Student 1',
          email: 'student1@example.com',
        },
      },
      {
        respondentId: 'student2',
        respondent: {
          id: 'student2',
          name: 'Student 2',
          email: 'student2@example.com',
        },
      },
    ];

    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(mockResponses);

    const req = new Request('http://localhost/api/surveys/assignment1/who-rated-me?targetStudentId=target1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.respondents).toHaveLength(2);
    expect(data.respondents[0]).toEqual({
      id: 'student1',
      name: 'Student 1',
      email: 'student1@example.com',
    });
    expect(prisma.surveyResponse.findMany).toHaveBeenCalledWith({
      where: {
        assignmentId: 'assignment1',
        targetStudentId: 'target1',
      },
      select: {
        respondentId: true,
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      distinct: ['respondentId'],
    });
  });

  it('should return empty list if no one rated the target student', async () => {
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue([]);

    const req = new Request('http://localhost/api/surveys/assignment1/who-rated-me?targetStudentId=target1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.respondents).toHaveLength(0);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyResponse.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/who-rated-me?targetStudentId=target1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

