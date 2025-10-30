import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import TeamManager from "@/app/components/TeamManager";

interface ProjectPageProps {
  // The params prop can be a promise, so we must account for that
  params: Promise<{ id: string }> | { id: string };
}

// Define types for clarity
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

/**
 * Server-side function to fetch ONLY students who have
 * accepted an invite and are NOT yet on a team.
 */
async function getAvailableStudents(projectId: string) {
  // This function is fine, no changes needed
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
  // 👇 THE FIX IS HERE
  // We await the params promise to get the plain object
  const resolvedParams = await params;
  const projectId = resolvedParams.id; // Now this will work

  // 1. Fetch all project data in parallel for efficiency
  const [project, availableStudents] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId }, // And projectId is correctly passed here
      include: {
        instructor: { select: { email: true, name: true } },
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
    getAvailableStudents(projectId), // And here
  ]);

  if (!project) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        ⚠️ Project not found.
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* TeamManager Section */}
        <TeamManager
          projectId={project.id}
          availableStudents={availableStudents}
          existingTeams={project.teams}
        />

        {/* Project Info (Unchanged) */}
        <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Instructor</h2>
          <p>{project.instructor.name || project.instructor.email}</p>
        </div>

        {/* Invited Students Section (Unchanged) */}
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