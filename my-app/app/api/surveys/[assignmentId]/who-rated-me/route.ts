// Get list of team members who have submitted feedback about a specific student
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await context.params;
    const { searchParams } = new URL(req.url);
    const targetStudentId = searchParams.get("targetStudentId");

    if (!assignmentId || !targetStudentId) {
      return NextResponse.json({ error: "assignmentId and targetStudentId are required" }, { status: 400 });
    }

    // Get all responses about this student (where targetStudentId matches)
    const responses = await prisma.surveyResponse.findMany({
      where: {
        assignmentId,
        targetStudentId,
      },
      select: {
        respondentId: true,
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      distinct: ["respondentId"],
    });

    return NextResponse.json({
      success: true,
      respondents: responses.map(r => r.respondent),
    });
  } catch (err) {
    console.error("Error fetching who rated me:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

