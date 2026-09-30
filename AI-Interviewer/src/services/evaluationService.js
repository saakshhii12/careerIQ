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

/**
 * ── DB-backed: complete a session and save the evaluation to the database.
 * Used when the interview was launched from the main frontend (quiz passed).
 */
export async function completeInterviewSession(sessionId, answers, metadata = {}) {
  const response = await fetch(
    `${API_URL}/api/interviews/sessions/${sessionId}/complete`,
    {
      method: "POST",
      headers: authedHeaders(),
      body: JSON.stringify({ answers, metadata }),
    }
  ).catch(() => {
    throw new Error("Unable to reach the server. Make sure the backend is running on port 5000.");
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Interview completion failed (${response.status}).`);
  return body.evaluation;
}

/**
 * ── Legacy standalone: evaluate via /api/final-evaluation (not DB-backed).
 * Used in the standalone resume-upload flow only.
 */
export async function generateFinalEvaluation(resume, responses, metadata = {}) {
  const response = await fetch(`${API_URL}/api/final-evaluation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume,
      questions: responses.map(({ question }) => question),
      answers: responses.map(({ answer }) => answer),
      metadata,
    }),
  }).catch(() => {
    throw new Error("Unable to reach the Qwen server. Start the backend on port 5000, then retry.");
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Final evaluation API returned ${response.status}`);
  return body;
}
