import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import TeamManager from "@/app/components/TeamManager";
import SurveyManager from "@/app/components/SurveyManager";
import InviteButton from "@/app/components/InviteButton"; // REQUIRED COMPONENT
import { notFound } from "next/navigation";
// Removed Next.js dynamic header/redirect imports to prevent TypeError

interface ProjectPageProps {
  params: Promise<{ id: string }> | { id: string };
}

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Invite {
  id: string;
  status: string;
  student: Student;
}

async function getAvailableStudents(projectId: string) {
  const availableStudents = await prisma.user.findMany({
    where: {
      invites: {
        some: {
          projectId: projectId,
          status: "accepted",
        },
      },
      teamMemberships: {
        none: {
          team: {
            projectId: projectId,
          },
        },
      },
    },
    select: { id: true, name: true, email: true },
  });
  return availableStudents;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  // --- Client-side authorization pattern ---
  // Default values are used here. Authorization logic is handled in client components
  // (InviteButton, TeamManager, SurveyManager) via sessionStorage.
  const currentUserRole = "student"; 
  const currentUserId = ""; 
  // ------------------------------------------

  const [project, availableStudents] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId }, 
      include: {
        instructor: { select: { id: true, email: true, name: true } },
        invites: {
          include: {
            student: { select: { id: true, email: true, name: true } },
          },
        },
        teams: {
          include: {
            members: {
              include: { student: { select: { name: true, email: true } } },
            },
          },
        },
      },
    }),
    getAvailableStudents(projectId),
  ]);

  if (!project) {
    notFound();
  }
  
  const instructorId = project.instructorId; 

  return (
    <>
      <Header />
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        
        {/* ── Project Header (Includes Invite Student Button) ──────────────── */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800">{project.title}</h1>
            <p className="text-lg text-gray-600 mt-1">{project.description}</p>
            <p className="text-sm text-gray-400 mt-2">Instructor: {project.instructor.name || project.instructor.email}</p>
          </div>
          
          <div className="flex space-x-3 mt-1">
              {/* This button will only be visible and functional if the user is the project's instructor (checked in InviteButton.tsx) */}
              <InviteButton 
                  projectId={projectId} 
                  instructorId={instructorId} 
              />
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <SurveyManager 
                projectId={projectId} 
                userRole={currentUserRole} 
                instructorId={instructorId} 
            />
          </div>

          <div className="lg:col-span-2">
            <TeamManager 
                projectId={projectId} 
                availableStudents={availableStudents}
                existingTeams={project.teams}
                userRole={currentUserRole} 
                currentUserId={currentUserId}
            />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            All Invited Students
          </h2>
          {project.invites.length === 0 ? (
            <p className="text-gray-500">No students invited yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.invites.map((invite: Invite) => (
                <li
                  key={invite.student.id}
                  className="flex justify-between items-center border-b pb-2 text-gray-700"
                >
                  <span>{invite.student.email}</span>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded ${
                      invite.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : invite.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {invite.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </>
  );
}