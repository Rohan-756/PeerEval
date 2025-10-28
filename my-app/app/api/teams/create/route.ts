import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { projectId, studentIds } = await req.json();

    if (!projectId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Create a new team
    const team = await prisma.team.create({
      data: {
        name: `Team ${Math.floor(Math.random() * 1000)}`,
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
