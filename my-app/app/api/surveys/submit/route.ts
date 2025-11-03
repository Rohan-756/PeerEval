import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Body: { assignmentId, respondentId, projectId, answers: { [targetStudentId]: { [criterionId]: string } } }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assignmentId, respondentId, projectId, answers } = body || {};

    if (!assignmentId || !respondentId || !projectId || !answers || typeof answers !== 'object') {
      return NextResponse.json({ error: "assignmentId, respondentId, projectId, answers required" }, { status: 400 });
    }

    const assignment = await prisma.surveyAssignment.findFirst({
      where: { id: assignmentId, projectId },
      include: { project: true },
    });
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    // Deadline check
    if (new Date(assignment.deadline).getTime() < Date.now()) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 400 });
    }

    // Ensure respondent is part of a team in this project
    const myTeam = await prisma.team.findFirst({
      where: { projectId, members: { some: { studentId: respondentId } } },
      include: { members: true },
    });
    if (!myTeam) return NextResponse.json({ error: "Respondent not part of a team for this project" }, { status: 400 });

    // Validate targets are in the same team
    const teamMemberIds = new Set(myTeam.members.map((m) => m.studentId));
    for (const targetId of Object.keys(answers)) {
      if (!teamMemberIds.has(targetId)) {
        return NextResponse.json({ error: "Targets must be teammates" }, { status: 400 });
      }
    }

    // Persist one SurveyResponse per target student
    const writes = Object.entries(answers).map(([targetStudentId, answerMap]) =>
      prisma.surveyResponse.upsert({
        where: { assignmentId_respondentId_targetStudentId: { assignmentId, respondentId, targetStudentId } },
        update: { answers: answerMap },
        create: { assignmentId, respondentId, targetStudentId, answers: answerMap as any },
      })
    );
    await Promise.all(writes);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error submitting survey response:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


