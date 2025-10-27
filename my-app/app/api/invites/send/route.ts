import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { projectId, studentEmail, instructorId } = await req.json();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (project.instructorId !== instructorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const invite = await prisma.invite.create({
      data: {
        projectId,
        studentId: student.id,
      },
    });

    return NextResponse.json({ invite });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
