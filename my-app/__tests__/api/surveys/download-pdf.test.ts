import { GET } from '@/app/api/surveys/[assignmentId]/download-pdf/route';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyAssignment: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    teamMember: {
      findFirst: jest.fn(),
    },
    surveyResponse: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    splitTextToSize: jest.fn((text) => [text]),
    text: jest.fn(),
    addPage: jest.fn(),
    getNumberOfPages: jest.fn(() => 1),
    setPage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(100)),
  };
  return {
    jsPDF: jest.fn(() => mockDoc),
  };
});

describe('GET /api/surveys/[assignmentId]/download-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if assignmentId or studentId is missing', async () => {
    const req = new Request('http://localhost/api/surveys/assignment1/download-pdf', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should return 404 if assignment not found', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/nonexistent/download-pdf?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'nonexistent' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Assignment not found');
  });

  it('should return 400 if student is not part of a team', async () => {
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: new Date(),
      survey: {
        id: 'survey1',
        title: 'Test Survey',
        criteria: [],
      },
      project: {
        title: 'Test Project',
        description: 'Test Description',
      },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'student1',
      name: 'Student 1',
      email: 'student1@example.com',
    });
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/assignment1/download-pdf?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Student not part of a team');
  });

  it('should return 400 if survey is not fully completed', async () => {
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: new Date(),
      survey: {
        id: 'survey1',
        title: 'Test Survey',
        criteria: [{ id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 }],
      },
      project: {
        title: 'Test Project',
        description: 'Test Description',
      },
    };

    const mockStudent = {
      id: 'student1',
      name: 'Student 1',
      email: 'student1@example.com',
    };

    const mockTeam = {
      id: 'team1',
      members: [
        { studentId: 'student1' },
        { studentId: 'student2' },
      ],
      team: {
        members: [
          { studentId: 'student1' },
          { studentId: 'student2' },
        ],
      },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue([]); // No submissions

    const req = new Request('http://localhost/api/surveys/assignment1/download-pdf?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('not fully completed');
  });

  it('should generate and return PDF successfully', async () => {
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: new Date(),
      survey: {
        id: 'survey1',
        title: 'Test Survey',
        description: 'Test Description',
        criteria: [
          { id: 'criterion1', label: 'Communication', minRating: 1, maxRating: 5, order: 1 },
        ],
      },
      project: {
        title: 'Test Project',
        description: 'Test Description',
      },
    };

    const mockStudent = {
      id: 'student1',
      name: 'Student 1',
      email: 'student1@example.com',
    };

    const mockTeam = {
      id: 'team1',
      members: [
        { studentId: 'student1' },
        { studentId: 'student2' },
      ],
      team: {
        members: [
          { studentId: 'student1' },
          { studentId: 'student2' },
        ],
      },
    };

    const mockResponses = [
      {
        assignmentId: 'assignment1',
        respondentId: 'student2',
        targetStudentId: 'student1',
        answers: {
          criterion1: { text: 'Good work', rating: 5 },
        },
        respondent: { id: 'student2', name: 'Student 2', email: 'student2@example.com' },
      },
    ];

    // Mock all team members have submitted
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(mockTeam);
    
    // Mock that all submissions are complete
    (prisma.surveyResponse.findMany as jest.Mock)
      .mockResolvedValueOnce([{ targetStudentId: 'student2' }]) // student1 submitted for student2
      .mockResolvedValueOnce([{ targetStudentId: 'student1' }]) // student2 submitted for student1
      .mockResolvedValueOnce(mockResponses); // Get responses for PDF content

    const req = new Request('http://localhost/api/surveys/assignment1/download-pdf?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('feedback-report');
    expect(jsPDF).toHaveBeenCalled();
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/assignment1/download-pdf?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ assignmentId: 'assignment1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

