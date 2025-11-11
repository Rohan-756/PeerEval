import { GET } from '@/app/api/surveys/[assignmentId]/responses/route';
import { prisma } from '@/lib/prisma';

/**
 * Test suite for GET /api/surveys/[assignmentId]/responses route
 * Tests retrieval of all survey responses for a given assignment
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyResponse: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/surveys/[assignmentId]/responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when assignmentId parameter is missing', async () => {
    const req = new Request('http://localhost/api/surveys/responses', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId required');
  });

  it('should return all survey responses for an assignment ordered by submission date', async () => {
    const mockResponses = [
      {
        id: 'response1',
        assignmentId: 'assignment1',
        respondentId: 'student1',
        targetStudentId: 'student2',
        answers: {
          criterion1: { text: 'Good communication', rating: 4 },
          criterion2: { text: 'Excellent teamwork', rating: 5 },
        },
        submittedAt: new Date('2024-01-01'),
        respondent: {
          id: 'student1',
          name: 'Student 1',
          email: 'student1@example.com',
        },
        targetStudent: {
          id: 'student2',
          name: 'Student 2',
          email: 'student2@example.com',
        },
      },
      {
        id: 'response2',
        assignmentId: 'assignment1',
        respondentId: 'student2',
        targetStudentId: 'student1',
        answers: {
          criterion1: { text: 'Very helpful', rating: 5 },
          criterion2: { text: 'Good collaboration', rating: 4 },
        },
        submittedAt: new Date('2024-01-02'),
        respondent: {
          id: 'student2',
          name: 'Student 2',
          email: 'student2@example.com',
        },
        targetStudent: {
          id: 'student1',
          name: 'Student 1',
          email: 'student1@example.com',
        },
      },
    ];

    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(mockResponses);

    const req = new Request('http://localhost/api/surveys/assignment1/responses', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.responses).toHaveLength(2);
    expect(data.responses[0]).toMatchObject({
      id: 'response1',
      assignmentId: 'assignment1',
      respondentId: 'student1',
      targetStudentId: 'student2',
    });
    expect(prisma.surveyResponse.findMany).toHaveBeenCalledWith({
      where: { assignmentId: 'assignment1' },
      orderBy: { submittedAt: 'desc' },
      include: {
        respondent: { select: { id: true, name: true, email: true } },
        targetStudent: { select: { id: true, name: true, email: true } },
      },
    });
  });

  it('should return empty array if no responses exist', async () => {
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue([]);

    const req = new Request('http://localhost/api/surveys/assignment1/responses', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.responses).toHaveLength(0);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyResponse.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/responses', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

