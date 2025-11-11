import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import SurveyResultsView from "@/app/components/SurveyResultsView";
import { notFound } from "next/navigation";

interface SurveyResultsPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function SurveyResultsPage({ params }: SurveyResultsPageProps) {
  const { id: projectId, assignmentId } = await params;

  // Verify the assignment exists and belongs to the project
  const assignment = await prisma.surveyAssignment.findFirst({
    where: {
      id: assignmentId,
      projectId: projectId,
    },
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
          id: true,
          title: true,
          instructorId: true,
        },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  return (
    <>
      <Header />
      <div className="p-8 max-w-7xl mx-auto">
        <SurveyResultsView
          projectId={projectId}
          assignmentId={assignmentId}
          projectTitle={assignment.project.title}
          instructorId={assignment.project.instructorId}
        />
      </div>
    </>
  );
}

