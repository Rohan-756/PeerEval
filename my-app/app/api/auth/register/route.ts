import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, name } = await req.json();

    // Validate required fields
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role value
    if (role !== 'student' && role !== 'instructor') {
      return NextResponse.json(
        { error: 'Role must be either "student" or "instructor"' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists',
        userId: existingUser.id,
        role: existingUser.role,
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, role, name },
    });

    return NextResponse.json({
      message: 'User registered',
      userId: newUser.id,
      role: newUser.role,
      name: newUser.name,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
