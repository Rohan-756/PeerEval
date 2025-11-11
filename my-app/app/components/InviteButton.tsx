"use client";
import React, { useState, useEffect } from 'react';

interface InviteButtonProps {
    projectId: string;
    instructorId: string;
}

export default function InviteButton({ projectId, instructorId }: InviteButtonProps) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => {
        const saved = sessionStorage.getItem("peerEvalUser");
        if (saved) {
            const user = JSON.parse(saved);
            setCurrentUserId(user.id);
            // Check if logged-in user is the instructor for this project
            if (user.role === 'instructor' && user.id === instructorId) {
                setIsAuthorized(true);
            }
        }
    }, [instructorId]);

    const handleInvite = async () => {
        const email = prompt("Enter student email to invite to this project:");
        if (!email || email.trim() === "") return;

        try {
            const res = await fetch("/api/invites/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    projectId, 
                    studentEmail: email, 
                    instructorId: currentUserId // Use fetched ID
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to send invite.");
            }

            alert(`✅ Invitation sent successfully to ${email}.`);
            // Force a page refresh to update the list of invited students
            window.location.reload(); 
            
        } catch (e: any) {
            console.error("Invite Error:", e);
            alert(`❌ Failed to send invite: ${e.message}`);
        }
    };

    if (!isAuthorized) {
        return null;
    }

    return (
        <button
            onClick={handleInvite}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
            Invite Student
        </button>
    );
}