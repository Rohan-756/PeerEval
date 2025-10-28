import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { projectId, studentIds } = await req.json();

    if (!projectId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ✅ 1. Check if any student is already part of a team for this project
    const existingMembers = await prisma.teamMember.findMany({
      where: {
        studentId: { in: studentIds },
        team: { projectId }, // ensure we only check within this project
      },
      include: { student: { select: { email: true } } },
    });

    if (existingMembers.length > 0) {
      const alreadyInTeams = existingMembers.map((m) => m.student.email).join(", ");
      return NextResponse.json(
        { error: `Some students are already in a team: ${alreadyInTeams}` },
        { status: 400 }
      );
    }

    // ✅ 2. Determine next team number (incremental naming)
    const existingTeams = await prisma.team.count({ where: { projectId } });
    const nextTeamNumber = existingTeams + 1;

    // ✅ 3. Create a new team with sequential name
    const team = await prisma.team.create({
      data: {
        name: `Team ${nextTeamNumber}`,
        projectId,
        members: {
          create: studentIds.map((id: string) => ({
            studentId: id,
          })),
        },
      },
      include: {
        members: {
          include: { student: { select: { name: true, email: true } } },
        },
      },
    });

    return NextResponse.json(team);
  } catch (err) {
    console.error("Error creating team:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
