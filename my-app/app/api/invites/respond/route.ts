import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { inviteId, status, studentId } = await req.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.studentId !== studentId) {
      return NextResponse.json({ error: 'Invite not found or unauthorized' }, { status: 404 });
    }

    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: { status },
    });

    return NextResponse.json({ invite: updatedInvite });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
