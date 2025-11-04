// my-app/app/api/surveys/[assignmentId]/my-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  // Corrected context type (assuming standard Next.js App Router usage)
  context: { params: { assignmentId: string } } 
) {
  try {
    const { searchParams } = new URL(req.url);
    const respondentId = searchParams.get("respondentId");
    
    // FIX: Get assignmentId directly from context.params (no await needed)
    const assignmentId = context.params.assignmentId;

    if (!assignmentId || !respondentId) {
      return NextResponse.json({ error: "assignmentId and respondentId are required" }, { status: 400 });
    }

    // This query is now guaranteed to filter by the correct assignmentId
    const count = await prisma.surveyResponse.count({ where: { assignmentId, respondentId } });
    return NextResponse.json({ success: true, submitted: count > 0 });
  } catch (err) {
    console.error("Error checking submission status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}