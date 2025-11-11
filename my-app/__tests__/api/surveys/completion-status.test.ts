import { GET } from '@/app/api/surveys/[assignmentId]/completion-status/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyAssignment: {
      findFirst: jest.fn(),
    },
    teamMember: {
      findFirst: jest.fn(),
    },
    surveyResponse: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/surveys/[assignmentId]/completion-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if assignmentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/completion-status?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and studentId are required');
  });

  it('should return 400 if studentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/assignment1/completion-status', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('assignmentId and studentId are required');
  });

  it('should return 404 if assignment not found', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/assignment1/completion-status?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Assignment not found');
  });

  it('should return 400 if student is not part of a team', async () => {
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      project: { id: 'project1' },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/assignment1/completion-status?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Student not part of a team');
  });

  it('should return completion status for all team members', async () => {
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      project: { id: 'project1' },
    };

    const mockStudentTeam = {
      teamId: 'team1',
      team: {
        id: 'team1',
        members: [
          { studentId: 'student1' },
          { studentId: 'student2' },
          { studentId: 'student3' },
        ],
      },
    };

    // Mock responses: student1 and student2 have submitted for all teammates, student3 hasn't
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(mockStudentTeam);
    
    // Mock findMany to return different results based on respondentId
    (prisma.surveyResponse.findMany as jest.Mock)
      .mockResolvedValueOnce([
        { targetStudentId: 'student2' },
        { targetStudentId: 'student3' },
      ]) // student1 has submitted for 2 teammates
      .mockResolvedValueOnce([
        { targetStudentId: 'student1' },
        { targetStudentId: 'student3' },
      ]) // student2 has submitted for 2 teammates
      .mockResolvedValueOnce([]); // student3 has not submitted

    const req = new Request('http://localhost/api/surveys/assignment1/completion-status?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.allSubmitted).toBe(false); // student3 hasn't submitted
    expect(data.submittedCount).toBe(2);
    expect(data.totalCount).toBe(3);
    expect(data.teamMemberIds).toEqual(['student1', 'student2', 'student3']);
  });

  it('should return allSubmitted: true when all team members have submitted', async () => {
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      project: { id: 'project1' },
    };

    const mockStudentTeam = {
      teamId: 'team1',
      team: {
        id: 'team1',
        members: [
          { studentId: 'student1' },
          { studentId: 'student2' },
        ],
      },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(mockStudentTeam);
    
    // Both students have submitted for their teammate
    (prisma.surveyResponse.findMany as jest.Mock)
      .mockResolvedValueOnce([{ targetStudentId: 'student2' }]) // student1 submitted
      .mockResolvedValueOnce([{ targetStudentId: 'student1' }]); // student2 submitted

    const req = new Request('http://localhost/api/surveys/assignment1/completion-status?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.allSubmitted).toBe(true);
    expect(data.submittedCount).toBe(2);
    expect(data.totalCount).toBe(2);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/completion-status?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

