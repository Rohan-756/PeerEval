"use client";

import React, { useState } from "react";

interface TeamSelectorProps {
  acceptedStudents: { id: string; name: string | null; email: string }[];
  projectId: string;
}

export default function TeamSelector({ acceptedStudents, projectId }: TeamSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const maxSize = 4;

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < maxSize
        ? [...prev, id]
        : prev // ignore if already 4 selected
    );
  };

  const handleFormTeam = async () => {
    if (selected.length === 0) {
      alert("Select at least one student to form a team.");
      return;
    }

    // Example: API call to save team
    try {
      const res = await fetch(`/api/teams/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, studentIds: selected }),
      });
      if (!res.ok) throw new Error("Failed to form team");

      alert("✅ Team created successfully!");
      setSelected([]);
    } catch (err) {
      console.error(err);
      alert("❌ Could not form team.");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-indigo-100 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        Form a Team (Select up to 4 students)
      </h2>

      {acceptedStudents.length === 0 ? (
        <p className="text-gray-500">No accepted students yet.</p>
      ) : (
        <ul className="space-y-2">
          {acceptedStudents.map((s) => {
            const isSelected = selected.includes(s.id);
            return (
              <li
                key={s.id}
                onClick={() => toggleSelect(s.id)}
                className={`flex justify-between items-center cursor-pointer border-b pb-2 px-2 rounded-md ${
                  isSelected
                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                    : "hover:bg-gray-50"
                }`}
              >
                <span>{s.name || s.email}</span>
                {isSelected && (
                  <span className="text-sm text-indigo-600 font-medium">Selected</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        onClick={handleFormTeam}
        disabled={selected.length === 0}
        className={`mt-4 w-full py-2 rounded-lg font-semibold transition ${
          selected.length > 0
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
      >
        Form Team ({selected.length}/{maxSize})
      </button>
    </div>
  );
}
