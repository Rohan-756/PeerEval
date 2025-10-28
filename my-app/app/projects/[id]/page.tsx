import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import TeamManager from "@/app/components/TeamManager";

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

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const projectId = resolvedParams?.id;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      instructor: { select: { email: true, name: true } },
      invites: {
        include: {
          student: { select: { id: true, email: true, name: true } },
        },
      },
      teams: {
        include: {
          members: { include: { student: { select: { name: true, email: true } } } },
        },
      },
    },
  });

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
        {/* ✅ Form Team Section */}
        <TeamManager
          projectId={project.id}
          invites={project.invites as Invite[]}
          existingTeams={project.teams}
        />

        {/* Project Info */}
        <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Instructor</h2>
          <p>{project.instructor.name || project.instructor.email}</p>
        </div>

        {/* Invited Students Section */}
        <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Invited Students</h2>
          {project.invites.length === 0 ? (
            <p className="text-gray-500">No students invited yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.invites.map((invite) => (
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
