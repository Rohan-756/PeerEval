// my-app/app/projects/[projectId]/surveys/[assignmentId]/page.tsx
import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import StudentSurveyResponse from "@/app/components/StudentSurveyResponse";
import { notFound } from "next/navigation";

interface SurveyResponsePageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function SurveyResponsePage({ params }: SurveyResponsePageProps) {
  const { id: projectId, assignmentId } = await params;

  // 1. Fetch the Assignment and its Survey/Criteria
  // FIX: Changed findUnique to findFirst. findUnique only accepts fields
  // that are part of a unique index (@id or @@unique). findFirst allows 
  // filtering by any field combination.
  const assignment = await prisma.surveyAssignment.findFirst({
    where: { 
      id: assignmentId, 
      projectId: projectId // Ensure assignment belongs to the project
    },
    include: {
      survey: {
        include: {
          criteria: {
            orderBy: { order: 'asc' },
          },
        },
      },
      project: {
        select: { title: true },
      }
    },
  });

  if (!assignment) {
    notFound();
  }

  // Structure data for the client component
  const assignmentDetails = {
    id: assignment.id,
    deadline: assignment.deadline.toISOString(),
    status: assignment.status,
    projectTitle: assignment.project.title,
    survey: {
      title: assignment.survey.title,
      description: assignment.survey.description,
      criteria: assignment.survey.criteria.map(c => ({
        id: c.id,
        label: c.label,
        minRating: c.minRating,
        maxRating: c.maxRating,
      })),
    },
  };

  return (
    <>
      <Header />
      <div className="p-8 max-w-6xl mx-auto">
        <StudentSurveyResponse 
          assignment={assignmentDetails} 
          projectId={projectId} 
        />
      </div>
    </>
  );
}