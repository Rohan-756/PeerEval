import { POST } from '@/app/api/auth/update-password/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('POST /api/auth/update-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if token is missing', async () => {
    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing token or password');
  });

  it('should return 400 if newPassword is missing', async () => {
    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'reset-token-123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing token or password');
  });

  it('should return 400 if token is invalid', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid token');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { passwordResetToken: 'invalid-token' } });
  });

  it('should return 400 if token is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordResetToken: 'expired-token',
      tokenExpiry: expiredDate,
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'expired-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token expired');
  });

  it('should return 400 if tokenExpiry is null', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      tokenExpiry: null,
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token expired');
  });

  it('should successfully update password with valid token', async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      tokenExpiry: futureDate,
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      password: 'hashedNewPassword',
      passwordResetToken: null,
      tokenExpiry: null,
    });

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password successfully updated');
    
    // Verify password was hashed
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    
    // Verify user was updated with new password and cleared token fields
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        password: 'hashedNewPassword',
        passwordResetToken: null,
        tokenExpiry: null,
      },
    });
  });

  it('should return 500 if database error occurs when finding user', async () => {
    (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database connection error'));

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'some-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error when looking up token');
  });

  it('should return 500 if password hashing fails', async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000);
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      tokenExpiry: futureDate,
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to hash password');
  });

  it('should return 500 if database update fails', async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000);
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      tokenExpiry: futureDate,
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
    (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update password in database');
  });

  it('should return 500 on unexpected errors', async () => {
    (prisma.user.findFirst as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const req = new Request('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'some-token', newPassword: 'newpassword123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

