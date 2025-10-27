"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, User, Users } from "lucide-react";
import StudentDashboard from "./StudentDashboard";
import InstructorDashboard from "./InstructorDashboard";
import Header from "../components/Header";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("peerEvalUser");
    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.id) setUser(parsed);
      else router.push("/auth");
    } catch {
      router.push("/auth");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("peerEvalUser");
    router.push("/");
  };

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <Header/>
      {/* Role-based dashboard */}
      {user.role === "student" ? (
        <StudentDashboard user={user} />
      ) : (
        <InstructorDashboard user={user} />
      )}
    </div>
  );
}
