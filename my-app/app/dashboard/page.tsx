"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "../components/Dashboard";
import { LogIn, User, Users } from "lucide-react";

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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="flex justify-between items-center p-4 bg-white border-b shadow-md sticky top-0 z-10">
        <h1
          onClick={() => router.push("/dashboard")}
          className="text-3xl font-bold text-indigo-700 cursor-pointer"
        >
          PeerEval
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm font-medium text-gray-600 rounded-full bg-indigo-100 px-3 py-1">
            <User className="w-4 h-4 mr-2" />
            {user.email}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center"
          >
            <Users className="w-5 h-5 inline mr-1" /> Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition"
          >
            <LogIn className="w-5 h-5 mr-1" /> Logout
          </button>
        </div>
      </header>

      <Dashboard user={user} />
    </div>
  );
}
