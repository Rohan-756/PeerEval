// app/api/projects/list/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let projects;

    if (user.role === 'instructor') {
      projects = await prisma.project.findMany({
        where: { instructorId: userId },
        include: {
          invites: {
            include: {
              student: { select: { id: true, email: true, name: true } },
            },
          },
        },
      });
    } else {
      projects = await prisma.invite.findMany({
        where: { studentId: userId },
        include: {
          project: {
            include: {
              instructor: { select: { id: true, email: true, name: true } },
            },
          },
        },
      });
    }

    // ✅ Always return valid JSON
    return NextResponse.json({
      success: true,
      projects: projects ?? [],
    });
  } catch (err) {
    console.error('❌ Error fetching projects:', err);

    // ✅ Ensure JSON even on errors
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
