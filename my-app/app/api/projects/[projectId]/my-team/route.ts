// my-app/app/api/projects/[projectId]/my-team/route.ts (Correction)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // 1. Find the TeamMember record for the current student in this project
    const studentTeam = await prisma.teamMember.findFirst({
      where: {
        studentId: studentId,
        team: {
          projectId: projectId,
        },
      },
      select: {
        teamId: true,
      },
    });

    if (!studentTeam) {
      // Student is not in a team for this project
      return NextResponse.json({ success: true, members: [] });
    }

    // 2. Fetch all members of that team, including their User details
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: studentTeam.teamId,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, members: teamMembers });
  } catch (err) {
    console.error("Error loading student's team:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}