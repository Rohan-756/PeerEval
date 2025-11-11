import { POST } from '@/app/api/auth/register/route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock PrismaClient
var mockUserFindUnique: jest.Mock;
var mockUserCreate: jest.Mock;

jest.mock('@prisma/client', () => {
  mockUserFindUnique = jest.fn();
  mockUserCreate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: mockUserFindUnique,
        create: mockUserCreate,
      },
    })),
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('POST /api/auth/register - Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hash password and not store plaintext password', async () => {
    const plainPassword = 'password123';
    const hashedPassword = '$2a$10$hashedpasswordstring';

    mockUserFindUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

    const newUser = {
      id: '1',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'student',
      name: 'Test User',
    };

    mockUserCreate.mockResolvedValue(newUser);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: plainPassword,
        role: 'student',
        name: 'Test User',
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify password was hashed
    expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
    
    // Verify hashed password (not plaintext) was stored
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: hashedPassword, // Hashed, not plaintext
        role: 'student',
        name: 'Test User',
      },
    });

    // Verify the stored password is NOT the plaintext password
    const createCall = mockUserCreate.mock.calls[0][0];
    expect(createCall.data.password).not.toBe(plainPassword);
    expect(createCall.data.password).toBe(hashedPassword);
    expect(createCall.data.password.length).toBeGreaterThan(plainPassword.length);
  });

  it('should use bcrypt with salt rounds of 10', async () => {
    const plainPassword = 'password123';
    const hashedPassword = '$2a$10$hashedpasswordstring';

    mockUserFindUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    mockUserCreate.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'student',
      name: 'Test User',
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: plainPassword,
        role: 'student',
        name: 'Test User',
      }),
    });

    await POST(req as any);

    // Verify bcrypt.hash was called with salt rounds of 10
    expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
  });

  it('should ensure password hash is different from input password', async () => {
    const plainPassword = 'password123';
    const hashedPassword = '$2a$10$differenthashedstring';

    mockUserFindUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    mockUserCreate.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'student',
      name: 'Test User',
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: plainPassword,
        role: 'student',
        name: 'Test User',
      }),
    });

    await POST(req as any);

    const createCall = mockUserCreate.mock.calls[0][0];
    
    // Security assertion: stored password must be different from plaintext
    expect(createCall.data.password).not.toBe(plainPassword);
    expect(createCall.data.password).toBe(hashedPassword);
    
    // Bcrypt hashes typically start with $2a$ or $2b$ and are 60 characters
    expect(createCall.data.password).toMatch(/^\$2[ab]\$/);
  });
});

