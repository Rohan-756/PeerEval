"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthView from "../components/AuthView";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("auth");


  // Redirect to dashboard if user already logged in
  useEffect(() => {
    const saved = sessionStorage.getItem("peerEvalUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) router.push("/dashboard");
      } catch {
        console.warn("Failed to parse session user");
      }
    }
  }, [router]);

  const handlePasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Reset failed");
      else alert("Password reset link sent (check console)");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthView
      handlePasswordReset={handlePasswordReset}
      setIsLoading={setIsLoading}
      setUser={setUser}
      onAuthSuccess={() => router.push("/dashboard")}
      setView={setView}
    />
  );
}
