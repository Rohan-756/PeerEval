"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CompletionStatus {
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  teamName: string;
  expectedSubmissions: number;
  completedSubmissions: number;
  completionPercentage: number;
  isComplete: boolean;
}

interface AggregatedResult {
  criterionId: string;
  criterionLabel: string;
  averageRating: number;
  totalResponses: number;
  ratings: number[];
  responses: Array<{
    respondentName: string;
    targetStudentName: string;
    rating: number;
    text: string;
  }>;
}

interface SurveyResults {
  assignment: {
    id: string;
    survey: {
      id: string;
      title: string;
      description: string | null;
      criteria: Array<{
        id: string;
        label: string;
        minRating: number;
        maxRating: number;
      }>;
    };
    deadline: string;
    status: string;
  };
  completionStatus: CompletionStatus[];
  aggregatedResults: AggregatedResult[];
  overallStats: {
    totalStudents: number;
    completedStudents: number;
    overallCompletionPercentage: number;
    totalResponses: number;
  };
}

export default function SurveyResultsView({
  projectId,
  assignmentId,
  projectTitle,
  instructorId,
}: {
  projectId: string;
  assignmentId: string;
  projectTitle: string;
  instructorId: string;
}) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem("peerEvalUser");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        // Check if user is the instructor
        if (user.role !== "instructor" || user.id !== instructorId) {
          setError("You don't have permission to view this page");
          setLoading(false);
          return;
        }
      } catch (e) {
        setError("Failed to load user");
        setLoading(false);
        return;
      }
    } else {
      setError("Please log in to view this page");
      setLoading(false);
      return;
    }
  }, [instructorId]);

  useEffect(() => {
    if (currentUser && currentUser.role === "instructor" && currentUser.id === instructorId) {
      loadResults();
    }
  }, [currentUser, assignmentId, instructorId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/surveys/${assignmentId}/results`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load results");
      setResults(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load survey results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading survey results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mt-4 text-indigo-600 hover:underline"
        >
          ← Back to Project
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-indigo-600 hover:underline mb-2 text-sm"
          >
            ← Back to Project
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{results.assignment.survey.title}</h1>
          <p className="text-lg text-gray-600 mt-1">Project: {projectTitle}</p>
          {results.assignment.survey.description && (
            <p className="text-gray-700 mt-2">{results.assignment.survey.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Deadline: {new Date(results.assignment.deadline).toLocaleString()}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            results.assignment.status === "open"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {results.assignment.status}
        </span>
      </div>

      {/* Overall Statistics */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Overall Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {results.overallStats.completedStudents} / {results.overallStats.totalStudents}
            </div>
            <div className="text-sm text-gray-600">Students Completed</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {results.overallStats.overallCompletionPercentage}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {results.overallStats.totalResponses}
            </div>
            <div className="text-sm text-gray-600">Total Responses</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {results.aggregatedResults.length}
            </div>
            <div className="text-sm text-gray-600">Criteria</div>
          </div>
        </div>
      </div>

      {/* Completion Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Completion Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Student</th>
                <th className="text-left p-2">Team</th>
                <th className="text-center p-2">Completed</th>
                <th className="text-center p-2">Expected</th>
                <th className="text-center p-2">Progress</th>
                <th className="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.completionStatus.map((status) => (
                <tr key={status.studentId} className="border-b">
                  <td className="p-2">
                    <div className="font-medium">
                      {status.studentName || status.studentEmail}
                    </div>
                    {status.studentName && (
                      <div className="text-xs text-gray-500">{status.studentEmail}</div>
                    )}
                  </td>
                  <td className="p-2">{status.teamName}</td>
                  <td className="text-center p-2">{status.completedSubmissions}</td>
                  <td className="text-center p-2">{status.expectedSubmissions}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status.isComplete ? "bg-green-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${status.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12">
                        {status.completionPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        status.isComplete
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {status.isComplete ? "Complete" : "In Progress"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aggregated Results by Criterion */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Aggregated Results by Criterion</h2>
        {results.aggregatedResults.map((result) => (
          <div key={result.criterionId} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{result.criterionLabel}</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {result.averageRating.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {result.totalResponses}
                  </div>
                  <div className="text-xs text-gray-600">Responses</div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            {result.ratings.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Rating Distribution</div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const count = result.ratings.filter((r) => r === rating).length;
                    const percentage = (count / result.ratings.length) * 100;
                    return (
                      <div key={rating} className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>{rating}</span>
                          <span>{count}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Responses */}
            {result.responses.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Individual Responses</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.responses.map((response, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {response.respondentName} → {response.targetStudentName}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                          Rating: {response.rating}
                        </span>
                      </div>
                      {response.text && (
                        <p className="text-sm text-gray-600 mt-1">{response.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.responses.length === 0 && (
              <p className="text-gray-500 text-sm italic">No responses yet for this criterion</p>
            )}
          </div>
        ))}
      </div>

      {results.aggregatedResults.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">No aggregated results available yet</p>
        </div>
      )}
    </div>
  );
}

