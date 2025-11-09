import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

// Generate PDF feedback report for a student
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await context.params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!assignmentId || !studentId) {
      return NextResponse.json(
        { error: "assignmentId and studentId are required" },
        { status: 400 }
      );
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
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Get the student's info
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if all team members have completed the survey
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
      return NextResponse.json(
        { error: "Student not part of a team" },
        { status: 400 }
      );
    }

    const teamMemberIds = studentTeam.team.members.map((m) => m.studentId);
    const expectedTargetsPerRespondent = teamMemberIds.length - 1;

    // Check if all team members have submitted
    const submissionChecks = await Promise.all(
      teamMemberIds.map(async (respondentId) => {
        const submittedTargets = await prisma.surveyResponse.findMany({
          where: {
            assignmentId,
            respondentId,
            targetStudentId: { in: teamMemberIds.filter((id) => id !== respondentId) },
          },
          select: { targetStudentId: true },
          distinct: ["targetStudentId"],
        });
        return submittedTargets.length === expectedTargetsPerRespondent;
      })
    );

    const allSubmitted = submissionChecks.every((submitted) => submitted);

    if (!allSubmitted) {
      return NextResponse.json(
        { error: "Survey is not fully completed by all team members yet" },
        { status: 400 }
      );
    }

    // Fetch all feedback received about this student
    const responses = await prisma.surveyResponse.findMany({
      where: {
        assignmentId,
        targetStudentId: studentId,
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

    // Structure feedback by criterion (with respondent info for anonymization)
    const feedbackByCriterion: Record<
      string,
      Array<{
        respondent: { id: string; name: string | null; email: string };
        text: string;
        rating: number;
      }>
    > = {};

    assignment.survey.criteria.forEach((criterion) => {
      feedbackByCriterion[criterion.id] = [];
    });

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

    // Anonymize feedback: Shuffle and assign anonymous identifiers for each criterion
    // This ensures students cannot identify who gave which feedback in the PDF
    const anonymizedFeedback: Record<string, Array<{
      anonymousId: string;
      text: string;
      rating: number;
    }>> = {};

    assignment.survey.criteria.forEach((criterion) => {
      const feedbacks = feedbackByCriterion[criterion.id] || [];
      
      // Shuffle feedback items randomly for each criterion
      // This prevents students from correlating feedback across criteria
      const shuffled = [...feedbacks].sort(() => Math.random() - 0.5);
      
      // Assign anonymous identifiers (Peer 1, Peer 2, etc.)
      anonymizedFeedback[criterion.id] = shuffled.map((feedback, index) => ({
        anonymousId: `Peer ${index + 1}`,
        text: feedback.text,
        rating: feedback.rating,
      }));
    });

    // Calculate average ratings per criterion using anonymized feedback
    const criterionAverages: Record<string, number> = {};
    assignment.survey.criteria.forEach((criterion) => {
      const feedbacks = anonymizedFeedback[criterion.id];
      if (feedbacks.length > 0) {
        const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
        criterionAverages[criterion.id] = Math.round((sum / feedbacks.length) * 100) / 100;
      } else {
        criterionAverages[criterion.id] = 0;
      }
    });

    // Generate PDF using jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number = 20) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize("Peer Evaluation Feedback Report", maxWidth);
    doc.text(titleLines, pageWidth / 2, yPosition, { align: "center" });
    yPosition += titleLines.length * 7 + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${assignment.project.title}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 7;
    doc.text(`Survey: ${assignment.survey.title}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 7;
    doc.text(`Student: ${student.name || student.email}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 7;
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += 15;

    // Survey description
    if (assignment.survey.description) {
      checkPageBreak(15);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Description:", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(assignment.survey.description, maxWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 10;
    }

    // Deadline
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.text(`Deadline: ${new Date(assignment.deadline).toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    // Summary section
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Responses Received: ${responses.length}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Total Criteria: ${assignment.survey.criteria.length}`, margin + 5, yPosition);
    yPosition += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Note: All feedback has been anonymized to maintain confidentiality.", margin + 5, yPosition);
    yPosition += 10;

    // Feedback by criterion
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Feedback by Criterion", margin, yPosition);
    yPosition += 15;

    assignment.survey.criteria.forEach((criterion, index) => {
      const feedbacks = anonymizedFeedback[criterion.id];
      const average = criterionAverages[criterion.id];

      checkPageBreak(30);
      
      // Criterion title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${criterion.label}`, margin, yPosition);
      yPosition += 8;
      
      // Average rating
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Average Rating: ${average.toFixed(2)} / ${criterion.maxRating}`, margin + 5, yPosition);
      yPosition += 10;

      if (feedbacks.length === 0) {
        doc.setFontSize(9);
        doc.text("No feedback received for this criterion.", margin + 10, yPosition);
        yPosition += 8;
      } else {
        feedbacks.forEach((feedback, idx) => {
          checkPageBreak(25);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          // Use anonymous identifier instead of respondent name
          doc.text(`Feedback from ${feedback.anonymousId}:`, margin + 10, yPosition);
          yPosition += 6;
          
          doc.setFont("helvetica", "normal");
          doc.text(`Rating: ${feedback.rating} / ${criterion.maxRating}`, margin + 15, yPosition);
          yPosition += 6;
          
          if (feedback.text) {
            const commentLines = doc.splitTextToSize(`Comment: ${feedback.text}`, maxWidth - 15);
            doc.text(commentLines, margin + 15, yPosition);
            yPosition += commentLines.length * 4.5;
          }
          
          if (idx < feedbacks.length - 1) {
            yPosition += 3;
          }
        });
      }
      yPosition += 10;
    });

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        "This report was generated automatically by the PeerEval system.",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="feedback-report-${assignment.survey.title}-${student.name || student.email}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error generating PDF:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

