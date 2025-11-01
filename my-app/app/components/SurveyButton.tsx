"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserType, RoleType } from "./types";
import { Plus } from "lucide-react";

interface SurveyButtonProps {
  projectId: string;
}

/**
 * Client component to display the Create Survey button only if the user is an instructor.
 * It checks the user role from sessionStorage.
 */
export default function SurveyButton({ projectId }: SurveyButtonProps) {
  const [userRole, setUserRole] = useState<RoleType | null>(null);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("peerEvalUser");
      if (storedUser) {
        const parsedUser: UserType = JSON.parse(storedUser);
        setUserRole(parsedUser.role);
      }
    } catch (err) {
      console.error("Failed to read user role from session.", err);
      // Fallback or redirection logic can be added here if needed
    }
  }, []);

  if (userRole !== "instructor") {
    // Hide the button if not an instructor (or loading)
    return null;
  }

  return (
    <div className="flex justify-end mb-4">
      <Link
        href={`/dashboard/${projectId}/create-survey`}
        className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition transform hover:scale-[1.02] shadow-lg"
      >
        <Plus className="w-5 h-5" />
        <span>Create New Survey</span>
      </Link>
    </div>
  );
}