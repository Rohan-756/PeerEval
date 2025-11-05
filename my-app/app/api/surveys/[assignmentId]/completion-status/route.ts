// Check if all team members have submitted their responses for an assignment
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await context.params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!assignmentId || !studentId) {
      return NextResponse.json({ error: "assignmentId and studentId are required" }, { status: 400 });
    }

    // Get the assignment and project
    const assignment = await prisma.surveyAssignment.findFirst({
      where: { id: assignmentId },
      include: { project: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Get the student's team
    const studentTeam = await prisma.teamMember.findFirst({
      where: {
        studentId: studentId,
        team: {
          projectId: assignment.projectId,
        },
      },
      include: {
        team: {
          include: {
            members: {
              select: { studentId: true },
            },
          },
        },
      },
    });

    if (!studentTeam) {
      return NextResponse.json({ error: "Student not part of a team" }, { status: 400 });
    }

    // Get all team member IDs (including the student themselves)
    const teamMemberIds = studentTeam.team.members.map((m) => m.studentId);

    // For each team member, check if they've submitted responses for all their teammates
    // A team member should have submitted responses for all other team members (excluding themselves)
    const expectedTargetsPerRespondent = teamMemberIds.length - 1; // Exclude self

    const submissionChecks = await Promise.all(
      teamMemberIds.map(async (respondentId) => {
        // Count how many unique targets this respondent has submitted responses for
        const submittedTargets = await prisma.surveyResponse.findMany({
          where: {
            assignmentId,
            respondentId,
            targetStudentId: { in: teamMemberIds.filter(id => id !== respondentId) },
          },
          select: {
            targetStudentId: true,
          },
          distinct: ["targetStudentId"],
        });

        return {
          respondentId,
          hasSubmitted: submittedTargets.length === expectedTargetsPerRespondent,
        };
      })
    );

    const submittedCount = submissionChecks.filter(check => check.hasSubmitted).length;
    const totalCount = teamMemberIds.length;
    const allSubmitted = submittedCount === totalCount;

    return NextResponse.json({
      success: true,
      allSubmitted,
      submittedCount,
      totalCount,
      teamMemberIds,
    });
  } catch (err) {
    console.error("Error checking completion status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

