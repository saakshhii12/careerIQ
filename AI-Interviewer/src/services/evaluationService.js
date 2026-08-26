const API_URL = "http://localhost:5000";

export async function generateFinalEvaluation(resume, responses, metadata = {}) {
  const response = await fetch(`${API_URL}/api/final-evaluation`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, questions: responses.map(({ question }) => question), answers: responses.map(({ answer }) => answer), metadata }),
  }).catch(() => { throw new Error("Unable to reach the Qwen server. Start the backend on port 5000, then retry."); });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Final evaluation API returned ${response.status}`);
  return body;
}
