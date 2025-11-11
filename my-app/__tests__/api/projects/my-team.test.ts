import { GET } from '@/app/api/projects/[projectId]/my-team/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/projects/[projectId]/my-team', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if studentId is missing', async () => {
    const req = new Request('http://localhost/api/projects/project1/my-team', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('studentId is required');
  });

  it('should return empty members array if student is not in a team', async () => {
    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/projects/project1/my-team?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.members).toHaveLength(0);
  });

  it('should return team members for a student in a team', async () => {
    const mockStudentTeam = {
      teamId: 'team1',
    };

    const mockTeamMembers = [
      {
        id: 'member1',
        teamId: 'team1',
        studentId: 'student1',
        student: {
          id: 'student1',
          name: 'Student 1',
          email: 'student1@example.com',
        },
      },
      {
        id: 'member2',
        teamId: 'team1',
        studentId: 'student2',
        student: {
          id: 'student2',
          name: 'Student 2',
          email: 'student2@example.com',
        },
      },
      {
        id: 'member3',
        teamId: 'team1',
        studentId: 'student3',
        student: {
          id: 'student3',
          name: 'Student 3',
          email: 'student3@example.com',
        },
      },
    ];

    (prisma.teamMember.findFirst as jest.Mock).mockResolvedValue(mockStudentTeam);
    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue(mockTeamMembers);

    const req = new Request('http://localhost/api/projects/project1/my-team?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.members).toHaveLength(3);
    expect(data.members[0]).toMatchObject({
      id: 'member1',
      teamId: 'team1',
      studentId: 'student1',
      student: {
        id: 'student1',
        name: 'Student 1',
        email: 'student1@example.com',
      },
    });
    expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
      where: {
        studentId: 'student1',
        team: {
          projectId: 'project1',
        },
      },
      select: {
        teamId: true,
      },
    });
    expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
      where: {
        teamId: 'team1',
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  });

  it('should return 500 on internal server error', async () => {
    (prisma.teamMember.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/projects/project1/my-team?studentId=student1', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

