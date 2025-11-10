import { POST } from '@/app/api/auth/reset/route';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

describe('POST /api/auth/reset', () => {
  const mockSendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
  });

  it('should return 400 if email is missing', async () => {
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing email');
  });

  it('should return 404 if user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No account found with that email');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
  });

  it('should generate reset token and send email successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockToken = Buffer.from('test-token-hex', 'hex');
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockToken);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Password reset email sent. Check your inbox.');
    
    // Verify token generation
    expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    
    // Verify database update
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      data: {
        passwordResetToken: expect.any(String),
        tokenExpiry: expect.any(Date),
      },
    });

    // Verify email was sent
    expect(mockSendMail).toHaveBeenCalledWith({
      from: expect.stringContaining('PeerEval'),
      to: 'test@example.com',
      subject: 'Password Reset Request',
      html: expect.stringContaining('reset-password'),
    });
  });

  it('should set token expiry to 1 hour from now', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockToken = Buffer.from('test-token', 'hex');
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockToken);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const beforeTime = Date.now();
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    await POST(req);

    const afterTime = Date.now();
    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
    const expiryTime = updateCall.data.tokenExpiry.getTime();
    
    // Check that expiry is approximately 1 hour from now (within 1 second tolerance)
    const expectedExpiry = beforeTime + 3600 * 1000;
    expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry);
    expect(expiryTime).toBeLessThanOrEqual(afterTime + 3600 * 1000);
  });

  it('should include reset URL in email', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockToken = Buffer.from('abc123', 'hex');
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockToken);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    await POST(req);

    const emailCall = mockSendMail.mock.calls[0][0];
    expect(emailCall.html).toContain('reset-password');
    expect(emailCall.html).toContain('token=');
  });

  it('should return 500 on internal server error', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should return 500 if email sending fails', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockToken = Buffer.from('test-token', 'hex');
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockToken);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    mockSendMail.mockRejectedValue(new Error('Email send failed'));

    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

