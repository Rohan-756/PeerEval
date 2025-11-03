import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, creatorId, title, description, deadline } = body || {};

    if (!projectId || !creatorId || !title || !deadline) {
      return NextResponse.json(
        { error: "projectId, creatorId, title, and deadline are required" },
        { status: 400 }
      );
    }

    // Verify instructor owns the project
    const project = await prisma.project.findFirst({
      where: { id: projectId, instructorId: creatorId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not owned by instructor" },
        { status: 403 }
      );
    }

    // Create survey and assignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const survey = await tx.survey.create({
        data: {
          title,
          description: description ?? null,
          creatorId,
        },
      });

      const assignment = await tx.surveyAssignment.create({
        data: {
          projectId,
          surveyId: survey.id,
          deadline: new Date(deadline),
        },
        include: {
          survey: true,
        },
      });

      return { survey, assignment };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err) {
    console.error("Error assigning survey:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


