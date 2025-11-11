import { GET } from '@/app/api/surveys/[assignmentId]/my-feedback/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyAssignment: {
      findFirst: jest.fn(),
    },
    surveyResponse: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/surveys/[assignmentId]/my-feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if assignmentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/my-feedback?targetStudentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and targetStudentId are required');
  });

  it('should return 400 if targetStudentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/assignment1/my-feedback', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and targetStudentId are required');
  });

  it('should return 404 if assignment not found', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/assignment1/my-feedback?targetStudentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Assignment not found');
  });

  it('should return anonymized feedback grouped by criterion', async () => {
    const mockAssignment = {
      id: 'assignment1',
      survey: {
        id: 'survey1',
        criteria: [
          { id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 },
          { id: 'criterion2', label: 'Teamwork', minRating: 1, maxRating: 5, order: 2 },
        ],
      },
    };

    const mockResponses = [
      {
        id: 'response1',
        assignmentId: 'assignment1',
        targetStudentId: 'student1',
        respondent: {
          id: 'student2',
          name: 'Student 2',
          email: 'student2@example.com',
        },
        answers: {
          criterion1: { text: 'Good communication', rating: 4 },
          criterion2: { text: 'Excellent teamwork', rating: 5 },
        },
        submittedAt: new Date('2024-01-01'),
      },
      {
        id: 'response2',
        assignmentId: 'assignment1',
        targetStudentId: 'student1',
        respondent: {
          id: 'student3',
          name: 'Student 3',
          email: 'student3@example.com',
        },
        answers: {
          criterion1: { text: 'Very helpful', rating: 5 },
          criterion2: { text: 'Good collaboration', rating: 4 },
        },
        submittedAt: new Date('2024-01-02'),
      },
    ];

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(mockResponses);

    const req = new Request('http://localhost/api/surveys/assignment1/my-feedback?targetStudentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.feedbackByCriterion).toBeDefined();
    expect(data.criteria).toHaveLength(2);
    expect(data.totalResponses).toBe(2);
    
    // Check that feedback is anonymized (should have anonymousId instead of respondent info)
    expect(data.feedbackByCriterion.criterion1).toBeDefined();
    expect(data.feedbackByCriterion.criterion1[0]).toHaveProperty('anonymousId');
    expect(data.feedbackByCriterion.criterion1[0]).not.toHaveProperty('respondent');
  });

  it('should return empty feedback if no responses exist', async () => {
    const mockAssignment = {
      id: 'assignment1',
      survey: {
        id: 'survey1',
        criteria: [
          { id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 },
        ],
      },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue([]);

    const req = new Request('http://localhost/api/surveys/assignment1/my-feedback?targetStudentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.feedbackByCriterion.criterion1).toHaveLength(0);
    expect(data.totalResponses).toBe(0);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/my-feedback?targetStudentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

