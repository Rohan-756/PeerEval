"use client";
import React, { useState, useEffect } from "react";

export default function StudentDashboard({ user }: { user: any }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveysByProject, setSurveysByProject] = useState<Record<string, any[]>>({});

  // ✅ Fetch invites for this student
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await fetch(`/api/projects/list?userId=${user.id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load invites");

        // The /api/projects/list route already supports student role,
        // returning `invites` instead of `projects`.
        const formattedInvites = data.projects.map((i: any) => ({
          id: i.id,
          projectId: i.project.id,
          projectTitle: i.project.title,
          projectDescription: i.project.description,
          instructorName: i.project.instructor?.name || i.project.instructor?.email,
          status: i.status,
        }));

        setInvites(formattedInvites);
      } catch (err) {
        console.error("Error loading invites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, [user.id]);

  // 🆕 Load surveys for accepted projects
  useEffect(() => {
    const load = async () => {
      const accepted = invites.filter((i) => i.status === "accepted");
      await Promise.all(
        accepted.map(async (p) => {
          try {
            const res = await fetch(`/api/projects/${p.projectId}/surveys`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load surveys");
            setSurveysByProject((prev) => ({ ...prev, [p.projectId]: data.assignments || [] }));
          } catch (e) {
            console.error(e);
          }
        })
      );
    };
    if (invites.length) load();
  }, [invites]);

  // ✅ Accept or reject invite
  const handleRespond = async (inviteId: string, status: "accepted" | "rejected") => {
    try {
      const res = await fetch("/api/invites/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, status, studentId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to respond to invite");

      // Update invite in state
      setInvites((prev) =>
        prev.map((i) =>
          i.id === inviteId ? { ...i, status: data.invite.status } : i
        )
      );
    } catch (err) {
      console.error(err);
      alert("Error responding to invite");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading your projects...
      </div>
    );
  }

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const acceptedProjects = invites.filter((i) => i.status === "accepted");

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold text-indigo-700">
        Welcome, {user.email} (Student)
      </h2>

      {/* ─── Accepted Projects ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <h3 className="text-xl font-bold mb-4">Accepted Projects</h3>
        {acceptedProjects.length === 0 ? (
          <p className="text-gray-500">No accepted projects yet.</p>
        ) : (
          <ul className="space-y-3">
            {acceptedProjects.map((p) => (
              <li
                key={p.id}
                className="p-4 border border-green-300 bg-green-50 rounded-lg"
              >
                <h4 className="font-semibold text-gray-800">{p.projectTitle}</h4>
                <p className="text-sm text-gray-600">{p.projectDescription}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Instructor: {p.instructorName}
                </p>
                <div className="mt-3">
                  <div className="font-medium">Assigned Surveys</div>
                  {!(surveysByProject[p.projectId]?.length) ? (
                    <p className="text-sm text-gray-600">No surveys yet.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {surveysByProject[p.projectId].map((a) => (
                        <li key={a.id} className="text-sm flex items-center justify-between">
                          <span>{a.survey?.title}</span>
                          <span className="text-xs text-gray-600">Due {new Date(a.deadline).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Pending Invites ─────────────────────────────── */}
      <section className="bg-white shadow rounded-lg p-6 border border-indigo-100">
        <h3 className="text-xl font-bold mb-4">Pending Invites</h3>
        {pendingInvites.length === 0 ? (
          <p className="text-gray-500">No pending invites right now.</p>
        ) : (
          <ul className="space-y-3">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {invite.projectTitle}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {invite.projectDescription}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Instructor: {invite.instructorName}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRespond(invite.id, "accepted")}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(invite.id, "rejected")}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
