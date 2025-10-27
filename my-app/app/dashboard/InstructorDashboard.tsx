"use client";
import React from "react";

export default function InstructorDashboard({ user }: { user: any }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
        Welcome, {user.email} (Instructor)
      </h2>

      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-600">
          Here you can manage student projects, assign teams, and review reports.
        </p>
        {/* Your instructor-specific components here */}
      </div>
    </div>
  );
}
