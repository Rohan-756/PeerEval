import { POST } from '@/app/api/auth/register/route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('POST /api/auth/register', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
  });

  it('should return 400 if email is missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123', role: 'student', name: 'Test User' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, password, and role are required');
  });

  it('should return 400 if password is missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', role: 'student', name: 'Test User' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, password, and role are required');
  });

  it('should return 400 if role is missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, password, and role are required');
  });

  it('should return 400 if name is missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', role: 'student' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email, name, password, and role are required');
  });

  it('should return 400 if role is invalid', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'password123', 
        role: 'admin', 
        name: 'Test User' 
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Role must be either "student" or "instructor"');
  });

  it('should return existing user info if user already exists', async () => {
    const existingUser = {
      id: '1',
      email: 'test@example.com',
      role: 'student',
    };

    mockPrisma.user.findUnique.mockResolvedValue(existingUser);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'password123', 
        role: 'student', 
        name: 'Test User' 
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('User already exists');
    expect(data.userId).toBe('1');
    expect(data.role).toBe('student');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('should create a new student user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const newUser = {
      id: '2',
      email: 'newstudent@example.com',
      password: 'hashedPassword',
      role: 'student',
      name: 'New Student',
    };

    mockPrisma.user.create.mockResolvedValue(newUser);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'newstudent@example.com', 
        password: 'password123', 
        role: 'student', 
        name: 'New Student' 
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('User registered');
    expect(data.userId).toBe('2');
    expect(data.role).toBe('student');
    expect(data.name).toBe('New Student');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'newstudent@example.com',
        password: 'hashedPassword',
        role: 'student',
        name: 'New Student',
      },
    });
  });

  it('should create a new instructor user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const newUser = {
      id: '3',
      email: 'instructor@example.com',
      password: 'hashedPassword',
      role: 'instructor',
      name: 'New Instructor',
    };

    mockPrisma.user.create.mockResolvedValue(newUser);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'instructor@example.com', 
        password: 'password123', 
        role: 'instructor', 
        name: 'New Instructor' 
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('User registered');
    expect(data.userId).toBe('3');
    expect(data.role).toBe('instructor');
    expect(data.name).toBe('New Instructor');
  });

  it('should return 500 on internal server error', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'password123', 
        role: 'student', 
        name: 'Test User' 
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

