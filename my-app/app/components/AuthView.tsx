"use client";
import React, { useState } from "react";
import Header from "./Header";

export default function AuthView({handlePasswordReset, setView, setIsLoading, setUser, onAuthSuccess }: any) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Please fill email and password");
    handleAuthAction(isRegistering ? "register" : "login", email, password, isRegistering ? role : undefined);
  };

  const handleResetClick = () => {
    const inputEmail = prompt("Enter your email to request a password reset:");
    if (inputEmail) handlePasswordReset(inputEmail);
  };

  // AuthView.tsx (only the handleAuthAction part shown — replace your existing handler)
const handleAuthAction = async (action: 'register' | 'login', email?: string, password?: string, role?: 'student' | 'instructor') => {
  setIsLoading(true);
  try {
    const res = await fetch(`/api/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Authentication failed');
      return;
    }

    // Expect server to return { user: { id, email, role } }
    const fullUser = data.user ?? { id: data.userId, email, role: data.role ?? role ?? 'student' };

    // update top-level user state immediately
    setUser((prev: any) => ({ ...prev, ...fullUser }));

    // store full user object as JSON so reload picks it up immediately
    sessionStorage.setItem('peerEvalUser', JSON.stringify(fullUser));
    if (onAuthSuccess) onAuthSuccess();    
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <>
    <Header user={{id:'', email:'', role:'student'}} onLogout={()=>{}}/>

    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-indigo-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {isRegistering ? "Register Account" : "Login Account"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded mb-4"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded mb-4"
          />

          {isRegistering && (
            <div className="mb-4">
              <span className="block text-gray-700 mb-2 font-semibold">Role</span>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`px-4 py-2 rounded-full font-semibold transition ${
                    role === "student"
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-indigo-100"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("instructor")}
                  className={`px-4 py-2 rounded-full font-semibold transition ${
                    role === "instructor"
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-indigo-100"
                  }`}
                >
                  Instructor
                </button>
              </div>
            </div>
          )}

          {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}

          <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded">
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <div className="mt-4 flex flex-col space-y-2 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-indigo-600 font-semibold"
          >
            {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
          </button>

          {!isRegistering && (
            <button
              onClick={handleResetClick}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Forgot Password?
            </button>
          )}

          <button
            onClick={() => setView("home")}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            &larr; Back to Home
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
