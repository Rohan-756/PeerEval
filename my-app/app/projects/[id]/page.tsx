import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";

interface ProjectPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const projectId = resolvedParams?.id;

  if (!projectId) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        ⚠️ Invalid project ID.
      </div>
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      instructor: { select: { email: true, name: true } },
      invites: {
        include: {
          student: { select: { email: true, name: true } },
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
    <Header/>
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-indigo-700">{project.title}</h1>
      <p className="text-gray-700">{project.description}</p>

      <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Instructor</h2>
        <p>{project.instructor.name || project.instructor.email}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Invited Students
        </h2>
        {project.invites.length === 0 ? (
          <p className="text-gray-500">No students invited yet.</p>
        ) : (
          <ul className="space-y-2">
            {project.invites.map((invite) => (
              <li
                key={invite.id}
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
