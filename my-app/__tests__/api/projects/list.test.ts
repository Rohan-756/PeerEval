import { GET } from '@/app/api/projects/list/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
    },
    invite: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/projects/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if userId is missing (unauthorized access)', async () => {
    const req = new Request('http://localhost/api/projects/list', {
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID is required');
  });

  it('should return 404 if user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/projects/list?userId=nonexistent', {
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return projects for instructor', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProjects = [
      {
        id: 'project1',
        title: 'Test Project',
        instructorId: 'instructor1',
      },
    ];

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockInstructor);
    (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

    const req = new Request('http://localhost/api/projects/list?userId=instructor1', {
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.projects).toEqual(mockProjects);
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { instructorId: 'instructor1' },
      include: expect.any(Object),
    });
  });

  it('should return projects for student via invites', async () => {
    const mockStudent = {
      id: 'student1',
      role: 'student',
    };

    const mockInvites = [
      {
        project: {
          id: 'project1',
          title: 'Test Project',
        },
      },
    ];

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    (prisma.invite.findMany as jest.Mock).mockResolvedValue(mockInvites);

    const req = new Request('http://localhost/api/projects/list?userId=student1', {
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.projects).toEqual(mockInvites);
    expect(prisma.invite.findMany).toHaveBeenCalledWith({
      where: { studentId: 'student1' },
      include: expect.any(Object),
    });
  });

  it('should return 500 on internal server error', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/projects/list?userId=user1', {
      method: 'GET',
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });
});

