"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

// Simplified types for the component, consistent with the rest of the app's implicit structure
interface SurveyCriterion {
  id: string;
  label: string;
  minRating: number;
  maxRating: number;
}
interface Survey {
  title: string;
  description: string | null;
  criteria: SurveyCriterion[];
}
interface SurveyAssignmentDetails {
  id: string;
  deadline: string;
  status: string;
  survey: Survey;
  projectTitle: string;
}

export default function StudentSurveyResponse({ assignment, projectId }: { assignment: SurveyAssignmentDetails; projectId: string; }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // responses[memberId][criterionId] = { text: string, rating: number }
  const [responses, setResponses] = useState<Record<string, Record<string, { text: string; rating: number }>>>({});

  const isStudent = currentUser?.role === "student";
  // Derived state to track if user data is successfully loaded from session storage
  const isUserLoaded = !!currentUser?.id; 

  useEffect(() => {
    const saved = sessionStorage.getItem("peerEvalUser");
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Check submission status
  useEffect(() => {
    // Only proceed if the user is confirmed as a student and their ID is loaded
    if (!isStudent || !isUserLoaded) return; 
    
    const checkSubmitted = async () => {
      try {
        const res = await fetch(`/api/surveys/${assignment.id}/my-status?respondentId=${currentUser.id}`);
        const data = await res.json();
        setIsSubmitted(!!data.submitted);
      } catch (e) {
        console.error(e);
      }
    };
    checkSubmitted();
  }, [assignment.id, isStudent, isUserLoaded, currentUser?.id]);

  // Load current student's team members for text responses
  useEffect(() => {
    // Only proceed if the user is confirmed as a student and their ID is loaded
    if (!isStudent || !isUserLoaded) return; 
    
    const loadTeam = async () => {
      try {
        setLoadingTeam(true);
        const res = await fetch(`/api/projects/${projectId}/my-team?studentId=${currentUser.id}`);
        const data = await res.json();
        if (res.ok) {
            // Filter out self. Note: The API route should return `studentId` on members.
            setMyTeam((data.members || []).filter((m: any) => m.studentId !== currentUser.id));
        }
      } catch {
      } finally {
        setLoadingTeam(false);
      }
    };
    loadTeam();
  }, [isStudent, isUserLoaded, currentUser?.id, projectId]);

  const handleSubmit = async () => {
    
    // CRITICAL FIX: Explicit check to ensure IDs are present before submission
    if (!assignment.id || !currentUser?.id || !projectId) {
        alert("System Error: Required user or assignment data is missing. Please refresh the page.");
        return;
    }

    // Basic validation: ensure responses can be submitted
    if (myTeam.length === 0) {
        alert("Cannot submit responses if you are not in a team.");
        return;
    }
    
    const teamMemberIds = myTeam.map(m => m.studentId);
    const hasAnyResponse = teamMemberIds.some(id => responses.hasOwnProperty(id));

    if (!hasAnyResponse) {
        alert("Please fill out at least one response before submitting.");
        return;
    }
    
    setSubmitting(true);
    try {
        const res = await fetch('/api/surveys/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assignmentId: assignment.id,
                respondentId: currentUser.id,
                projectId,
                answers: responses,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit');
        alert('✅ Responses submitted!');
        setIsSubmitted(true);
        router.push('/dashboard'); 
    } catch (e: any) {
        alert(e.message || 'Error submitting');
    } finally {
        setSubmitting(false);
    }
  };

  if (!isUserLoaded) { 
    return <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Survey Response</h1>
        <p className="text-gray-500">Loading user data...</p>
    </div>;
  }
  
  if (!isStudent) {
    return <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Survey Response</h1>
        <p className="text-red-500">You must be logged in as a student to view this page.</p>
    </div>;
  }
  
  if (assignment.status !== 'open') {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{assignment.survey.title}</h1>
            <p className="text-orange-500">This survey is currently **{assignment.status}**. You cannot submit responses.</p>
        </div>
    );
  }
  
  if (isSubmitted) {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{assignment.survey.title}</h1>
            <p className="text-green-500 font-semibold">✅ Your responses for this survey have already been submitted.</p>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{assignment.survey.title}</h1>
      <h2 className="text-xl text-gray-600">Project: {assignment.projectTitle}</h2>
      {assignment.survey.description && (
        <p className="text-gray-700">{assignment.survey.description}</p>
      )}
      <p className="text-sm text-gray-500">Deadline: {new Date(assignment.deadline).toLocaleString()}</p>

      {loadingTeam ? (
        <p className="text-gray-500">Loading your team...</p>
      ) : myTeam.length === 0 ? (
        <p className="text-sm text-red-500 p-3 border border-red-200 bg-red-50 rounded">
          You are not assigned to a team yet for this project. Ask your instructor to add you to a team to respond.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="font-medium text-lg border-b pb-2">Evaluate Your Team Members (excluding yourself)</div>
          
          <div className="space-y-6">
            {myTeam.map((member) => (
              <div key={member.studentId} className="border border-indigo-200 rounded-lg p-4 shadow-sm bg-indigo-50">
                <div className="text-lg font-bold text-indigo-700 mb-3">For: {member.student?.name || member.student?.email}</div>
                
                <div className="space-y-4">
                  {assignment.survey.criteria.map((c: SurveyCriterion) => (
                    <div key={c.id} className="border-t pt-3">
                      <div className="text-md font-semibold text-gray-700 mb-1">{c.label}</div>
                      
                      {/* Text Input */}
                      <textarea
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring focus:ring-indigo-200"
                        placeholder="Provide text feedback..."
                        rows={2}
                        value={responses[member.studentId]?.[c.id]?.text || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setResponses((prev) => ({
                            ...prev,
                            [member.studentId]: { 
                                ...(prev[member.studentId] || {}), 
                                [c.id]: { 
                                    ...(prev[member.studentId]?.[c.id] || { rating: 3, text: '' }), 
                                    text: v 
                                } 
                            },
                          }));
                        }}
                      />
                      
                      {/* Rating Input */}
                      <div className="mt-2 flex items-center">
                        <label className="text-sm text-gray-600 font-medium mr-3">Rating ({c.minRating}-{c.maxRating})</label>
                        <select
                          className="border border-gray-300 rounded p-1 text-sm focus:ring focus:ring-indigo-200"
                          value={responses[member.studentId]?.[c.id]?.rating ?? Math.ceil((c.minRating + c.maxRating) / 2)}
                          onChange={(e) => {
                            const v = parseInt(e.target.value || '3', 10);
                            setResponses((prev) => ({
                              ...prev,
                              [member.studentId]: { 
                                ...(prev[member.studentId] || {}), 
                                [c.id]: { 
                                    ...(prev[member.studentId]?.[c.id] || { text: '' }), 
                                    rating: v 
                                } 
                              },
                            }));
                          }}
                        >
                          {Array.from({ length: c.maxRating - c.minRating + 1 }, (_, i) => c.minRating + i).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <button
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
              onClick={handleSubmit}
              // Disabled if user is not loaded, no team, or already submitting
              disabled={!isUserLoaded || myTeam.length === 0 || submitting}
            >
              {submitting ? "Submitting..." : "Submit Peer Responses"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}