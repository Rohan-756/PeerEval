import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
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

    // Check if the user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // User already exists, return existing UID and role
      return NextResponse.json({
        message: 'User already exists',
        userId: user.id,
        role: user.role,
      });
    }

    // Hash the password and create new user with role
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role, // Save role permanently
      },
    });

    return NextResponse.json({
      message: 'User registered',
      userId: user.id,
      role: user.role,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
