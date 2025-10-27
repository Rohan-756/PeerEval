"use client";
import React, { useState, useEffect } from "react";

export default function InstructorDashboard({ user }: { user: any }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // ✅ Invite a student by email
  const handleInvite = async () => {
    if (!selectedProjectId || !inviteEmail.trim()) {
      alert("Select a project and enter an email");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          studentEmail: inviteEmail,
          instructorId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      alert(`✅ Invite sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err: any) {
      console.error(err);
      alert("❌ Error sending invite");
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Delete a project
  const handleDeleteProject = async (projectId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, instructorId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");

      // Remove deleted project from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      alert("🗑️ Project deleted successfully!");
    } catch (err: any) {
      console.error(err);
      alert("❌ Error deleting project");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* ─── Project List ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <h3 className="text-xl font-bold mb-4">Your Projects</h3>

        {isFetching ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : error ? (
          <p className="text-red-500">⚠️ {error}</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">No projects created yet.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => (
              <li
                key={p.id}
                className={`p-4 border rounded-lg flex justify-between items-center transition ${
                  selectedProjectId === p.id
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-gray-800">{p.title}</h4>
                  <p className="text-sm text-gray-600">{p.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    className="text-indigo-600 font-medium hover:underline"
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    {selectedProjectId === p.id ? "Selected" : "Select"}
                  </button>

                  {/* 🆕 Delete Button */}
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Invite Students ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <h3 className="text-xl font-bold mb-4">Invite Students</h3>
        <p className="text-sm text-gray-600 mb-2">
          Select a project above before sending an invite.
        </p>
        <div className="flex space-x-3">
          <input
            type="email"
            placeholder="Student Email"
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button
            onClick={handleInvite}
            disabled={isLoading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </section>
    </div>
  );
}
