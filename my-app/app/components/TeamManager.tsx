"use client";

import React, { useState } from "react";

// This is the shape of the data from your new API route
interface Student {
  id: string;
  name: string | null;
  email: string;
}

// This is the shape of the existing team data
interface Team {
  id: string;
  name: string;
  members: { student: { name: string | null; email: string } }[];
}

// The props have been updated: 'invites' is replaced with 'availableStudents'
interface TeamManagerProps {
  projectId: string;
  availableStudents: Student[];
  existingTeams: Team[];
}

export default function TeamManager({
  projectId,
  availableStudents, // Using the new prop
  existingTeams,
}: TeamManagerProps) {
  const [draft, setDraft] = useState<string[]>([]);
  // This state holds the teams passed as props, plus any new ones created
  const [teams, setTeams] = useState(existingTeams);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (studentId: string) => {
    setDraft((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : prev.length < 4 // Limit team size to 4
        ? [...prev, studentId]
        : prev
    );
  };

  const handleConfirmTeam = async () => {
    if (draft.length === 0) {
      alert("Select at least one student.");
      return;
    }
    setLoading(true);
    try {
      // This API call to '/api/teams/create' is still correct
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, studentIds: draft }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`❌ ${data.error || "Failed to create team"}`);
        return;
      }

      // Add the new team to the 'teams' state to update the UI
      setTeams((prev) => [...prev, data]);
      setDraft([]); // Clear the selection
      alert("✅ Team created successfully!");
      
      // Note: After success, the 'availableStudents' list is now stale.
      // For a minimal implementation, we'll wait for a page refresh.
      // A full implementation would re-fetch the available students.

    } catch (err) {
      console.error(err);
      alert("❌ Could not create team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mb-10">
      {/* Create Team Section */}
      <div className="bg-white p-4 rounded-lg shadow border border-indigo-100">
        <h2 className="text-xl font-semibold text-indigo-700 mb-3">Form a Team</h2>
        <p className="text-gray-600 mb-4">
          Select up to 4 available students to form a new team.
        </p>

        {/* We now check 'availableStudents' directly */}
        {availableStudents.length === 0 ? (
          <p className="text-gray-500">
            No students are available to be assigned.
          </p>
        ) : (
          <ul className="space-y-2">
            {/* Map directly over 'availableStudents' */}
            {availableStudents.map((student) => {
              const isSelected = draft.includes(student.id);
              
              // We'll disable clicking on students who are already in the
              // 'teams' state, just as a client-side safety check
              // in case the list isn't refreshed.
              const isAlreadyInTeam = teams.some(team => 
                team.members.some(m => m.student.email === student.email)
              );

              if (isAlreadyInTeam) return null; // Don't show students just added

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
                    <span className="text-sm text-indigo-600 font-medium">
                      Selected
                    </span>
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

      {/* Existing Teams Section (This part remains unchanged) */}
      <div className="bg-white p-4 rounded-lg shadow border border-green-100">
        <h2 className="text-xl font-semibold text-green-700 mb-3">
          Existing Teams
        </h2>
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