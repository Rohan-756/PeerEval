import { POST } from '@/app/api/surveys/submit/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    surveyAssignment: {
      findFirst: jest.fn(),
    },
    team: {
      findFirst: jest.fn(),
    },
    invite: {
      findFirst: jest.fn(),
    },
    surveyResponse: {
      upsert: jest.fn(),
    },
  },
}));

describe('POST /api/surveys/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'assignment1' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('should return 404 if assignment not found', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'nonexistent',
        respondentId: 'student1',
        projectId: 'project1',
        answers: {},
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Assignment not found');
  });

  it('should return 400 if deadline has passed', async () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: pastDeadline,
      project: { id: 'project1' },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);

    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'assignment1',
        respondentId: 'student1',
        projectId: 'project1',
        answers: { student2: { criterion1: { text: 'Good', rating: 5 } } },
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Deadline has passed');
  });

  it('should return 400 if student is not part of a team', async () => {
    const futureDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: futureDeadline,
      project: { id: 'project1' },
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.team.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.invite.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'assignment1',
        respondentId: 'student1',
        projectId: 'project1',
        answers: { student2: { criterion1: { text: 'Good', rating: 5 } } },
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('not part of a team');
  });

  it('should return 400 if target is not a teammate', async () => {
    const futureDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: futureDeadline,
      project: { id: 'project1' },
    };
    const mockTeam = {
      id: 'team1',
      members: [{ studentId: 'student1' }],
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.team.findFirst as jest.Mock).mockResolvedValue(mockTeam);

    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'assignment1',
        respondentId: 'student1',
        projectId: 'project1',
        answers: { student2: { criterion1: { text: 'Good', rating: 5 } } }, // student2 not in team
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Targets must be teammates');
  });

  it('should submit peer rating successfully', async () => {
    const futureDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const mockAssignment = {
      id: 'assignment1',
      projectId: 'project1',
      deadline: futureDeadline,
      project: { id: 'project1' },
    };
    const mockTeam = {
      id: 'team1',
      members: [
        { studentId: 'student1' },
        { studentId: 'student2' },
      ],
    };

    (prisma.surveyAssignment.findFirst as jest.Mock).mockResolvedValue(mockAssignment);
    (prisma.team.findFirst as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.surveyResponse.upsert as jest.Mock).mockResolvedValue({});

    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'assignment1',
        respondentId: 'student1',
        projectId: 'project1',
        answers: {
          student2: {
            criterion1: { text: 'Good work', rating: 5 },
          },
        },
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.surveyResponse.upsert).toHaveBeenCalled();
  });

  it('should return 500 on internal server error', async () => {
    (prisma.surveyAssignment.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/surveys/submit', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'assignment1',
        respondentId: 'student1',
        projectId: 'project1',
        answers: {},
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

