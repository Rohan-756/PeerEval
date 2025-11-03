"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InstructorDashboard({ user }: { user: any }) {

  const router = useRouter();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🆕 Survey assignment state
  const [surveyForm, setSurveyForm] = useState({ title: "", description: "", deadline: "" });
  const [assignments, setAssignments] = useState<Record<string, any[]>>({});
  const [isAssigning, setIsAssigning] = useState(false);

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

  // 🆕 Fetch surveys for selected project
  useEffect(() => {
    const fetchAssignments = async (projectId: string) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/surveys`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load surveys");
        setAssignments((prev) => ({ ...prev, [projectId]: data.assignments || [] }));
      } catch (e) {
        console.error(e);
      }
    };
    if (selectedProjectId) fetchAssignments(selectedProjectId);
  }, [selectedProjectId]);

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
                onClick={() => router.push(`/projects/${p.id}`)}
                className={`p-4 border rounded-lg flex justify-between items-center transition cursor-pointer ${selectedProjectId === p.id
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div>
                  <h4 className="font-semibold text-gray-800">{p.title}</h4>
                  <p className="text-sm text-gray-600">{p.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    className="text-indigo-600 font-medium hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(p.id);
                    }}
                  >
                    {selectedProjectId === p.id ? "Selected" : "Select"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(p.id);
                    }}
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

      {/* ─── Assign Survey to Project ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <h3 className="text-xl font-bold mb-4">Assign Survey to Project</h3>
        <p className="text-sm text-gray-600 mb-2">Select a project above before assigning a survey.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Survey Title"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
            value={surveyForm.title}
            onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })}
          />
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
            value={surveyForm.deadline}
            onChange={(e) => setSurveyForm({ ...surveyForm, deadline: e.target.value })}
          />
          <textarea
            placeholder="Optional Description"
            className="md:col-span-2 w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
            rows={3}
            value={surveyForm.description}
            onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })}
          />
        </div>
        <div className="mt-3 flex gap-3">
          <button
            onClick={async () => {
              if (!selectedProjectId) {
                alert("Select a project first");
                return;
              }
              if (!surveyForm.title.trim() || !surveyForm.deadline) {
                alert("Enter a title and deadline");
                return;
              }
              setIsAssigning(true);
              try {
                const res = await fetch("/api/surveys/assign", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    projectId: selectedProjectId,
                    creatorId: user.id,
                    title: surveyForm.title,
                    description: surveyForm.description,
                    deadline: surveyForm.deadline,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to assign survey");
                setSurveyForm({ title: "", description: "", deadline: "" });
                // refresh list for selected project
                setAssignments((prev) => {
                  const list = prev[selectedProjectId] || [];
                  return { ...prev, [selectedProjectId]: [data.assignment, ...list] };
                });
                alert("✅ Survey assigned!");
              } catch (e: any) {
                console.error(e);
                alert(e.message || "Error assigning survey");
              } finally {
                setIsAssigning(false);
              }
            }}
            disabled={isAssigning}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
          >
            {isAssigning ? "Assigning..." : "Assign Survey"}
          </button>
        </div>
        {selectedProjectId && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Assigned Surveys</h4>
            {!(assignments[selectedProjectId]?.length) ? (
              <p className="text-sm text-gray-600">No surveys assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignments[selectedProjectId].map((a) => (
                  <li key={a.id} className="p-3 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.survey?.title}</div>
                      <div className="text-xs text-gray-600">Deadline: {new Date(a.deadline).toLocaleString()}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700">{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
