"use client";

import React, { useState } from "react";

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Invite {
  student: Student;
  status: string;
}

interface Team {
  id: string;
  name: string;
  members: { student: { name: string | null; email: string } }[];
}

interface TeamManagerProps {
  projectId: string;
  invites: Invite[];
  existingTeams: Team[];
}

export default function TeamManager({ projectId, invites, existingTeams }: TeamManagerProps) {
  const [draft, setDraft] = useState<string[]>([]);
  const [teams, setTeams] = useState(existingTeams);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (studentId: string) => {
    setDraft((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : prev.length < 4
        ? [...prev, studentId]
        : prev
    );
  };

  const handleConfirmTeam = async () => {
    if (draft.length === 0) {
      alert("Select at least one accepted student.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, studentIds: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");

      setTeams((prev) => [...prev, data]);
      setDraft([]);
      alert("✅ Team created successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Could not create team.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fix: check invite.status, not student.status
  const acceptedInvites = invites.filter((i) => i.status === "accepted");

  return (
    <div className="space-y-6 mb-10">
      {/* Create Team Section */}
      <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
        <h2 className="text-xl font-semibold text-indigo-700 mb-3">Form a Team</h2>
        <p className="text-gray-600 mb-4">Select up to 4 accepted students to form a team.</p>

        {acceptedInvites.length === 0 ? (
          <p className="text-gray-500">No accepted students yet.</p>
        ) : (
          <ul className="space-y-2">
            {acceptedInvites.map(({ student }) => {
              const isSelected = draft.includes(student.id);
              return (
                <li
                  key={student.id}
                  onClick={() => toggleSelect(student.id)}
                  className={`flex justify-between items-center cursor-pointer border-b pb-2 px-2 rounded-md ${
                    isSelected
                      ? "bg-indigo-100 text-indigo-700 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span>{student.name || student.email}</span>
                  {isSelected && (
                    <span className="text-sm text-indigo-600 font-medium">Selected</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={handleConfirmTeam}
          disabled={draft.length === 0 || loading}
          className={`mt-4 w-full py-2 rounded-lg font-semibold transition ${
            draft.length > 0 && !loading
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {loading ? "Creating..." : `Confirm Team (${draft.length}/4)`}
        </button>
      </div>

      {/* Existing Teams Section */}
      <div className="bg-white p-4 rounded-lg shadow border border-green-100">
        <h2 className="text-xl font-semibold text-green-700 mb-3">Existing Teams</h2>
        {teams.length === 0 ? (
          <p className="text-gray-500">No teams have been created yet.</p>
        ) : (
          <ul className="space-y-3">
            {teams.map((team) => (
              <li
                key={team.id}
                className="border-b pb-2 px-2 rounded-md hover:bg-gray-50"
              >
                <p className="font-semibold text-gray-800">{team.name}</p>
                <ul className="text-sm text-gray-600 ml-4 mt-1 list-disc">
                  {team.members.map((m, idx) => (
                    <li key={idx}>{m.student.name || m.student.email}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
