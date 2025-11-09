// my-app/app/components/SurveyManager.tsx

"use client";
import React, { useEffect, useState, useRef } from "react";

export default function SurveyManager({ projectId, instructorId }: { projectId: string; instructorId: string; }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", deadline: "" });
  const [criteria, setCriteria] = useState<Array<{ label: string }>>([
    { label: "Teamwork" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const deadlineInputRef = useRef<HTMLInputElement>(null);

  const isInstructorOwner = currentUser?.role === "instructor" && currentUser?.id === instructorId;
  const isStudent = currentUser?.role === "student";
  // REMOVED: const [myTeam, setMyTeam] = useState<any[]>([]);
  // REMOVED: const [responses, setResponses] = useState<Record<string, Record<string, { text: string; rating: number }>>>({});
  const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});

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

  // After assignments load, check if current student already submitted each
  useEffect(() => {
    const checkSubmitted = async () => {
      if (!isStudent || !currentUser?.id || !assignments.length) return;
      try {
        const pairs = await Promise.all(
          assignments.map(async (a) => {
            const res = await fetch(`/api/surveys/${a.id}/my-status?respondentId=${currentUser.id}`);
            const data = await res.json();
            return [a.id, !!data.submitted] as const;
          })
        );
        const map: Record<string, boolean> = {};
        for (const [id, flag] of pairs) map[id] = flag;
        setSubmittedMap(map);
      } catch (e) {
        console.error(e);
      }
    };
    checkSubmitted();
  }, [assignments, isStudent, currentUser?.id]);

  // REMOVED: Load current student's team members useEffect

  // no instructor response viewing

  const handleAssign = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always read from the actual DOM inputs first (most reliable)
    // This ensures we get the actual current value even if React state is stale
    const titleEl = titleInputRef.current;
    const deadlineEl = deadlineInputRef.current;
    
    const titleValue = (titleEl?.value || form.title || "").trim();
    const deadlineValue = (deadlineEl?.value || form.deadline || "").trim();
    
    // Debug: log what we're checking
    console.log("Validation check:", {
      titleFromRef: titleEl?.value,
      titleFromState: form.title,
      titleValue,
      deadlineFromRef: deadlineEl?.value,
      deadlineFromState: form.deadline,
      deadlineValue,
      hasTitle: !!titleValue,
      hasDeadline: !!deadlineValue
    });
    
    if (!titleValue) {
      alert("Please enter a survey title");
      titleEl?.focus();
      return;
    }
    
    if (!deadlineValue) {
      alert("Please enter a deadline");
      deadlineEl?.focus();
      return;
    }
    
    // Validate that deadline is a valid date
    const deadlineDate = new Date(deadlineValue);
    if (isNaN(deadlineDate.getTime())) {
      alert("Please enter a valid deadline date and time");
      deadlineEl?.focus();
      return;
    }
    
    // Also check if deadline is in the past
    if (deadlineDate.getTime() < Date.now()) {
      alert("Deadline must be in the future");
      deadlineEl?.focus();
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
          title: titleValue,
          description: (form.description || "").trim(),
          deadline: deadlineValue,
          criteria: criteria.filter(c => c.label.trim()).map((c, index) => ({
            label: c.label.trim(),
            order: index + 1,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign survey");
      setForm({ title: "", description: "", deadline: "" });
      // Clear input refs to ensure they're reset
      if (titleEl) titleEl.value = "";
      if (deadlineEl) deadlineEl.value = "";
      setAssignments((prev) => [data.assignment, ...prev]);
      alert("✅ Survey assigned!");
    } catch (e: any) {
      console.error("Error assigning survey:", e);
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
              ref={titleInputRef}
              type="text"
              placeholder="Survey Title"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
              value={form.title}
              onChange={(e) => {
                const value = e.target.value;
                setForm(prev => ({ ...prev, title: value }));
              }}
            />
            <input
              ref={deadlineInputRef}
              type="datetime-local"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
              value={form.deadline}
              onChange={(e) => {
                const value = e.target.value;
                setForm(prev => ({ ...prev, deadline: value }));
              }}
            />
            <textarea
              placeholder="Optional Description"
              className="md:col-span-2 w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
              rows={3}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
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
              type="button"
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
          {assignments
            .filter((a) => !(isStudent && submittedMap[a.id]))
            .map((a) => (
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
              {/* REMOVED: Student response UI block */}
              {isStudent && a.status === 'open' && !submittedMap[a.id] && (
                <div className="mt-3">
                  <a 
                    href={`/projects/${projectId}/surveys/${a.id}`} 
                    className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm font-medium"
                  >
                    Go to Survey Page
                  </a>
                </div>
              )}
              {/* instructor view of responses removed */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}