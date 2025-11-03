import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const respondentId = searchParams.get("respondentId");
    const { assignmentId } = await context.params;

    if (!assignmentId || !respondentId) {
      return NextResponse.json({ error: "assignmentId and respondentId are required" }, { status: 400 });
    }

    const count = await prisma.surveyResponse.count({ where: { assignmentId, respondentId } });
    return NextResponse.json({ success: true, submitted: count > 0 });
  } catch (err) {
    console.error("Error checking submission status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


