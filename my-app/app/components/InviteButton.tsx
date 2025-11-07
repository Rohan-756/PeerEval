"use client";
import React, { useEffect, useState } from "react";

interface InviteButtonProps {
  projectId: string;
  instructorId: string;
}

export default function InviteButton({ projectId, instructorId }: InviteButtonProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("peerEvalUser");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const isInstructorOwner = currentUser?.role === "instructor" && currentUser?.id === instructorId;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      alert("Please enter a student email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          studentEmail: inviteEmail.trim(),
          instructorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      alert("✅ Invite sent successfully!");
      setInviteEmail("");
      setShowModal(false);
      // Optionally reload the page to show the new invite
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error sending invite");
    } finally {
      setLoading(false);
    }
  };

  // Only show the button if the current user is the instructor owner
  if (!isInstructorOwner) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
      >
        Invite Student
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Invite Student to Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-200"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleInvite();
                    }
                  }}
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setInviteEmail("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

