import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await context.params;
    if (!assignmentId) return NextResponse.json({ error: "assignmentId required" }, { status: 400 });

    const responses = await prisma.surveyResponse.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: "desc" },
      include: {
        respondent: { select: { id: true, name: true, email: true } },
        targetStudent: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, responses });
  } catch (err) {
    console.error("Error fetching survey responses:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


