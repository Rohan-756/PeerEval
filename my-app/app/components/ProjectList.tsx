"use client";
import React from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string | Date;
};

export default function ProjectList({
  projects,
  limit,
  showCreateTeam,
  showInvite,
  emptyMessage = "No projects yet.",
}: {
  projects: Project[];
  limit?: number;
  showCreateTeam?: boolean;
  showInvite?: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const items = (limit ? projects.slice(0, limit) : projects) || [];

  if (!items.length) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  const handleInvite = async (projectId: string) => {
    try {
      const email = prompt("Enter student email to invite:");
      if (!email) return;
      const saved = sessionStorage.getItem("peerEvalUser");
      if (!saved) {
        alert("You must be logged in to send invites.");
        return;
      }
      const user = JSON.parse(saved);
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, studentEmail: email, instructorId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      alert(`Invite sent to ${email}`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to send invite");
    }
  };

  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <li
          key={p.id}
          className="p-4 border rounded-lg flex justify-between items-center transition cursor-pointer border-gray-200 hover:bg-gray-50"
          onClick={() => router.push(`/projects/${p.id}`)}
        >
          <div>
            <h4 className="font-semibold text-gray-800">{p.title}</h4>
            {p.description ? (
              <p className="text-sm text-gray-600">{p.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {showInvite ? (
              <button
                className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInvite(p.id);
                }}
              >
                Invite Student
              </button>
            ) : null}
            {showCreateTeam ? (
              <button
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/${p.id}`);
                }}
              >
                Create Team
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}


