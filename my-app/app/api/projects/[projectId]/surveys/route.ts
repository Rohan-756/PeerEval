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

    const assignments = await prisma.surveyAssignment.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        survey: {
          select: { id: true, title: true, description: true, creatorId: true }
        },
      },
    });

    return NextResponse.json({ success: true, assignments });
  } catch (err) {
    console.error("Error listing project surveys:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


