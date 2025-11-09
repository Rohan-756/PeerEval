import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get survey completion status and aggregated results for instructors
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await context.params;
    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
    }

    // Get the assignment with survey and project info
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
        project: {
          include: {
            teams: {
              include: {
                members: {
                  include: {
                    student: {
                      select: { id: true, name: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Get all responses for this assignment
    const responses = await prisma.surveyResponse.findMany({
      where: { assignmentId },
      include: {
        respondent: { select: { id: true, name: true, email: true } },
        targetStudent: { select: { id: true, name: true, email: true } },
      },
    });

    // Get all students in teams for this project
    // Only include students who are actually in teams
    const allStudents = new Set<string>();
    assignment.project.teams.forEach(team => {
      team.members.forEach(member => {
        allStudents.add(member.student.id);
      });
    });

    // If no teams exist, return empty completion status
    if (allStudents.size === 0) {
      return NextResponse.json({
        success: true,
        assignment: {
          id: assignment.id,
          survey: {
            id: assignment.survey.id,
            title: assignment.survey.title,
            description: assignment.survey.description,
            criteria: assignment.survey.criteria,
          },
          deadline: assignment.deadline.toISOString(),
          status: assignment.status,
        },
        completionStatus: [],
        aggregatedResults: [],
        overallStats: {
          totalStudents: 0,
          completedStudents: 0,
          overallCompletionPercentage: 0,
          totalResponses: responses.length,
        },
      });
    }

    // Calculate completion status per student
    // For each student, count how many responses they've submitted (one per teammate)
    const studentSubmissions = new Map<string, Set<string>>();
    responses.forEach(response => {
      if (!studentSubmissions.has(response.respondentId)) {
        studentSubmissions.set(response.respondentId, new Set());
      }
      studentSubmissions.get(response.respondentId)!.add(response.targetStudentId);
    });

    // For each student, calculate expected submissions (number of teammates)
    const completionStatus = Array.from(allStudents).map(studentId => {
      // Find which team this student belongs to
      const studentTeam = assignment.project.teams.find(team =>
        team.members.some(m => m.student.id === studentId)
      );

      if (!studentTeam) {
        return {
          studentId,
          studentName: null,
          studentEmail: null,
          teamName: null,
          expectedSubmissions: 0,
          completedSubmissions: 0,
          completionPercentage: 0,
          isComplete: false,
        };
      }

      // Expected submissions = number of teammates (excluding self)
      const teamMemberIds = studentTeam.members.map(m => m.student.id);
      const expectedSubmissions = teamMemberIds.length - 1; // Exclude self
      const completedSubmissions = studentSubmissions.get(studentId)?.size || 0;
      const completionPercentage = expectedSubmissions > 0
        ? Math.round((completedSubmissions / expectedSubmissions) * 100)
        : 0;

      const student = studentTeam.members.find(m => m.student.id === studentId)?.student;

      return {
        studentId,
        studentName: student?.name || null,
        studentEmail: student?.email || null,
        teamName: studentTeam.name,
        expectedSubmissions,
        completedSubmissions,
        completionPercentage,
        isComplete: completedSubmissions >= expectedSubmissions,
      };
    });

    // Calculate aggregated results by criterion
    // Group responses by criterion and calculate averages
    const aggregatedResults: Record<string, {
      criterionId: string;
      criterionLabel: string;
      averageRating: number;
      totalResponses: number;
      ratings: number[];
      responses: Array<{
        respondentName: string;
        targetStudentName: string;
        rating: number;
        text: string;
      }>;
    }> = {};

    // Initialize aggregated results for each criterion
    assignment.survey.criteria.forEach(criterion => {
      aggregatedResults[criterion.id] = {
        criterionId: criterion.id,
        criterionLabel: criterion.label,
        averageRating: 0,
        totalResponses: 0,
        ratings: [],
        responses: [],
      };
    });

    // Process each response
    responses.forEach(response => {
      const answers = response.answers as Record<string, { text: string; rating: number }>;
      
      Object.entries(answers).forEach(([criterionId, answer]) => {
        if (aggregatedResults[criterionId]) {
          aggregatedResults[criterionId].totalResponses++;
          aggregatedResults[criterionId].ratings.push(answer.rating);
          aggregatedResults[criterionId].responses.push({
            respondentName: response.respondent.name || response.respondent.email,
            targetStudentName: response.targetStudent.name || response.targetStudent.email,
            rating: answer.rating,
            text: answer.text || "",
          });
        }
      });
    });

    // Calculate averages
    Object.values(aggregatedResults).forEach(result => {
      if (result.ratings.length > 0) {
        result.averageRating = result.ratings.reduce((sum, rating) => sum + rating, 0) / result.ratings.length;
        result.averageRating = Math.round(result.averageRating * 100) / 100; // Round to 2 decimal places
      }
    });

    // Calculate overall completion statistics
    const totalStudents = completionStatus.length;
    const completedStudents = completionStatus.filter(s => s.isComplete).length;
    const overallCompletionPercentage = totalStudents > 0
      ? Math.round((completedStudents / totalStudents) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        survey: {
          id: assignment.survey.id,
          title: assignment.survey.title,
          description: assignment.survey.description,
          criteria: assignment.survey.criteria,
        },
        deadline: assignment.deadline.toISOString(),
        status: assignment.status,
      },
      completionStatus,
      aggregatedResults: Object.values(aggregatedResults),
      overallStats: {
        totalStudents,
        completedStudents,
        overallCompletionPercentage,
        totalResponses: responses.length,
      },
    });
  } catch (err) {
    console.error("Error fetching survey results:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

