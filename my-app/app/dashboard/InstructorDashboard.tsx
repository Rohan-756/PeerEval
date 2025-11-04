"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectList from "../components/ProjectList";

export default function InstructorDashboard({ user }: { user: any }) {

  const router = useRouter();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // No survey UI here; handled on project page

  // ✅ Fetch projects created by this instructor
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsFetching(true);
        setError(null);

        const res = await fetch(`/api/projects/list?userId=${user.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch projects");
        }

        setProjects(data.projects || []);
      } catch (err: any) {
        console.error("❌ Error loading projects:", err);
        setError(err.message || "Failed to load projects");
      } finally {
        setIsFetching(false);
      }
    };

    if (user?.id) fetchProjects();
  }, [user.id]);

  // (surveys are managed on the project page)

  // ✅ Create a new project
  const handleAddProject = async () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      alert("Please enter both a title and description");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: user.id,
          title: newProject.title,
          description: newProject.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating project");

      setProjects((prev) => [...prev, data.project]);
      setNewProject({ title: "", description: "" });
      alert("✅ Project created successfully!");
    } catch (err: any) {
      console.error(err);
      alert("❌ Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Project deletion logic is now handled inside ProjectList.tsx
  // const handleDeleteProject = async (projectId: string) => { ... } // REMOVED UNUSED FUNCTION

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold text-indigo-700">
        Welcome, {user.email} (Instructor)
      </h2>

      {/* ─── Add New Project ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <h3 className="text-xl font-bold mb-4">Add New Project</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Project Title"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
            value={newProject.title}
            onChange={(e) =>
              setNewProject({ ...newProject, title: e.target.value })
            }
          />
          <textarea
            placeholder="Short Description"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
            rows={3}
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
          />
          <button
            onClick={handleAddProject}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Add Project"}
          </button>
        </div>
      </section>

      {/* ─── Project List (recent 5) ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Recent Projects</h3>
          <button
            onClick={() => router.push("/projects")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            All Projects
          </button>
        </div>

        {isFetching ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : error ? (
          <p className="text-red-500">⚠️ {error}</p>
        ) : (
          <ProjectList
            projects={[...projects]
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
            limit={5}
            showDelete={true} // <--- ADDED: show delete button on dashboard
          />
        )}
      </section>

      {/* (Survey assignment moved to the project page) */}
    </div>
  );
}