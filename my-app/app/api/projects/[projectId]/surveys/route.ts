import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    try {
      const assignmentsWithCriteria = await prisma.surveyAssignment.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              description: true,
              creatorId: true,
              criteria: { select: { id: true, label: true, minRating: true, maxRating: true, order: true }, orderBy: { order: "asc" } },
            },
          },
        },
      });

      return NextResponse.json({ success: true, assignments: assignmentsWithCriteria });
    } catch (err: any) {
      // Fallback if SurveyCriterion table hasn't been migrated yet
      if (err?.code === 'P2021' || /SurveyCriterion/.test(String(err?.message))) {
        const assignments = await prisma.surveyAssignment.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          include: {
            survey: {
              select: { id: true, title: true, description: true, creatorId: true },
            },
          },
        });
        return NextResponse.json({ success: true, assignments });
      }
      throw err;
    }
  } catch (err) {
    console.error("Error listing project surveys:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


