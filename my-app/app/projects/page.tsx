// File: app/projects/page.tsx

import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import Link from "next/link"; // Import the Next.js Link component

export default async function ProjectsListPage() {
  // Fetch all projects.
  // We only select the fields needed for the list to keep the query light.
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      description: true,
    },
    orderBy: {
      createdAt: "desc", // Show newest projects first
    },
  });

  return (
    <>
      <Header />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">All Projects</h1>

        {projects.length === 0 ? (
          <p className="text-gray-500">
            No projects have been created yet.
          </p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              // This Link component is the key.
              // It links to your dynamic page: app/projects/[id]/page.tsx
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block p-4 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <h2 className="text-xl font-semibold text-indigo-700">
                  {project.title}
                </h2>
                <p className="text-gray-600 mt-1">{project.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}