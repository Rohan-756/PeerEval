import { GET } from '@/app/api/surveys/[assignmentId]/results/route';
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

describe('GET /api/surveys/[assignmentId]/results', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if assignmentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/results', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId required');
  });

  it('should return 404 if assignment not found', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/nonexistent/results', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'nonexistent' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Assignment not found');
  });

  it('should aggregate scores correctly', async () => {
    const mockAssignment = {
      id: 'assignment1',
      deadline: new Date(),
      status: 'active',
      survey: {
        id: 'survey1',
        title: 'Test Survey',
        description: 'Test Description',
        criteria: [
          { id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 },
          { id: 'criterion2', label: 'Teamwork', minRating: 1, maxRating: 5, order: 2 },
        ],
      },
      project: {
        id: 'project1',
        teams: [
          {
            id: 'team1',
            name: 'Team 1',
            members: [
              {
                student: { id: 'student1', name: 'Student 1', email: 'student1@example.com' },
              },
              {
                student: { id: 'student2', name: 'Student 2', email: 'student2@example.com' },
              },
            ],
          },
        ],
      },
    };

    const mockResponses = [
      {
        assignmentId: 'assignment1',
        respondentId: 'student1',
        targetStudentId: 'student2',
        answers: {
          criterion1: { text: 'Good', rating: 5 },
          criterion2: { text: 'Excellent', rating: 4 },
        },
        respondent: { id: 'student1', name: 'Student 1', email: 'student1@example.com' },
        targetStudent: { id: 'student2', name: 'Student 2', email: 'student2@example.com' },
      },
      {
        assignmentId: 'assignment1',
        respondentId: 'student2',
        targetStudentId: 'student1',
        answers: {
          criterion1: { text: 'Very good', rating: 4 },
          criterion2: { text: 'Good', rating: 5 },
        },
        respondent: { id: 'student2', name: 'Student 2', email: 'student2@example.com' },
        targetStudent: { id: 'student1', name: 'Student 1', email: 'student1@example.com' },
      },
    ];

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(mockResponses);

    const req = new Request('http://localhost/api/surveys/assignment1/results', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.aggregatedResults).toBeDefined();
    expect(data.aggregatedResults.length).toBe(2); // Two criteria

    // Check average ratings are calculated correctly
    const criterion1Result = data.aggregatedResults.find((r: any) => r.criterionId === 'criterion1');
    expect(criterion1Result).toBeDefined();
    expect(criterion1Result.averageRating).toBe(4.5); // (5 + 4) / 2 = 4.5
    expect(criterion1Result.totalResponses).toBe(2);

    const criterion2Result = data.aggregatedResults.find((r: any) => r.criterionId === 'criterion2');
    expect(criterion2Result).toBeDefined();
    expect(criterion2Result.averageRating).toBe(4.5); // (4 + 5) / 2
  });

  it('should calculate completion status correctly', async () => {
    const mockAssignment = {
      id: 'assignment1',
      deadline: new Date(),
      status: 'active',
      survey: {
        id: 'survey1',
        title: 'Test Survey',
        description: null,
        criteria: [{ id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 }],
      },
      project: {
        id: 'project1',
        teams: [
          {
            id: 'team1',
            name: 'Team 1',
            members: [
              { student: { id: 'student1', name: 'Student 1', email: 'student1@example.com' } },
              { student: { id: 'student2', name: 'Student 2', email: 'student2@example.com' } },
            ],
          },
        ],
      },
    };

    const mockResponses = [
      {
        assignmentId: 'assignment1',
        respondentId: 'student1',
        targetStudentId: 'student2',
        answers: { criterion1: { text: 'Good', rating: 5 } },
        respondent: { id: 'student1', name: 'Student 1', email: 'student1@example.com' },
        targetStudent: { id: 'student2', name: 'Student 2', email: 'student2@example.com' },
      },
    ];

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(mockResponses);

    const req = new Request('http://localhost/api/surveys/assignment1/results', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.completionStatus).toBeDefined();
    expect(data.completionStatus.length).toBe(2); // Two students

    // Student 1 should have 1 completed submission (out of 1 expected)
    const student1Status = data.completionStatus.find((s: any) => s.studentId === 'student1');
    expect(student1Status.completedSubmissions).toBe(1);
    expect(student1Status.expectedSubmissions).toBe(1);
    expect(student1Status.isComplete).toBe(true);

    // Student 2 should have 0 completed submissions
    const student2Status = data.completionStatus.find((s: any) => s.studentId === 'student2');
    expect(student2Status.completedSubmissions).toBe(0);
    expect(student2Status.isComplete).toBe(false);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/results', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

