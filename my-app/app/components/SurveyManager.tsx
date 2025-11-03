"use client";
import React, { useEffect, useState } from "react";

export default function SurveyManager({ projectId, instructorId }: { projectId: string; instructorId: string; }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", deadline: "" });
  const [submitting, setSubmitting] = useState(false);

  const isInstructorOwner = currentUser?.role === "instructor" && currentUser?.id === instructorId;

  useEffect(() => {
    const saved = sessionStorage.getItem("peerEvalUser");
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/surveys`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load surveys");
      setAssignments(data.assignments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignments(); }, [projectId]);

  const handleAssign = async () => {
    if (!form.title.trim() || !form.deadline) {
      alert("Enter a title and deadline");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/surveys/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          creatorId: currentUser?.id,
          title: form.title,
          description: form.description,
          deadline: form.deadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign survey");
      setForm({ title: "", description: "", deadline: "" });
      setAssignments((prev) => [data.assignment, ...prev]);
      alert("✅ Survey assigned!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error assigning survey");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Surveys</h2>
      {isInstructorOwner && (
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Survey Title"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              type="datetime-local"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <textarea
              placeholder="Optional Description"
              className="md:col-span-2 w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="mt-3">
            <button
              onClick={handleAssign}
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
            >
              {submitting ? "Assigning..." : "Assign Survey"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading surveys...</p>
      ) : !assignments.length ? (
        <p className="text-gray-500">No surveys assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => (
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
  );
}


