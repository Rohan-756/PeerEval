import { GET } from '@/app/api/projects/[projectId]/unassigned-students/route';
import { prisma } from '@/lib/prisma';

/**
 * Test suite for GET /api/projects/[projectId]/unassigned-students route
 * Tests retrieval of students who have accepted invites but are not yet assigned to teams
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/projects/[projectId]/unassigned-students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when projectId parameter is missing', async () => {
    const req = new Request('http://localhost/api/projects/unassigned-students', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: '' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Project ID is required');
  });

  it('should return list of unassigned students', async () => {
    const mockUnassignedStudents = [
      {
        id: 'student1',
        name: 'Student 1',
        email: 'student1@example.com',
      },
      {
        id: 'student2',
        name: 'Student 2',
        email: 'student2@example.com',
      },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUnassignedStudents);

    const req = new Request('http://localhost/api/projects/project1/unassigned-students', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      id: 'student1',
      name: 'Student 1',
      email: 'student1@example.com',
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        invites: {
          some: {
            projectId: 'project1',
            status: 'accepted',
          },
        },
        teamMemberships: {
          none: {
            team: {
              projectId: 'project1',
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  });

  it('should return empty array if no unassigned students exist', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = new Request('http://localhost/api/projects/project1/unassigned-students', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it('should return 500 on internal server error', async () => {
    (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/projects/project1/unassigned-students', {
      method: 'GET',
    });

    const context = { params: Promise.resolve({ projectId: 'project1' }) };
    const response = await GET(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server error');
  });
});

