"use client";
import React, { useEffect, useState } from "react";

export default function SurveyManager({ projectId, instructorId }: { projectId: string; instructorId: string; }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", deadline: "" });
  const [criteria, setCriteria] = useState<Array<{ label: string }>>([
    { label: "Teamwork" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const isInstructorOwner = currentUser?.role === "instructor" && currentUser?.id === instructorId;
  const isStudent = currentUser?.role === "student";
  const [myTeam, setMyTeam] = useState<any[]>([]);
  const [textAnswers, setTextAnswers] = useState<Record<string, Record<string, string>>>({});

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

  // Load current student's team members for text responses
  useEffect(() => {
    const loadTeam = async () => {
      if (!isStudent || !currentUser?.id) return;
      try {
        const res = await fetch(`/api/projects/${projectId}/my-team?studentId=${currentUser.id}`);
        const data = await res.json();
        if (res.ok) setMyTeam(data.members || []);
      } catch {}
    };
    loadTeam();
  }, [isStudent, currentUser?.id, projectId]);

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
          criteria: criteria.map((c, index) => ({
            label: c.label,
            order: index + 1,
          })),
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
          {/* Prompt builder */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Text Prompts</h4>
              <button
                type="button"
                onClick={() => setCriteria((prev) => [...prev, { label: "" }])}
                className="text-indigo-600 hover:underline"
              >
                + Add prompt
              </button>
            </div>
            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    placeholder={`Prompt ${idx + 1}`}
                    className="border border-gray-300 rounded-lg p-2"
                    value={c.label}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCriteria((prev) => prev.map((pc, i) => i === idx ? { label: v } : pc));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCriteria((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
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
            <li key={a.id} className="p-3 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.survey?.title}</div>
                  <div className="text-xs text-gray-600">Deadline: {new Date(a.deadline).toLocaleString()}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700">{a.status}</span>
              </div>
              {!!a.survey?.criteria?.length && !isStudent && (
                <ul className="mt-2 text-sm list-disc list-inside text-gray-700">
                  {a.survey.criteria.map((c: any) => (
                    <li key={c.id}>{c.label}</li>
                  ))}
                </ul>
              )}
              {isStudent && a.status === 'open' && !!a.survey?.criteria?.length && (
                <div className="mt-3">
                  <div className="font-medium mb-1">Your responses</div>
                  {myTeam.length === 0 && (
                    <p className="text-sm text-gray-600 mb-2">You are not assigned to a team yet for this project. Ask your instructor to add you to a team to respond.</p>
                  )}
                  <div className="space-y-3">
                    {myTeam.map((member) => (
                      <div key={member.id} className="border rounded p-2">
                        <div className="text-sm font-semibold mb-1">For: {member.name || member.email}</div>
                        {a.survey.criteria.map((c: any) => (
                          <div key={c.id} className="mb-2">
                            <div className="text-sm text-gray-700 mb-1">{c.label}</div>
                            <textarea
                              className="w-full border border-gray-300 rounded p-2"
                              rows={2}
                              value={textAnswers[member.id]?.[c.id] || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setTextAnswers((prev) => ({
                                  ...prev,
                                  [member.id]: { ...(prev[member.id] || {}), [c.id]: v },
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/surveys/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              assignmentId: a.id,
                              respondentId: currentUser.id,
                              projectId,
                              answers: textAnswers,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to submit');
                          alert('✅ Responses submitted');
                        } catch (e: any) {
                          alert(e.message || 'Error submitting');
                        }
                      }}
                      disabled={myTeam.length === 0}
                    >
                      Submit Responses
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


