const API_URL = "http://localhost:5000";

function getToken() {
  return window.localStorage.getItem("careeriq_token") ?? null;
}

function authedHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** ── DB-backed: fetch an existing interview session from the backend ── */
export async function fetchInterviewSession(sessionId) {
  const response = await fetch(
    `${API_URL}/api/interviews/sessions/${sessionId}`,
    { headers: authedHeaders() }
  ).catch(() => {
    throw new Error("Unable to reach the server. Make sure the backend is running on port 5000.");
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Failed to load interview session (${response.status}).`);
  return data;
}

/** ── Legacy standalone: generate questions fresh from a resume text ── */
export async function generateInterviewQuestions(resumeText) {
  if (!resumeText?.trim()) {
    throw new Error("Resume text is required to generate personalized questions.");
  }

  const response = await fetch(`${API_URL}/api/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume: resumeText }),
  }).catch(() => {
    throw new Error("Unable to reach the Qwen server. Start the backend on port 5000, then retry.");
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `Qwen could not generate questions (HTTP ${response.status}).`);
  }
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("Qwen returned no valid personalized questions. Please retry.");
  }

  return data.questions;
}
