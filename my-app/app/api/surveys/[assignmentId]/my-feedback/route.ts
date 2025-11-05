// Fetch all feedback received about a specific student for an assignment
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

    // Get the assignment with survey criteria
    const assignment = await prisma.surveyAssignment.findFirst({
      where: { id: assignmentId },
      include: {
        survey: {
          include: {
            criteria: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Fetch all responses about this student (where targetStudentId matches)
    const responses = await prisma.surveyResponse.findMany({
      where: {
        assignmentId,
        targetStudentId,
      },
      include: {
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: "asc",
      },
    });

    // Structure the feedback by criterion
    // Format: { criterionId: [{ respondent: {...}, text: string, rating: number }] }
    const feedbackByCriterion: Record<string, Array<{
      respondent: { id: string; name: string | null; email: string };
      text: string;
      rating: number;
    }>> = {};

    // Initialize structure for all criteria
    assignment.survey.criteria.forEach((criterion) => {
      feedbackByCriterion[criterion.id] = [];
    });

    // Populate feedback for each criterion
    responses.forEach((response) => {
      const answers = response.answers as Record<string, { text: string; rating: number }>;
      
      Object.entries(answers).forEach(([criterionId, answerData]) => {
        if (feedbackByCriterion[criterionId]) {
          feedbackByCriterion[criterionId].push({
            respondent: response.respondent,
            text: answerData.text || "",
            rating: answerData.rating || 0,
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      feedbackByCriterion,
      criteria: assignment.survey.criteria,
      totalResponses: responses.length,
    });
  } catch (err) {
    console.error("Error fetching feedback:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

