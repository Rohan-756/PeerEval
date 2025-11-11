"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import PeerFeedbackView from './PeerFeedbackView';

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
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(false);
  const [whoRatedMe, setWhoRatedMe] = useState<any[]>([]);
  const [loadingWhoRatedMe, setLoadingWhoRatedMe] = useState(false);
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

  // Check submission status and completion status
  useEffect(() => {
    // Only proceed if the user is confirmed as a student and their ID is loaded
    if (!isStudent || !isUserLoaded) return; 
    
    const checkStatus = async () => {
      try {
        // Check if user has submitted
        const statusRes = await fetch(`/api/surveys/${assignment.id}/my-status?respondentId=${currentUser.id}`);
        const statusData = await statusRes.json();
        setIsSubmitted(!!statusData.submitted);

        // If user has submitted, check if all team members have submitted
        if (statusData.submitted) {
          setCheckingCompletion(true);
          try {
            const completionRes = await fetch(
              `/api/surveys/${assignment.id}/completion-status?studentId=${currentUser.id}`
            );
            const completionData = await completionRes.json();
            if (completionRes.ok) {
              setAllSubmitted(completionData.allSubmitted || false);
            }
          } catch (e) {
            console.error("Error checking completion:", e);
          } finally {
            setCheckingCompletion(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkStatus();
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

  // Load who has rated this student
  useEffect(() => {
    if (!isStudent || !isUserLoaded || !assignment.id) return;
    
    const loadWhoRatedMe = async () => {
      try {
        setLoadingWhoRatedMe(true);
        const res = await fetch(
          `/api/surveys/${assignment.id}/who-rated-me?targetStudentId=${currentUser.id}`
        );
        const data = await res.json();
        if (res.ok) {
          setWhoRatedMe(data.respondents || []);
        }
      } catch (e) {
        console.error("Error loading who rated me:", e);
      } finally {
        setLoadingWhoRatedMe(false);
      }
    };
    
    loadWhoRatedMe();
    // Refresh periodically to check for new ratings
    const interval = setInterval(loadWhoRatedMe, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [isStudent, isUserLoaded, currentUser?.id, assignment.id]);

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
        // Check completion status after submission
        try {
          const completionRes = await fetch(
            `/api/surveys/${assignment.id}/completion-status?studentId=${currentUser.id}`
          );
          const completionData = await completionRes.json();
          if (completionRes.ok) {
            setAllSubmitted(completionData.allSubmitted || false);
            // If all submitted, stay on page to show feedback, otherwise go to dashboard
            if (!completionData.allSubmitted) {
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        } catch (e) {
          console.error("Error checking completion:", e);
          router.push('/dashboard');
        } 
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
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{assignment.survey.title}</h1>
          <h2 className="text-xl text-gray-600">Project: {assignment.projectTitle}</h2>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-semibold">✅ Your responses for this survey have already been submitted.</p>
        </div>

        {/* Information Box for Submitted View */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Who You Rated:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {myTeam.length === 0 ? (
                  <li className="text-gray-500">No team members</li>
                ) : (
                  myTeam.map((member) => (
                    <li key={member.studentId}>
                      ✓ {(member.student?.name && member.student.name.trim()) || member.student?.email}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-indigo-800 mb-2">Submission Status:</h3>
              {loadingWhoRatedMe ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : whoRatedMe.length === 0 ? (
                <p className="text-sm text-gray-500">No one has rated you yet</p>
              ) : (
                <div className="text-sm text-indigo-700">
                  <p className="mb-1">{whoRatedMe.length} team member(s) have submitted feedback about you.</p>
                  <p className="text-xs text-gray-600 italic">Feedback is anonymized to maintain confidentiality.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {checkingCompletion ? (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-500">Checking if all team members have submitted...</p>
          </div>
        ) : allSubmitted ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 font-semibold">
                🎉 All team members have submitted! You can now view the feedback you received.
              </p>
            </div>
            <PeerFeedbackView
              assignmentId={assignment.id}
              targetStudentId={currentUser.id}
              criteria={assignment.survey.criteria}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">
              ⏳ Waiting for all team members to submit their responses. Once everyone has submitted, you'll be able to view the feedback you received.
            </p>
          </div>
        )}
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
          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Who You Are Rating:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  {myTeam.length === 0 ? (
                    <li className="text-gray-500">No team members to rate</li>
                  ) : (
                    myTeam.map((member) => (
                      <li key={member.studentId}>
                        • {(member.student?.name && member.student.name.trim()) || member.student?.email}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-800 mb-2">Submission Status:</h3>
                {loadingWhoRatedMe ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : whoRatedMe.length === 0 ? (
                  <p className="text-sm text-gray-500">No one has rated you yet</p>
                ) : (
                  <div className="text-sm text-indigo-700">
                    <p>{whoRatedMe.length} team member(s) have submitted feedback.</p>
                    <p className="text-xs text-gray-600 italic mt-1">Feedback will be anonymized when viewing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="font-medium text-lg border-b pb-2">Evaluate Your Team Members (excluding yourself)</div>
          
          <div className="space-y-6">
            {myTeam.map((member) => (
              <div key={member.studentId} className="border border-indigo-200 rounded-lg p-4 shadow-sm bg-indigo-50">
                <div className="text-lg font-bold text-indigo-700 mb-3">For: {(member.student?.name && member.student.name.trim()) || member.student?.email}</div>
                
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