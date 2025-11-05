"use client";
import React, { useEffect, useState } from "react";

interface SurveyCriterion {
  id: string;
  label: string;
  minRating: number;
  maxRating: number;
}

interface FeedbackItem {
  respondent: { id: string; name: string | null; email: string };
  text: string;
  rating: number;
}

interface PeerFeedbackViewProps {
  assignmentId: string;
  targetStudentId: string;
  criteria: SurveyCriterion[];
}

export default function PeerFeedbackView({
  assignmentId,
  targetStudentId,
  criteria,
}: PeerFeedbackViewProps) {
  const [feedback, setFeedback] = useState<Record<string, FeedbackItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/surveys/${assignmentId}/my-feedback?targetStudentId=${targetStudentId}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load feedback");
        }

        setFeedback(data.feedbackByCriterion || {});
      } catch (e: any) {
        setError(e.message || "Error loading feedback");
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [assignmentId, targetStudentId]);

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const hasFeedback = Object.values(feedback).some((items) => items.length > 0);

  if (!hasFeedback) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">No feedback received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">
        Peer Feedback About You
      </h3>
      <p className="text-sm text-gray-600">
        Here's what your teammates wrote about you for each criterion:
      </p>

      {criteria.map((criterion) => {
        const feedbackItems = feedback[criterion.id] || [];

        if (feedbackItems.length === 0) {
          return null;
        }

        // Calculate average rating
        const avgRating =
          feedbackItems.reduce((sum, item) => sum + item.rating, 0) /
          feedbackItems.length;

        return (
          <div
            key={criterion.id}
            className="border border-indigo-200 rounded-lg p-5 bg-indigo-50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                {criterion.label}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Average Rating:</span>
                <span className="text-lg font-bold text-indigo-700">
                  {avgRating.toFixed(1)} / {criterion.maxRating}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {feedbackItems.map((item, index) => (
                <div
                  key={`${item.respondent.id}-${index}`}
                  className="border-l-4 border-indigo-400 bg-white p-4 rounded-r-lg shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      {(item.respondent.name && item.respondent.name.trim()) || item.respondent.email}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded">
                      Rating: {item.rating} / {criterion.maxRating}
                    </span>
                  </div>
                  {item.text && (
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                      "{item.text}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

