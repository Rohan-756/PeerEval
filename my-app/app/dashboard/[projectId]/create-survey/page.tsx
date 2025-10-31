"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function CreateSurveyPage() {
  const { projectId } = useParams();
  const [questions, setQuestions] = useState([{ text: "", type: "text" }]);
  const [existingSurveys, setExistingSurveys] = useState([]);

  useEffect(() => {
    async function fetchSurveys() {
      const res = await fetch(`/api/surveys?projectId=${projectId}`);
      const data = await res.json();
      setExistingSurveys(data);
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
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, questions }),
    });

    if (res.ok) {
      alert("Survey created!");
      window.location.reload();
    } else {
      alert("Failed to create survey");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Survey</h1>

      {questions.map((q, i) => (
        <div key={i} className="mb-3">
          <input
            type="text"
            value={q.text}
            placeholder={`Question ${i + 1}`}
            onChange={(e) => handleQuestionChange(i, e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
      ))}

      <button
        onClick={handleAddQuestion}
        className="bg-gray-200 rounded px-3 py-1 mr-3"
      >
        + Add Question
      </button>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white rounded px-4 py-2"
      >
        Save Survey
      </button>

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-3">Existing Surveys</h2>
      {existingSurveys.length === 0 ? (
        <p>No surveys yet.</p>
      ) : (
        existingSurveys.map((s: any, idx) => (
          <div key={idx} className="border p-3 mb-2 rounded">
            <h3 className="font-medium">Survey #{s.id}</h3>
            <ul className="list-disc ml-5">
              {s.questions.map((q: any, qi: number) => (
                <li key={qi}>{q.text}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
