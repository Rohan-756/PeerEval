"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// Define the shape of the data for better type safety
interface Criterion {
  id: string;
  text: string;
  surveyId: string;
}

interface Survey {
  id: string;
  title: string;
  criteria: Criterion[]; // Updated from 'questions' to 'criteria'
}

export default function CreateSurveyPage() {
  const { projectId } = useParams();
  // 🟢 FIX 1: Initialize existingSurveys state to an empty array []
  const [questions, setQuestions] = useState([{ text: "", type: "text" }]);
  const [existingSurveys, setExistingSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const res = await fetch(`/api/surveys?projectId=${projectId}`);
        const data = await res.json();
        
        if (!res.ok) {
            console.error("Error fetching surveys:", data.error);
            // Even on error, the API now returns { surveys: [] }, but safety first
            setExistingSurveys(data.surveys || []); 
            return;
        }

        // 🟢 FIX 2: Access the 'surveys' array from the API response object
        setExistingSurveys(data.surveys || []);
      } catch (error) {
        console.error("Network error during survey fetch:", error);
        // On network failure, ensure state is still an empty array
        setExistingSurveys([]); 
      }
    }
    fetchSurveys();
  }, [projectId]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: "", type: "text" }]);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    // Basic validation for at least one question with text
    if (questions.every(q => !q.text.trim())) {
        alert("Please enter at least one question.");
        return;
    }

    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        projectId, 
        // Pass only the data required by the API
        questions: questions.filter(q => q.text.trim()).map(q => ({ text: q.text }))
      }),
    });

    if (res.ok) {
      alert("Survey created!");
      // 🟢 Update: Instead of full reload, better to refresh data
      window.location.reload(); 
    } else {
      const data = await res.json();
      alert(`Failed to create survey: ${data.error || res.statusText}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-lg my-10">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Create Peer Evaluation Survey</h1>

      {questions.map((q, i) => (
        <div key={i} className="mb-4 flex items-center space-x-2">
          <label className="text-gray-600 font-medium">Criterion {i + 1}:</label>
          <input
            type="text"
            value={q.text}
            placeholder={`Enter rating criterion text here (e.g., "Team Contribution")`}
            onChange={(e) => handleQuestionChange(i, e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ))}

      <div className="flex space-x-4 mb-8">
        <button
          onClick={handleAddQuestion}
          className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition font-medium"
        >
          + Add Criterion
        </button>

        <button
          onClick={handleSubmit}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition font-bold shadow-md"
        >
          Save Survey
        </button>
      </div>

      <hr className="my-6 border-gray-200" />

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Existing Surveys</h2>
      {existingSurveys.length === 0 ? (
        <p className="text-gray-500">No surveys yet for this project.</p>
      ) : (
        <ul className="space-y-4">
          {existingSurveys.map((s, idx) => (
            <li key={s.id} className="border border-indigo-200 p-4 rounded-lg bg-indigo-50">
              <h3 className="font-bold text-lg text-indigo-800 mb-2">
                {s.title}
                <span className="text-sm text-gray-500 ml-2">(ID: {s.id.substring(0, 8)}...)</span>
              </h3>
              <p className="font-medium text-gray-700 mb-1">Criteria:</p>
              <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600">
                {/* Updated from s.questions.map to s.criteria.map */}
                {s.criteria.map((q: Criterion, qi: number) => (
                  <li key={qi}>
                    {q.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
