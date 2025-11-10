import { POST } from '@/app/api/invites/send/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    invite: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('POST /api/invites/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks before each test to ensure clean state
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({ projectId: 'project1' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 403 if user is not an instructor', async () => {
    const mockStudent = {
      id: 'student1',
      role: 'student',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'student@example.com',
        instructorId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if instructor is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'student@example.com',
        instructorId: 'nonexistent',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if project not found', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockInstructor); // Instructor lookup
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'nonexistent',
        studentEmail: 'student@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Project not found');
  });

  it('should return 403 if project does not belong to instructor', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProject = {
      id: 'project1',
      instructorId: 'different-instructor',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockInstructor); // Instructor lookup
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'student@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('This project does not belong to you');
  });

  it('should return 404 if student not found', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockInstructor) // Instructor lookup
      .mockResolvedValueOnce(null); // Student lookup
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'nonexistent@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Student not found');
  });

  it('should return 404 if user is not a student', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
    };

    const mockInstructorUser = {
      id: 'instructor2',
      role: 'instructor',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockInstructor) // Instructor lookup
      .mockResolvedValueOnce(mockInstructorUser); // User lookup (not a student)
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'instructor2@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Student not found');
  });

  it('should return 400 if invite already sent', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
    };

    const mockStudent = {
      id: 'student1',
      role: 'student',
    };

    const mockExistingInvite = {
      id: 'invite1',
      projectId: 'project1',
      studentId: 'student1',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockInstructor) // Instructor lookup
      .mockResolvedValueOnce(mockStudent); // Student lookup
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.invite.findFirst as jest.Mock).mockResolvedValue(mockExistingInvite);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'student@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invite already sent to this student');
  });

  it('should create invite successfully', async () => {
    const mockInstructor = {
      id: 'instructor1',
      role: 'instructor',
    };

    const mockProject = {
      id: 'project1',
      instructorId: 'instructor1',
    };

    const mockStudent = {
      id: 'student1',
      role: 'student',
    };

    const mockInvite = {
      id: 'invite1',
      projectId: 'project1',
      studentId: 'student1',
      status: 'pending',
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockInstructor) // Instructor lookup
      .mockResolvedValueOnce(mockStudent); // Student lookup
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
    (prisma.invite.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.invite.create as jest.Mock).mockResolvedValue(mockInvite);

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'student@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.invite).toEqual(mockInvite);
    expect(prisma.invite.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project1',
        studentId: 'student1',
        status: 'pending',
      },
    });
  });

  it('should return 500 on internal server error', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/invites/send', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project1',
        studentEmail: 'student@example.com',
        instructorId: 'instructor1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

