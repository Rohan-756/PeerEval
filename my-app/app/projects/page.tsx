// File: app/projects/page.tsx

import Header from "@/app/components/Header";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProjectList from "@/app/components/ProjectList";

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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">All Projects</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="text-gray-500">No projects have been created yet.</p>
        ) : (
          <ProjectList projects={projects} showCreateTeam showInvite />
        )}
      </div>
    </>
  );
}