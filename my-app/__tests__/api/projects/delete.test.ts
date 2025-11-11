import { DELETE } from '@/app/api/projects/delete/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    surveyResponse: {
      deleteMany: jest.fn(),
    },
    surveyAssignment: {
      deleteMany: jest.fn(),
    },
    teamMember: {
      deleteMany: jest.fn(),
    },
    team: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('DELETE /api/projects/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if project not found', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/projects/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        projectId: 'nonexistent',
        instructorId: 'instructor1',
      }),
    });

    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Project not found');
  });

  it('should return 403 if user is not the project instructor', async () => {
    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
      teams: [],
      surveyAssignments: [],
    };

    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/projects/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        projectId: 'project1',
        instructorId: 'different-instructor',
      }),
    });

    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized');
  });

  it('should delete project successfully with cascading deletes', async () => {
    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
      teams: [
        { id: 'team1' },
        { id: 'team2' },
      ],
      surveyAssignments: [
        { id: 'assignment1' },
        { id: 'assignment2' },
      ],
    };

    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.surveyResponse.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
    (prisma.surveyAssignment.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.teamMember.deleteMany as jest.Mock).mockResolvedValue({ count: 6 });
    (prisma.team.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.project.delete as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/projects/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        projectId: 'project1',
        instructorId: 'instructor1',
      }),
    });

    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.surveyResponse.deleteMany).toHaveBeenCalledWith({
      where: {
        assignmentId: {
          in: ['assignment1', 'assignment2'],
        },
      },
    });
    expect(prisma.surveyAssignment.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'project1' },
    });
    expect(prisma.teamMember.deleteMany).toHaveBeenCalledWith({
      where: {
        teamId: {
          in: ['team1', 'team2'],
        },
      },
    });
    expect(prisma.team.deleteMany).toHaveBeenCalledWith({
      where: { projectId: 'project1' },
    });
  });

  it('should handle project with no teams or assignments', async () => {
    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
      teams: [],
      surveyAssignments: [],
    };

    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.surveyAssignment.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.team.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.project.delete as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/projects/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        projectId: 'project1',
        instructorId: 'instructor1',
      }),
    });

    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.surveyResponse.deleteMany).not.toHaveBeenCalled();
    expect(prisma.teamMember.deleteMany).not.toHaveBeenCalled();
  });

  it('should return 500 on internal server error', async () => {
    (prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/projects/delete', {
      method: 'DELETE',
      body: JSON.stringify({
        projectId: 'project1',
        instructorId: 'instructor1',
      }),
    });

    const response = await DELETE(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

