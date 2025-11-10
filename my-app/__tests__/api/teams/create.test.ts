import { POST } from '@/app/api/teams/create/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: {
      findMany: jest.fn(),
    },
    team: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('POST /api/teams/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if projectId is missing', async () => {
    const req = new Request('http://localhost/api/teams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds: ['student1'] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('should return 400 if studentIds is empty', async () => {
    const req = new Request('http://localhost/api/teams/create', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'project1', studentIds: [] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('should return 400 if student is already in a team', async () => {
    const existingMembers = [
      {
        student: { email: 'student1@example.com' },
      },
    ];

    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue(existingMembers);

    const req = new Request('http://localhost/api/teams/create', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentIds: ['student1'],
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('already in a team');
  });

  it('should create team successfully with sequential naming', async () => {
    const mockTeam = {
      id: 'team1',
      name: 'Team 1',
      projectId: 'project1',
      members: [
        {
          studentId: 'student1',
          student: { name: 'Student 1', email: 'student1@example.com' },
        },
      ],
    };

    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.team.count as jest.Mock).mockResolvedValue(0);
    (prisma.team.create as jest.Mock).mockResolvedValue(mockTeam);

    const req = new Request('http://localhost/api/teams/create', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentIds: ['student1'],
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockTeam);
    expect(prisma.team.create).toHaveBeenCalledWith({
      data: {
        name: 'Team 1',
        projectId: 'project1',
        members: {
          create: [{ studentId: 'student1' }],
        },
      },
      include: expect.any(Object),
    });
  });

  it('should create team with next sequential number', async () => {
    const mockTeam = {
      id: 'team2',
      name: 'Team 2',
      projectId: 'project1',
      members: [],
    };

    (prisma.teamMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.team.count as jest.Mock).mockResolvedValue(1); // Already 1 team exists
    (prisma.team.create as jest.Mock).mockResolvedValue(mockTeam);

    const req = new Request('http://localhost/api/teams/create', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentIds: ['student2'],
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Team 2');
    expect(prisma.team.create).toHaveBeenCalledWith({
      data: {
        name: 'Team 2',
        projectId: 'project1',
        members: {
          create: [{ studentId: 'student2' }],
        },
      },
      include: expect.any(Object),
    });
  });

  it('should return 500 on internal server error', async () => {
    (prisma.teamMember.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/teams/create', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentIds: ['student1'],
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

