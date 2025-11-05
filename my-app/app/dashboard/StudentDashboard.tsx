"use client";
import React, { useState, useEffect } from "react";

// Define a type for the team member object for clarity
type TeamMember = {
  id: string;
  name?: string;
  email: string;
};

// Update the type for an Invite to include teamMembers
type FormattedInvite = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  instructorName: string;
  status: "pending" | "accepted" | "rejected";
  teamMembers?: TeamMember[]; // Added teamMembers
};

export default function StudentDashboard({ user }: { user: any }) {
  const [invites, setInvites] = useState<FormattedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveysByProject, setSurveysByProject] = useState<Record<string, any[]>>({});

  // ✅ Fetch invites for this student
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await fetch(`/api/projects/list?userId=${user.id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load invites");

        const formattedInvites = data.projects.map((i: any) => ({
          id: i.id,
          projectId: i.project.id,
          projectTitle: i.project.title,
          projectDescription: i.project.description,
          instructorName: i.project.instructor?.name || i.project.instructor?.email,
          status: i.status,
          // 🆕 REVISED: Extract team members from the project's first team's members array
          // Your API returns: project.teams[].members[].student
          teamMembers: (i.project.teams?.[0]?.members || [])
            .map((member: any) => ({
              id: member.student.id,
              name: member.student.name,
              email: member.student.email,
            })),
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

  // 🆕 Load surveys for accepted projects (Unchanged)
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
    // Only load surveys if we have loaded invites
    if (invites.length > 0 && acceptedProjects.length > 0) load();
  }, [invites]);

  // ✅ Accept or reject invite (Unchanged)
  const handleRespond = async (inviteId: string, status: "accepted" | "rejected") => {
    // Note: Do not use alert() in production apps, use custom modals for user feedback
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
      // Fallback for demonstration
      console.log("Error responding to invite. Check console for details.");
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
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold text-indigo-700 border-b pb-2">
        Welcome, {user.name || user.email} (Student Dashboard)
      </h2>

      {/* ─── Accepted Projects ─────────────────────────────── */}
      <section className="bg-white shadow-xl rounded-xl p-6 border border-indigo-200">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Accepted Projects
        </h3>
        {acceptedProjects.length === 0 ? (
          <p className="text-gray-500 italic">No accepted projects yet. Accept an invitation below!</p>
        ) : (
          <ul className="space-y-6">
            {acceptedProjects.map((p) => (
              <li
                key={p.id}
                className="p-4 border border-green-300 bg-green-50 rounded-lg shadow-sm transition-all hover:shadow-md"
              >
                
                {/* 🆕 Split layout for Project Details (Left) and Team Members (Right) */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    
                    {/* LEFT SIDE: Project Details (Takes up approx 60% of space on desktop) */}
                    <div className="flex-1 md:w-3/5">
                        <h4 className="font-extrabold text-xl text-gray-800">{p.projectTitle}</h4>
                        <p className="text-sm text-gray-600 mb-2">{p.projectDescription}</p>
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Instructor:</span> {p.instructorName}
                        </p>
                    </div>

                    {/* RIGHT SIDE: Team Members (Takes up approx 40% of space on desktop) */}
                    <div className="md:w-2/5 border-t md:border-t-0 md:border-l border-green-200 md:pl-4 pt-4 md:pt-0">
                        <div className="font-semibold text-sm text-gray-700 mb-1">Team Members ({p.teamMembers?.length})</div>
                        <ul className="text-sm text-gray-600 space-y-0.5 list-disc">
                            {p.teamMembers?.map((member) => (
                                <li key={member.id} className="ml-4 truncate">
                                    {member.name || member.email} 
                                    {member.id === user.id && <span className="text-indigo-600 font-bold ml-1">(You)</span>}
                                </li>
                            )) || <li className="ml-4">Error loading team members.</li>}
                        </ul>
                    </div>
                </div>

                {/* Display Assigned Surveys (Full width below the two columns) */}
                <div className="mt-4 pt-3 border-t border-green-200">
                  <div className="font-semibold text-sm text-gray-700 mb-2">Assigned Surveys</div>
                  {!(surveysByProject[p.projectId]?.length) ? (
                    <p className="text-sm text-gray-500 italic">No surveys assigned for this project yet.</p>
                  ) : (
                    <ul className="mt-1 space-y-2">
                      {surveysByProject[p.projectId].map((a) => (
                        <li key={a.id} className="text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-white rounded-md border border-green-100">
                          <div className="flex items-center gap-3 font-medium">
                            <span className="text-gray-800">{a.survey?.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 sm:mt-0">
                            <span className="text-xs text-gray-600">Due {new Date(a.deadline).toLocaleString()}</span>
                            <a href={`/projects/${p.projectId}/surveys/${a.id}`} className="text-indigo-700 font-semibold hover:text-indigo-900 transition-colors bg-indigo-100 px-2 py-0.5 rounded-full">
                                Start Survey
                            </a>
                          </div>
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
      <section className="bg-white shadow-xl rounded-xl p-6 border border-indigo-200">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-yellow-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Pending Invites
        </h3>
        {pendingInvites.length === 0 ? (
          <p className="text-gray-500 italic">No pending invitations right now.</p>
        ) : (
          <ul className="space-y-4">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm"
              >
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-semibold text-lg text-gray-800">
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
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(invite.id, "rejected")}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors shadow-md"
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