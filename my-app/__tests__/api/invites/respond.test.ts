import { POST } from '@/app/api/invites/respond/route';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    invite: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('POST /api/invites/respond', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if status is invalid', async () => {
    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'invite1',
        status: 'invalid-status',
        studentId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid status');
  });

  it('should return 400 if status is missing', async () => {
    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'invite1',
        studentId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid status');
  });

  it('should return 404 if invite not found', async () => {
    (prisma.invite.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'nonexistent',
        status: 'accepted',
        studentId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invite not found or unauthorized');
  });

  it('should return 404 if studentId does not match invite', async () => {
    const mockInvite = {
      id: 'invite1',
      studentId: 'student1',
      projectId: 'project1',
      status: 'pending',
    };

    (prisma.invite.findUnique as jest.Mock).mockResolvedValue(mockInvite);

    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'invite1',
        status: 'accepted',
        studentId: 'different-student',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invite not found or unauthorized');
  });

  it('should accept invite successfully', async () => {
    const mockInvite = {
      id: 'invite1',
      studentId: 'student1',
      projectId: 'project1',
      status: 'pending',
    };

    const mockUpdatedInvite = {
      ...mockInvite,
      status: 'accepted',
    };

    (prisma.invite.findUnique as jest.Mock).mockResolvedValue(mockInvite);
    (prisma.invite.update as jest.Mock).mockResolvedValue(mockUpdatedInvite);

    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'invite1',
        status: 'accepted',
        studentId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invite).toEqual(mockUpdatedInvite);
    expect(data.invite.status).toBe('accepted');
    expect(prisma.invite.update).toHaveBeenCalledWith({
      where: { id: 'invite1' },
      data: { status: 'accepted' },
    });
  });

  it('should reject invite successfully', async () => {
    const mockInvite = {
      id: 'invite1',
      studentId: 'student1',
      projectId: 'project1',
      status: 'pending',
    };

    const mockUpdatedInvite = {
      ...mockInvite,
      status: 'rejected',
    };

    (prisma.invite.findUnique as jest.Mock).mockResolvedValue(mockInvite);
    (prisma.invite.update as jest.Mock).mockResolvedValue(mockUpdatedInvite);

    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'invite1',
        status: 'rejected',
        studentId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invite).toEqual(mockUpdatedInvite);
    expect(data.invite.status).toBe('rejected');
    expect(prisma.invite.update).toHaveBeenCalledWith({
      where: { id: 'invite1' },
      data: { status: 'rejected' },
    });
  });

  it('should only accept "accepted" or "rejected" status values', async () => {
    const invalidStatuses = ['pending', 'cancelled', 'approved', 'declined', ''];

    for (const status of invalidStatuses) {
      const req = new Request('http://localhost/api/invites/respond', {
        method: 'POST',
        body: JSON.stringify({
          inviteId: 'invite1',
          status: status,
          studentId: 'student1',
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status');
    }
  });

  it('should return 500 on internal server error', async () => {
    (prisma.invite.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/invites/respond', {
      method: 'POST',
      body: JSON.stringify({
        inviteId: 'invite1',
        status: 'accepted',
        studentId: 'student1',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

