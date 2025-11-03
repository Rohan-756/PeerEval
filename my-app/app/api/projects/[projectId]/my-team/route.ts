import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const { projectId } = await context.params;

    if (!studentId || !projectId) {
      return NextResponse.json({ error: "studentId and projectId are required" }, { status: 400 });
    }

    // Find the team for this student in this project
    const team = await prisma.team.findFirst({
      where: {
        projectId,
        members: { some: { studentId } },
      },
      include: {
        members: { include: { student: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!team) {
      return NextResponse.json({ team: null, members: [] });
    }

    const members = team.members.map((m) => m.student);
    return NextResponse.json({ teamId: team.id, members });
  } catch (err) {
    console.error("Error fetching team members:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


