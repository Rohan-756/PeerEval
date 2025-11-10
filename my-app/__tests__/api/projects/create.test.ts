import { POST } from '@/app/api/projects/create/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/projects/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Project' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing fields');
  });

  it('should return 403 if user is not an instructor', async () => {
    const mockStudent = {
      id: 'student1',
      role: 'student',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

    const req = new Request('http://localhost/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Project',
        description: 'Test Description',
        instructorId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only instructors can create projects');
  });

  it('should return 403 if instructor user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Project',
        description: 'Test Description',
        instructorId: 'nonexistent',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only instructors can create projects');
  });

  it('should create project successfully for instructor', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProject = {
      id: 'project1',
      title: 'Test Project',
      description: 'Test Description',
      instructorId: 'instructor1',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockInstructor);
    (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Project',
        description: 'Test Description',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.project).toEqual(mockProject);
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        title: 'Test Project',
        description: 'Test Description',
        instructorId: 'instructor1',
      },
    });
  });

  it('should return 500 on internal server error', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/projects/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Project',
        description: 'Test Description',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

