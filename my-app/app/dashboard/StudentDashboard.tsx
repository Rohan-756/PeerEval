"use client";
import React from "react";

export default function StudentDashboard({ user }: { user: any }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
        Welcome, {user.email} (Student)
      </h2>

      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-600">
          Here you can view your assigned projects, submit peer reviews, and
          check your feedback.
        </p>
        {/* Your student-specific components here */}
      </div>
    </div>
  );
}
