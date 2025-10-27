import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { title, description, instructorId } = await req.json();

    if (!title || !description || !instructorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can create projects' }, { status: 403 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        instructorId,
      },
    });

    return NextResponse.json({ project });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
